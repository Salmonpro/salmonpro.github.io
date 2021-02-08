<template>
    <div id="app" v-if="!loading">
        <vs-navbar center-collapsed square>
            <template #left>
                <img src="./images/logo2.png" alt="" style="max-height: 40px;">
            </template>
            <vs-navbar-item :active="this.$route.path === '/'" id="main" :to="this.$route.path !== '/' && '/'">
                {{language.sidebar.main}}
            </vs-navbar-item>
            <vs-navbar-item :active="this.$route.path.startsWith('/leaders')" id="leaders" :to="this.$route.path !== '/leaders' && '/leaders'">
                {{language.sidebar.leaders}}
            </vs-navbar-item>
            <vs-tooltip right shadow v-if="!user">
                <vs-navbar-item :disabled="!user" :active="this.$route.path.startsWith('/challenges')" id="challenges" :to="this.$route.path !== '/challenges' && '/challenges'">
                    {{language.sidebar.challenges}}
                </vs-navbar-item>
                <template #tooltip>
                    <p>{{language.sidebar.authRequired}}</p>
                </template>
            </vs-tooltip>
            <vs-navbar-item v-if="user" :disabled="!user" :active="this.$route.path.startsWith('/challenges')" id="challenges" :to="this.$route.path !== '/challenges' && '/challenges'">
                {{language.sidebar.challenges}}
            </vs-navbar-item>
            <vs-navbar-group v-if="user && user.admin">
                {{language.sidebar.admin}}
                <template #items>
                    <vs-navbar-item @click="challenges.status = true; getchallenges(true)">{{language.sidebar.challenges}}</vs-navbar-item>
                    <vs-navbar-item @click="teams.status = true; agetteams()">{{language.sidebar.teams}}</vs-navbar-item>
                </template>
            </vs-navbar-group>
            <template #right>
                <vs-button v-if="!user" @click="openModal('auth')">{{language.sidebar.login}}</vs-button>
                <vs-button v-if="!user" @click="openModal('reg')">{{language.sidebar.register}}</vs-button>
                <vs-button flat v-if="user">Points: {{user.points}}</vs-button>
                <vs-button v-if="user" @click="logout()">{{language.sidebar.logout}}</vs-button>
            </template>
        </vs-navbar>
        <vs-dialog v-model="modal">
            <template #header>
                <h4 class="not-margin">{{language.welcomeTo}} <b>{{language.project}}</b></h4>
            </template>
            <div class="con-form">
                <vs-input v-model="team" :placeholder="language.team"/>
                <vs-input v-if="modalType === 'reg'" type="email" v-model="email" :placeholder="language.email"/>
                <vs-input type="password" v-model="password" :placeholder="language.password"/>
                <vs-input v-if="modalType === 'reg'" type="password" v-model="password2" :placeholder="language.password2"/>
            </div>
            <template #footer>
                <vs-button @click="useModal" block>{{language.sidebar[modalType === 'reg' ? 'register' : 'login']}}</vs-button>
            </template>
        </vs-dialog>
        <vs-dialog width="900px" not-center v-model="teams.status" v-if="user && user.admin" prevent-close>
            <vs-table>
                <template #header>
                    <vs-input v-model="search" border placeholder="Search"/>
                </template>
                <template #thead>
                    <vs-tr>
                        <vs-th sort @click="leaders = $vs.sortData($event ,teams.data, 'name')" style="width: 250px;">{{language.team}}</vs-th>
                        <vs-th sort @click="leaders = $vs.sortData($event ,teams.data, 'email')" style="width: 250px;">{{language.email}}</vs-th>
                        <vs-th sort @click="leaders = $vs.sortData($event ,teams.data, 'admin')" style="width: 50px;">{{language.admin}}</vs-th>
                        <vs-th sort @click="leaders = $vs.sortData($event ,teams.data, 'points')" style="width: 50px;">{{language.points}}</vs-th>
                    </vs-tr>
                </template>
                <template #tbody>
                    <vs-tr v-for="(tr, i) in $vs.getPage($vs.getSearch(teams.data, search), page, max)" :key="i" :data="tr">
                        <vs-td>{{ tr.name }}</vs-td>
                        <vs-td>{{ tr.email }}</vs-td>
                        <vs-td edit @click="aeditAdmin(tr.name, !tr.admin); tr.admin = !tr.admin">{{ tr.admin }}</vs-td>
                        <vs-td edit @click="editPoints = {active: true, team: tr.name, points: Number(tr.points)}">{{ tr.points }}</vs-td>
                        <template #expand>
                            <div class="con-content">
                                <vs-button border danger @click="deleteTeam = {active: true, team: tr.name}">Delete user</vs-button>
                            </div>
                        </template>
                    </vs-tr>
                </template>
                <template #footer>
                    <vs-pagination v-model="page" :length="$vs.getLength($vs.getSearch(teams.data, search), max)"/>
                </template>
            </vs-table>
            <vs-dialog overflow-hidden v-model="editPoints.active">
                <template #header>
                    <vs-input type="number" v-model="editPoints.points" placeholder="Points"/>
                </template>
                <div class="con-content">
                    <vs-button @click="editPoints.active=!editPoints.active; aeditpoints(editPoints.team, editPoints.points)">OK</vs-button>
                    <vs-button @click="editPoints.active=!editPoints.active">CANCEL</vs-button>
                </div>
            </vs-dialog>
            <vs-dialog overflow-hidden v-model="deleteTeam.active">
                <template #header>
                    <h3>Access action</h3>
                </template>
                <div class="con-content">
                    <vs-button @click="deleteTeam.active=!deleteTeam.active; adeleteTeam(deleteTeam.team)">OK</vs-button>
                    <vs-button @click="deleteTeam.active=!deleteTeam.active">CANCEL</vs-button>
                </div>
            </vs-dialog>
        </vs-dialog>
        <vs-dialog overflow-hidden v-model="challenges.status" prevent-close>
            <vs-table>
                <template #header>
                    <vs-input v-model="search" border placeholder="Search" icon-after @click-icon="aAddChallenge.status = true">
                        <template #icon>
                            <vs-button flat>Add</vs-button>
                        </template>
                    </vs-input>
                </template>
                <template #thead>
                    <vs-tr>
                        <vs-th sort @click="leaders = $vs.sortData($event ,challenges.data, 'name')" style="width: 250px;">{{language.name}}</vs-th>
                        <vs-th sort @click="leaders = $vs.sortData($event ,challenges.data, 'file')" style="width: 100px;">{{language.file}}</vs-th>
                        <vs-th sort @click="leaders = $vs.sortData($event ,challenges.data, 'points')" style="width: 50px;">{{language.points}}</vs-th>
                        <vs-th style="width: 50px;">{{language.delete}}</vs-th>
                    </vs-tr>
                </template>
                <template #tbody>
                    <vs-tr v-for="(tr, i) in $vs.getPage($vs.getSearch(challenges.data, search), chPage, 10)" :key="i" :data="tr">
                        <vs-td>{{ tr.name }}</vs-td>
                        <vs-td edit @click="downloadFile(tr._id + '.' + tr.file)">{{tr.file !== 'false' ? language.download : 'none'}}</vs-td>
                        <vs-td>{{ tr.points }}</vs-td>
                        <vs-td edit @click="delChallenge(tr._id); tr = null">Delete</vs-td>
                        <template #expand>
                            <div class="con-content">
                                <p style="white-space: pre-line; text-align: left;">{{tr.text}}</p>
                            </div>
                        </template>
                    </vs-tr>
                </template>
                <template #footer>
                    <vs-pagination v-model="chPage" :length="$vs.getLength($vs.getSearch(challenges.data, search), 10)"/>
                </template>
            </vs-table>
            <vs-dialog overflow-hidden v-model="aAddChallenge.status" prevent-close>
                <template #header>
                    <h3>Adding challenge</h3>
                </template>
                <vs-input type="text" v-model="aAddChallenge.name" placeholder="Name"/>
                <div class="vs-input-parent">
                    <textarea v-model="aAddChallenge.text" placeholder="Text" class="vs-input" style="min-width: 368px; max-width: 768px; border-radius: 10px; min-height: 200px; transition: height 0s;"/>
                </div>
                <div class="vs-input-parent">
                    <input type="file" ref="file" placeholder="File" v-on:change="handleFileUpload()" class="vs-input" style="min-width: 368px; width: auto; max-width: 768px; border-radius: 10px;">
                </div>
                <vs-input type="number" v-model="aAddChallenge.points" placeholder="Points"/>
                <vs-input type="text" v-model="aAddChallenge.answer" placeholder="Answer"/>
                <template #footer>
                    <vs-button block @click="addChallenge()">Add</vs-button>
                </template>
            </vs-dialog>
        </vs-dialog>
        <div class="content">
            <router-view v-if="challenges.data.length > 0" :openNotify="openNotify" :challenges="challenges.data" :language="language" :user="user" :downloadFile="downloadFile"/>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import language from './language.yaml'

