import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { prisma } from "../../../prisma/client";
import { AppError } from "../../../errors/error";
import { CompareBoletimDTO } from '../../interfaces/funcionarioDTOs';
import { clearUploads } from '../shared/helpers/helpers';
import { minioClient } from '../../../minioService';
import { Readable } from 'stream';

export class CompareBoletimUseCase {
    async execute({ boletimId, file }: CompareBoletimDTO) {
        if (!boletimId) {
            throw new AppError('ID do boletim não fornecido.');
        }

        if (!file || !file.path) {
            throw new AppError('Arquivo do boletim não fornecido.');
        }

        const boletim = await prisma.boletim.findUnique({
            where: {
                id: boletimId,
            },
        });

        if (!boletim) {
            throw new AppError('Boletim não encontrado.');
        }

        const bucketName = 'boot';
        const objectName = boletim.caminho;

        let storedFileBuffer: Buffer;
        try {
            storedFileBuffer = await this.getFileFromMinio(bucketName, objectName);
        } catch (error) {
            throw new AppError(`Erro ao baixar o arquivo do MinIO: ${error}`);
        }

        const storedFileText = await this.extractTextFromPdf(storedFileBuffer);

        const filePath = path.resolve(file.path);
        const uploadedFileBuffer = fs.readFileSync(filePath);
        const uploadedFileText = await this.extractTextFromPdf(uploadedFileBuffer);

        const isEqual = storedFileText === uploadedFileText;

        console.log(uploadedFileText);

        const novoStatus = isEqual ? 'APROVADO' : 'RECUSADO';

        if (isEqual) {
            const relevantText = this.extractRelevantText(storedFileText);

            const ano = this.extractYear(uploadedFileText);
            const materias = this.extractMateriasAndNotas(relevantText);

            console.log(ano, materias);
            if (ano) {
                await this.registerOrUpdateMaterias(ano, materias);
                
                await this.registerOrUpdateNotas(materias, boletim.alunoId, ano);

                await prisma.boletim.update({
                    where: { id: boletimId },
                    data: { status: novoStatus }
                });

            } else {
                throw new AppError(`Erro ao extrair texto do PDF`);
            }
        }

        await clearUploads();

        return { message: `Boletim ${novoStatus}.` };
    }

    async getFileFromMinio(bucketName: string, objectName: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            minioClient.getObject(bucketName, objectName, (error: Error | null, dataStream: Readable) => {
                if (error) {
                    return reject(error);
                }

                const chunks: Buffer[] = [];
                dataStream.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                });
                dataStream.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
                dataStream.on('error', (err: Error) => {
                    reject(err);
                });
            });
        });
    }

    async extractTextFromPdf(buffer: Buffer): Promise<string> {
        try {
            const data = await pdf(buffer);
            return data.text;
        } catch (error) {
            throw new AppError(`Erro ao extrair texto do PDF: ${error}`);
        }
    }

    private extractRelevantText(text: string): string {
        const startMatch = text.match(/Resultado\s*Final\s*por\s*Componente/i);
        const endMatch = text.match(/Assiduidade\s*Parcial/i);

        if (!startMatch || !endMatch) {
            throw new AppError("Texto do boletim incompleto ou não encontrado.");
        }

        const start = startMatch.index! + startMatch[0].length;
        const end = endMatch.index!;

        return text.slice(start, end).trim();
    }

    private extractYear(text: string): number {
        const startMatch = text.match(/Ano\s*Letivo\s*\/\s*Semestre:\s*/i);
        const endMatch = text.match(/\s*RM:/i);

        if (!startMatch || !endMatch) {
            throw new AppError("Texto do boletim incompleto ou não encontrado.");
        }

        const start = startMatch.index! + startMatch[0].length;
        const end = endMatch.index!;

        return parseInt(text.slice(start, end).trim());
    }


    private extractMateriasAndNotas(text: string): any[] {
        const materias: any[] = [];
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

        let buffer = "";

        lines.forEach((line) => {
            if (!/\d{2,3}/.test(line) || /^[A-Za-z\s]+$/.test(line)) {
                buffer += ` ${line}`;
            } else {
                buffer += ` ${line}`;
                const result = this.extractNotaFromLine(buffer.trim());
                if (result) {
                    materias.push(result);
                }
                buffer = "";
            }
        });

        if (buffer) {
            const result = this.extractNotaFromLine(buffer.trim());
            if (result) {
                materias.push(result);
            }
        }

        return materias;
    }

    private extractNotaFromLine(line: string): any | null {
        const match = line.match(/^(.+?)(\d[\d,]*)\s*(.*)/);

        if (!match) return null;

        const nomeMateria = match[1].trim();

        const bimestres = [];

        if (match) {
            const group3 = match[3];

            let i = 0;
            while (i < group3.length && bimestres.length < 4) {
                if (group3[i] === 'M' && group3[i + 1] === 'B') {
                    bimestres.push('MB');
                    i += 2;
                } else {
                    bimestres.push(group3[i]);
                    i += 1;
                }
            }

            console.log(bimestres);
        } else {
            throw new AppError(`Erro ao comparar boletins`);
        }

        return {
            materia: nomeMateria,
            bimestres
        };
    }

    private async registerOrUpdateMaterias(ano: number, materias: any[]) {
        for (const materia of materias) {
            const { materia: nomeMateria } = materia;

            // Verifica se a matéria já existe
            let materiaExistente = await prisma.materia.findFirst({
                where: { name: nomeMateria },
            });

            if (!materiaExistente) {
                // Registra a matéria se não existir
                materiaExistente = await prisma.materia.create({
                    data: { name: nomeMateria },
                });
            }
        }
    }

    private async registerOrUpdateNotas(
        materias: any[],
        alunoId: string,
        ano: number
    ) {
        for (const materia of materias) {
            const { materia: nomeMateria, bimestres } = materia;

            // Busca a matéria para associar ao registro de notas
            const materiaExistente = await prisma.materia.findFirst({
                where: { name: nomeMateria },
            });

            if (!materiaExistente) {
                throw new AppError(`Matéria "${nomeMateria}" não encontrada.`);
            }

            // Processa cada bimestre
            for (let i = 0; i < bimestres.length; i++) {
                const mencao = bimestres[i];
                const bimestre = i + 1;

                // Valida a menção
                if (!["MB", "B", "R", "I"].includes(mencao)) {
                    console.log(`Menção "${mencao}" inválida para "${nomeMateria}".`);
                    continue;
                }

                // Verifica se já existe nota para o aluno, matéria, ano e bimestre
                const notaExistente = await prisma.nota.findFirst({
                    where: {
                        alunoId,
                        materiaId: materiaExistente.id,
                        ano,
                        bimestre,
                    },
                });

                if (notaExistente) {
                    // Atualiza a nota se a menção for diferente
                    if (notaExistente.mencao !== mencao) {
                        await prisma.nota.update({
                            where: { id: notaExistente.id },
                            data: { mencao },
                        });
                    }
                } else {
                    // Cria nova nota
                    await prisma.nota.create({
                        data: {
                            alunoId,
                            materiaId: materiaExistente.id,
                            ano,
                            bimestre,
                            mencao,
                        },
                    });
                }
            }
        }
    }

}
