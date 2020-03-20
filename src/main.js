import Vue from 'vue'
import App from './App.vue'

//引入router
import {createRouter} from './router/index'

export function createApp() {
    const router = createRouter()
    const app = new Vue({
        router,
        render: h => h(App)
    });
    return {
        app,
        router
    }
}