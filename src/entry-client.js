import {
    createApp
} from './main'
import Vue from 'vue'

const {
    app,
    router,
    store
} = createApp();

Vue.mixin({
    // 组件初始化的时候，执行asyncData
    created() {
        const {
            asyncData
        } = this.$options
        if (asyncData) {
            asyncData({
                store: this.$store,
                route: this.$route
            })
        }
    }
})

if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__)
}

router.onReady(() => {
    router.beforeResolve((to, from, next) => {
        const matched = router.getMatchedComponents(to)
        const prevMatched = router.getMatchedComponents(from)

        let diffed = false

        // 返回即将要跳转的组件
        const activated = matched.filter((c, i) => {
            return diffed || (diffed = (prevMatched[i] !== c))
        })

        if (!activated.length) {
            return next()
        }

        // 遍历路由将要跳转的页面组件，如果有asyncData方法，就执行它
        Promise.all(activated.map(c => {
            if (c.asyncData) {
                return c.asyncData({
                    store,
                    route: to
                })
            }
        })).then(() => {
            next()
        }).catch(next)
    })
    app.$mount('#app')
})