export default {
    name: 'App',
    data() {
        return {
            language,
            loading: true,
            user: null,
            modal: false,
            modalType: "auth",
            team: '',
            email: '',
            password: '',
            password2: '',
            search: '',
            page: 1,
            chPage: 1,
            max: 10,
            aAddChallenge: {
                status: false,
                name: "",
                text: "",
                answer: "",
                file: [],
                points: 100,
            },
            deleteTeam: {
                active: false,
                team: ''
            },
            editPoints: {
                active: false,
                points: 0,
                team: ''
            },
            challenges: {
                status: false,
                data: []
            },
            teams: {
                status: false,
                data: []
            }
        }
    },
    created() {
        axios.get(`http://localhost:8088/api/info`, {
            withCredentials: true
        }).then((r) => {
            this.user = typeof r.data === 'object' ? r.data : null
            this.loading = false
        });
        this.getchallenges(false);
    },
    methods: {
        handleFileUpload() {
            this.aAddChallenge.file = this.$refs.file.files[0];
        },
        delChallenge(id) {
            axios.post(`http://localhost:8088/api/admin/deleteChallenge`, {
                _id: id
            }, {
                withCredentials: true
            });
        },
        addChallenge() {
            let formData = new FormData();
            formData.append('file', this.aAddChallenge.file);
            formData.append('name', this.aAddChallenge.name);
            formData.append('text', this.aAddChallenge.text);
            formData.append('points', this.aAddChallenge.points);
            formData.append('answer', this.aAddChallenge.answer);
            axios.post(`http://localhost:8088/api/admin/createChallenge`, formData, {
                headers: {
                    'Content-Type':'multipart/form-data'
                },
                withCredentials: true
            });
        },
        downloadFile(fileName) {
            axios({
                url: `http://localhost:8088/cdn/${fileName}`,
                method: 'GET',
                responseType: 'blob',
            }).then((response) => {
                let fileURL = window.URL.createObjectURL(new Blob([response.data]));
                let fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', fileName);
                document.body.appendChild(fileLink);
                fileLink.click();
            });
        },
        adeleteTeam(team) {
            axios.post(`http://localhost:8088/api/admin/delete`, {
                name: team
            }, {withCredentials: true})
        },
        aeditpoints(team, points) {
            axios.post(`http://localhost:8088/api/admin/editPoints`, {
                name: team,
                points: points
            }, {withCredentials: true})
        },
        aeditAdmin(team, status) {
            axios.post(`http://localhost:8088/api/admin/setAdmin`, {
                name: team,
                admin: status
            }, {withCredentials: true})
        },
        agetteams() {
            axios.post(`http://localhost:8088/api/admin/teams`, {}, {withCredentials: true}).then(d => {
                this.teams.data = d.data
            });
        },
        getchallenges(type) {
            axios.post(`http://localhost:8088/api/challenges`, {
                admin: type
            }, {withCredentials: true}).then(d => {
                this.challenges.data = d.data
            });
        },
        logout() {
            this.user = null
            axios.get(`http://localhost:8088/api/logout`,{withCredentials: true})
        },
        openModal(type) {
            this.modal = true
            this.modalType = type
        },
        openNotify(text) {
            this.$vs.notification({
                duration: 10000,
                progress: 'auto',
                text: text
            })
        },
        checkEmail() {
            return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.email)
        },
        useModal() {
            if(this.team.length <= 3) return this.openNotify(language.errors.login)
            if(this.password.length <= 3) return this.openNotify(language.errors.password)
            if(this.modalType === "reg" && this.password2 !== this.password) return this.openNotify(language.errors.password2)
            if(this.modalType === "reg" && (this.email.length <=3 || !this.checkEmail())) return this.openNotify(language.errors.email)
            axios.post(`http://localhost:8088/api/login`, {
                login: this.team,
                email: this.modalType === 'reg' ? this.email : null,
                pass: this.password
            }, {
                withCredentials: true
            }).then((r) => {
                if(r.data === 'err' && this.modalType !== 'reg') this.openNotify(language.checkData)
                else if(r.data === 'err' && this.modalType === 'reg') this.openNotify(language.checkDataReg)
                if(typeof r.data === 'object') {
                    this.user = typeof r.data === 'object' ? r.data : null
                    this.modal = false
                }
            })
        }
    }
}
</script>

