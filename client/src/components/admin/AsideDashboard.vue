<template>
    <aside :class="['aside-dashboard', view, { fixed: isFixed && view === 'yeah' }]">
        <div>
            <ul>
                <li :class="getClassForPage('home')">
                    <router-link to="/admin">
                        <img :src="icons.home">
                        <p v-if="showPs">Home</p>
                    </router-link>
                </li>
                <li>
                    <router-link to="/admin">
                        <img :src="icons.form">
                        <p v-if="showPs">Formulários</p>
                    </router-link>
                </li>
                <ul class="forms">
                    <li>
                        <router-link to="/admin/register/coordenador">
                            <p v-if="showPs">Coordenadores</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/register/funcionario">
                            <p v-if="showPs">Funcionários</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/register/curso">
                            <p v-if="showPs">Cursos</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/register/turma">
                            <p v-if="showPs">Turmas</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/register/professor">
                            <p v-if="showPs">Professores</p>
                        </router-link>
                    </li>
                </ul>
                <li>
                    <router-link to="/admin">
                        <img :src="icons.table">
                        <p v-if="showPs">Tabelas</p>
                    </router-link>
                </li>
                <ul class="tables">
                    <li>
                        <router-link to="/admin/table/coordenador">
                            <p v-if="showPs">Coordenadores</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/table/funcionario">
                            <p v-if="showPs">Funcionários</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/table/curso">
                            <p v-if="showPs">Cursos</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/table/turma">
                            <p v-if="showPs">Turmas</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/table/professor">
                            <p v-if="showPs">Professores</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/table/estagio">
                            <p v-if="showPs">Estágios</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin/table/empresa">
                            <p v-if="showPs">Empresas</p>
                        </router-link>
                    </li>
                </ul>
                <li>
                    <router-link to="/admin">
                        <img :src="icons.ranking">
                        <p v-if="showPs">Rankings</p>
                    </router-link>
                </li>
                <ul>
                    <li>
                        <router-link to="/admin">
                            <p v-if="showPs">Geral</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin">
                            <p v-if="showPs">Nota</p>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/admin">
                            <p v-if="showPs">Atividade</p>
                        </router-link>
                    </li>
                </ul>
                <li>
                    <button @click="logout">
                        <img :src="icons.config">
                        <p v-if="showPs">Sair</p>
                    </button>
                </li>
            </ul>
        </div>
        <button @click="changePsVisualization">
            <img :src="icons.angulo" alt="<">
        </button>
    </aside>
</template>

<script>
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

// icons
import homeIcon from '../../assets/icons/casa.png';
import searchIcon from '../../assets/icons/procurar.png';
import linkIcon from '../../assets/icons/link.png';
import sendIcon from '../../assets/icons/aviao-de-papel.png';
import jobIcon from '../../assets/icons/estagio.png';
import rankingIcon from '../../assets/icons/trofeu.png';
import anguloIcon from '../../assets/icons/angulo.png';
import userIcon from '../../assets/icons/user.png';
import configIcon from '../../assets/icons/saida.png';
import formIcon from '../../assets/icons/forma.png';
import tablesIcon from '../../assets/icons/grafico-horizontal-simples.png';
import { mixinAdmin } from '../../util/authMixins';


export default defineComponent({
    name: 'AsideDashboard',
    emits: ['close'],
    props: {
        pageName: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            icons: {
                home: homeIcon,
                search: searchIcon,
                link: linkIcon,
                send: sendIcon,
                job: jobIcon,
                ranking: rankingIcon,
                angulo: anguloIcon,
                user: userIcon,
                config: configIcon,
                form: formIcon,
                table: tablesIcon
            },
            showPs: true,
            view: 'yeah',
            isFixed: false
        }
    },
    methods: {
        getClassForPage(pageLoad) {
            return this.pageName === pageLoad ? "page" : "";
        },
        changePsVisualization() {
            this.showPs = !this.showPs;
            this.view = this.showPs ? 'yeah' : 'none';
            localStorage.setItem('asideDashboardState', JSON.stringify({
                showPs: this.showPs,
                view: this.view
            }));
            this.updateFixedState();
        },
        loadStateFromStorage() {
            const state = localStorage.getItem('asideDashboardState');
            if (state) {
                const parsedState = JSON.parse(state);
                this.showPs = parsedState.showPs;
                this.view = parsedState.view;
            }
        },
        checkScreenWidth() {
            if (window.innerWidth < 1000) {
                this.showPs = false;
                this.view = 'none';
                this.updateFixedState();
            } else {
                this.isFixed = false;
                if (this.showPs) {
                    this.view = 'yeah';
                }
            }
            localStorage.setItem('asideDashboardState', JSON.stringify({
                showPs: this.showPs,
                view: this.view
            }));
        },
        updateFixedState() {
            this.isFixed = (this.view === 'yeah' && window.innerWidth < 1000);
        }
    },
    mounted() {
        this.loadStateFromStorage();
        this.checkScreenWidth();
        window.addEventListener('resize', this.checkScreenWidth);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.checkScreenWidth);
    },
    mixins: [mixinAdmin]
});
</script>

<style lang="scss" scoped>
@import "../../scss/layouts/aluno/_asideDashboard.scss";
</style>