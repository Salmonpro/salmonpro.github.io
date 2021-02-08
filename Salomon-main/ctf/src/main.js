import Vue from 'vue'
import App from './App.vue'
import Vuesax from 'vuesax'
import VueRouter from 'vue-router'

import 'vuesax/dist/vuesax.css'

Vue.config.productionTip = false

Vue.use(Vuesax);
Vue.use(VueRouter);
import Leaders from './pages/leaders';
import Main from './pages/main';
import Challenges from './pages/challenges';

new Vue({
    render: h => h(App),
    router: new VueRouter({
        mode: 'history',
        routes: [
            {path: "/leaders", component: Leaders},
            {path: "/challenges", component: Challenges},
            {path: "/", component: Main},
        ]
    }),
    created() {
        this.$vs.setTheme("dark")
    }
}).$mount('#app')
