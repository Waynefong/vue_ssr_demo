import {
    createApp
} from './main'

export default context => {
    return new Promise((resolve, reject) => {
        const {
            app,
            router,
            store
        } = createApp();
        router.push(context.url)
        router.onReady(() => {
            // 返回匹配到的组件
            const matchedComponents = router.getMatchedComponents();

            if (!matchedComponents.length) {
                return reject({
                    code: 404
                })
            }
            Promise.all(matchedComponents.map(Component => {
                // 判断组件中是否有asyncData这个方法，有的话执行
                if (Component.asyncData) {
                    return Component.asyncData({
                        store,
                        route: router.currentRoute
                    })
                }
            })).then(() => {
                // 将执行更新后的state传到window.__INITIAL_STATE__
                context.state = store.state
                resolve(app)
            })
        }, reject)
    })
}