<style>
html, body, #app {
    width: 100%;
    height: 100%;
    margin: 0;
}
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #f9f9f9;
    background: #18191C;
    font-family: 'Poppins', sans-serif;
    overflow-x: hidden;
    overflow-y: auto;
}
::-webkit-scrollbar {
    width: 5px;
    height: 5px;
    background: #18191C;
}
::-webkit-scrollbar-thumb {
    background-color: #b8b8b8;
    -webkit-appearance: none;
    border-radius: 20px;
}
p {
    margin: 0;
}
.vs-tooltip {
    background: #242529 !important;
    color: #f9f9f9 !important;
}
.content {
    padding-top: 50px;
}
[disabled] {
    opacity: 0.5 !important;
}
.vs-navbar__left {
    width: 200px;
}
.vs-navbar__right {
    width: 200px;
}
.con-footer {
    display: flex;
    justify-content: flex-end;
}
.con-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.con-content div {
    display: flex;
    align-items: center;
}
.vs-dialog .vs-input {
    width: 100%;
    margin: 10px 0;
    height: 40px;
}
.vs-table-content .vs-input {
    width: 100%;
}
.row {
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    display: flex;
    flex-wrap: wrap;
    margin-top: calc(var(--bs-gutter-y) * -1);
    margin-right: calc(var(--bs-gutter-x) / -2);
    margin-left: calc(var(--bs-gutter-x) / -2);
}

.col {
    flex: 1 0 0%;
}
</style>
