import Vue from 'vue'
import App from './App.vue'
import MixinTitle from './title-mixin'

// 将title设置的方法混合进vue中
Vue.mixin(MixinTitle)

// 引入router
import {
    createRouter
} from './router/index'

// 引入store
import {
    createStore
} from './store/index'

// 引入sync
import {
    sync
} from 'vuex-router-sync'

export function createApp() {
    const router = createRouter()
    const store = createStore()

    // 让vuex和router数据保持一致
    sync(store, router)

    const app = new Vue({
        router,
        store,
        render: h => h(App)
    });
    return {
        app,
        router,
        store
    }
}