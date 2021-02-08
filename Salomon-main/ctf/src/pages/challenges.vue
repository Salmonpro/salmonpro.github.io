<template>
    <div style="text-align: left; padding: 0 15px;">
        <div v-for="count in counts" :key="count.s">
            <div>
                <h2 style="margin-bottom: 0;">{{count.s}} {{language.points}}</h2>
                <div class="cards row">
                    <div :disable="user.completed.includes(item._id)" class="card col" v-for="item in challenges.filter(r => r.points >= count.s && r.points < count.e)" :key="item._id" @click="setModal(item)" :style="user.completed.includes(item._id) ? {borderBottom: '2px solid green'} : {}">
                        <p>{{item.name}}</p>
                        <p>{{item.points}} {{language.points}}</p>
                    </div>
                </div>
            </div>
        </div>
        <vs-dialog overflow-hidden v-model="modal.status" prevent-close>
            <template #header>
                <h3>{{modal.item.name}}</h3>
            </template>
            <p>{{modal.item.text}}</p>
            <vs-button v-if="modal.item.file !== 'false'" @click="downloadFile(modal.item._id + '.' + modal.item.file)">Download file</vs-button>
            <template #footer>
                <vs-input type="text" v-model="answer" placeholder="Answer"/>
                <vs-button style="margin-left: 0;" block @click="setAnswer(modal.item._id, answer)">{{language.answer}}</vs-button>
            </template>
        </vs-dialog>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'Main',
    props: {
        downloadFile: Function,
        openNotify: Function,
        user: Object,
        challenges: Array,
        language: Object
    },
    data() {
        return {
            modal: {
                status: false,
                item: {}
            },
            challenge: null,
            answer: '',
            counts: [
                {s: 100, e: 200,},
                {s: 200, e: 300,},
                {s: 300, e: 400,},
                {s: 400, e: 500,},
                {s: 500, e: 99999999999999999999,},
            ]
        }
    },
    methods: {
        setAnswer(id, answer) {
            axios.post(`http://localhost:8088/api/ansChallenge`, {id, answer}, {
                withCredentials: true
            }).then(r => {
                if(r.data === "err") this.openNotify(this.language.errors.answer)
                else {
                    this.user = r.data
                    this.modal = {
                        status: false,
                        item: {}
                    }
                }
            });
        },
        setModal(item) {
            if(!this.user.completed.includes(item._id)) this.modal = {
                status: true,
                item: item
            }
        }
    },
}
</script>

<style>
.vs-card__group-cards {
    width: 100% !important;
}
.cards {
    display: flex;
    align-items: center;
    justify-content: center;
}

.card {
    max-width: 250px !important;
    min-width: 250px !important;
    padding: 15px;
    background-color: #1E2023;
    margin: 5px 15px;
    border-radius: 10px;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}
.card:hover {
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
}
</style>
