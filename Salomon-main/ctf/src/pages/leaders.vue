<template>
    <div style="max-width: 50vw; margin: 0 auto;">
        <vs-table striped>
            <template #header>
                <vs-input v-model="search" border placeholder="Search"/>
            </template>
            <template #thead>
                <vs-tr>
                    <vs-th sort @click="leaders = $vs.sortData($event ,leaders, 'name')">{{language.team}}</vs-th>
                    <vs-th sort @click="leaders = $vs.sortData($event ,leaders, 'points')">{{language.points}}</vs-th>
                </vs-tr>
            </template>
            <template #tbody>
                <vs-tr v-for="(tr, i) in $vs.getPage($vs.getSearch(leaders, search), page, max)" :key="i" :data="tr">
                    <vs-td>{{ tr.name }}</vs-td>
                    <vs-td>{{ tr.points }}</vs-td>
                </vs-tr>
            </template>
            <template #footer>
                <vs-pagination v-model="page" :length="$vs.getLength($vs.getSearch(leaders, search), max)"/>
            </template>
        </vs-table>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'Leaders',
    props: {
        user: Object,
        language: Object
    },
    data() {
        return {
            search: "",
            leaders: [],
            page: 1,
            max: 5,
        }
    },
    created() {
        axios.get(`http://localhost:8088/api/leaders`).then((r) => {
            this.leaders = r.data.filter(u => !u.admin).sort((a, b) => b.points - a.points)
        });
    }
}
</script>

<style>
.vs-table-content {
    background-color: #1E2023;
}

.vs-table__td {
    text-align: left;
}
</style>
