import { Request, Response } from 'express';
import { CreateAlunoUseCase } from '../services/aluno/CreateAlunoUseCase';
import { CreatePreAlunoUseCase } from '../services/aluno/CreatePreAlunoUseCase';
import { LoginAlunoUseCase } from "../services/aluno/LoginAlunoUseCase";
import { RecoveryAluno } from "../services/aluno/RecoveryAlunoUseCase";
import { ValidateRecoveryUseCase } from "../services/aluno/ValidateRecoveryUseCase";
import { CompleteAlunoUseCase } from "../services/aluno/CompleteRegisterUseCase";
import { UpdateCurriculoUseCase } from "../services/aluno/UpdateCurriculoUseCase";
import { GetTurmasByCursoUseCase } from "../services/aluno/GetCourseYearUseCase";

export class CreateAlunoController {
    async handle(req: Request, res: Response) {
        const { email, token } = req.body;

        const createAlunoUseCase = new CreateAlunoUseCase();

        const result = await createAlunoUseCase.execute({ email, token });

        return res.status(201).json(result);
    }
}

export class CreatePreAlunoController {
    async handle(req: Request, res: Response) {
        const { name, email, password } = req.body;

        const createAlunoUseCase = new CreatePreAlunoUseCase();

        const result = await createAlunoUseCase.execute({ name, email, password });

        return res.status(201).json(result);
    }
}

export class LoginAlunoController {
    async handle(req: Request, res: Response) {
        const { email, password } = req.body;

        const loginAlunoUseCase = new LoginAlunoUseCase();

        const result = await loginAlunoUseCase.execute({ email, password });

        return res.status(201).json(result);
    }
}

export class RecoveryAlunoController {
    async handle(req: Request, res: Response) {
        const { name, email } = req.body;

        const loginAlunoUseCase = new RecoveryAluno();

        const result = await loginAlunoUseCase.execute({ name, email });

        return res.status(201).json(result);
    }
}

export class ValidateRecoveryController {
    async handle(req: Request, res: Response) {
        const { email, recoveryPassword, newPass } = req.body;

        const validateRecovery = new ValidateRecoveryUseCase();

        const result = await validateRecovery.execute({ email, recoveryPassword, newPass });

        return res.status(201).json(result);
    }
}

export class CompleteAlunoController {
    async handle(req: Request, res: Response) {
        const { nascimento, endereco, curso, inicio, rm } = req.body;
        const email = req.body.entidade.email;
        
        const completeAluno = new CompleteAlunoUseCase();

        const result = await completeAluno.execute({ email, nascimento, endereco, curso, inicio, rm });

        return res.status(201).json(result);
    }
}

export class UpdateCurriculoController {
    async handle(req: Request, res: Response) {
        const { email, curriculo } = req.body;

        const updateCurriculo = new UpdateCurriculoUseCase();

        const result = await updateCurriculo.execute({ email, curriculo });

        return res.status(201).json(result);
    }
}

export class GetCourseYearController {
    async handle(req: Request, res: Response) {
        const { curso, turno } = req.body;

        const getTurmasByCursoUseCase = new GetTurmasByCursoUseCase();

        const result = await getTurmasByCursoUseCase.execute({ curso, turno });

        return res.status(201).json(result);
    }
}