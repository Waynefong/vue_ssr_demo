# 基于Vue的SSR

## 先体验一下
* 先安装依赖：`npm install`或`cnpm install`
* 打包：`npm run build:win`或`npm run build:mac`，根据系统选择
* 运行：`npm run dev:serve`
* 然后右键查看网页源代码，你就会发现里面很多东西

## 研究背景
* 之前因为seo问题，曾经试过用nuxt.js写过项目，我也有分享过（[github链接](https://github.com/Waynefong/studyShare)）。但是总感觉不是特别的完美，可能也是因为当时使用的比较仓促导致没有研究特别细致的原因。
* 这次我打算研究一下官方的写法

## 前言
* 因为基本配置的代码都在项目里，所以md只会讲一些重点思路哦:)
* 很多教程会先教基本的渲染，运用到createRenderer，需要了解的同学可自行根据官方文档体验哦

## 官方介绍页面
* [Vue SSR 指南](https://ssr.vuejs.org/zh/)

## 项目组成
* Vue+VueX+Koa

## 准备
***环境搭建***
* 我用的是vue-cli3自带的新建项目UI界面进行创建
    ```
    vue ui
    ```
* 重点使用插件（排名不分先后），其它的可以看看package.json
    ```
    axios // 发送http请求
    cross-env // 可以在运行命令的时候设置一些值
    koa
    koa-router // koa路由
    koa-static // koa处理静态文件
    vue
    vue-router // vue路由
    vue-server-renderer // 基于vue的ssr核心渲染插件
    vuex
    vuex-router-sync // 让vuex和router保持数据一致
    ```

## Let's go!
***新建几个文件***
* entry-client.js（客户端入口文件）
* entry-server.js（服务器端入口文件）
* index.template.html（渲染模板）
* server.js（koa运行使用的入口文件）
* vue.config.js（vue-cli3的配置文件）

***index.template.js***
```
<!DOCTYPE html>
<html>
  <head>
    {{{ meta }}} // 三个花括号防止HTML转义
    <title>{{title}}</title>
  </head>
  <body>
    <div id="app">
    <!--vue-ssr-outlet--> // 必须要有这一句，不然渲染不出来
  </div>
  </body>
</html>
```

***改造***
* 我们需要把app、router、store改造成一个export
```
// 拿router来举例
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

//类似这样的一个导出方法，返回我们的路由实例，app和store同理
export function createRouter() {
  const routes = [
    ...
    {
      path: '/index',
      name: 'Home',
      component: Home
    }
    ...
  ]

  return new VueRouter({
    mode: 'history',
    routes
  })
}
```
注意：路由必须是history

***entry-client.js***
```
import {
    createApp
} from './main'
import Vue from 'vue'

const {
    app,
    router,
    store
} = createApp();

router.onReady(() => {
    app.$mount('#app')
})
```
在router都准备就绪以后，进行app的挂载

***entry-server.js***
```
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
            // 返回当前路由所匹配的组件，没有就reject并返回错误码
            const matchedComponents = router.getMatchedComponents();

            if (!matchedComponents.length) {
                return reject({
                    code: 404
                })
            }
            resolve(app)
        }, reject)
    })
}
```

***server.js***
```
// 引入客户端，服务端生成的json文件, html 模板文件
const serverBundle = require('./dist/vue-ssr-server-bundle.json');
const clientManifest = require('./dist/vue-ssr-client-manifest.json');

let renderer = require('vue-server-renderer').createBundleRenderer(serverBundle, {
  runInNewContext: false, // 推荐
  template: require('fs').readFileSync('./src/index.template.html', 'utf-8'), // 页面模板
  clientManifest // 客户端构建 manifest
});
```
在前言的时候，我提到了一般教程一开始会让你先用createRenderer，而我这里用的是createBundleRenderer，他们的区别是后者是使用了打包后的json进行页面渲染，所以如果有修改，就需要重新build出新的json，才会生效哦。
```
const context = {
    url: ctx.url,
    ...
  }
  try {
    const html = await renderer.renderToString(context);
    ctx.status = 200
    ctx.body = html;
  } catch (err) {
    handleError(err);
  }
```
在这里我们可以通过上下文，拿到当前路径的内容，将它塞到我们之前已经新建好的模板里。

***vue.config.js***
```
// 用于生成上述json文件
const VueSSRServerPlugin = require("vue-server-renderer/server-plugin");
const VueSSRClientPlugin = require("vue-server-renderer/client-plugin");
```
```
// 判断当前环境变量进行打包
const TARGET_NODE = process.env.WEBPACK_TARGET === "node";
const target = TARGET_NODE ? "server" : "client";

module.exports = {
    css: {
        extract: false
    },
    configureWebpack: () => ({
        // 将 entry 指向应用程序的 server / client 文件
        entry: `./src/entry-${target}.js`,
        
        ...

        // 根据TARGET_NODE去分别生成客户端、服务器端两个json文件
        plugins: [TARGET_NODE ? new VueSSRServerPlugin() : new VueSSRClientPlugin()]
    }),
    ...
};
```

---
以上大致就可以跑起来一个基础的ssr应用了

## 更多
* 实际情况下，当然不仅如此，还有很多不同的需求，我们接下来看。

***怎么自定义title？***
* 新建一个title-mixin.js文件
```
/**
* 公共获取title的方法，传入vue实例，如果组件里有定义title或者title(){}，则返回结果
* 从代码层面我们不难看出，有两种使用方式
* 1.title:'自定义标题'
* 2.title(){
*    return '自定义标题'
*   }
*/
function getTitle(vm) {
    const {
        title
    } = vm.$options;
    if (title) {
        return typeof title === 'function' ? title.call(vm) : title
    }
}

const serverTitleMixin = {
    // server只能识别到created
    created() {
        const title = getTitle(this)
        if (title && this.$ssrContext) {
            // 设置模板页面里的title
            this.$ssrContext.title = title
        }
    }
}

const clientTitleMixin = {
    mounted() {
        const title = getTitle(this)
        if (title) {
            // 简单粗暴。直接设置title
            document.title = title
        }
    }
}

export default process.env.VUE_APP_ENV === 'server' ? serverTitleMixin : clientTitleMixin
```

* 配置到全局
    * 我们可以在main.js里面加上
    ```
    import MixinTitle from './title-mixin'

    // mixin是vue提供的方法，可以在外部进行一个混合
    // 当然，不想配置到全局，你也可以引入到组件内单独使用
    Vue.mixin(MixinTitle)
    ```

***获取数据怎么进行渲染？***
* 因为渲染需要在页面加载前将数据加到页面中，所以我们不能直接的获取到this.xxx这样的值，因此我们可以考虑使用vuex
* 先将拿到的值放到template里，等页面加载的时候再从vuex里拿到相应的state，完成客户端和服务器端的渲染。
* 我们把获取数据的方法叫 asyncData
* 在entry-client.js中，我们加入
```
// 服务器端的state会自动序列化到window.__INITIAL_STATE__这个值内
if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__)
}

// 上面有说到，混合一个功能到vue实例中，这里就是判断组件中是否有asyncData，有的话执行
Vue.mixin({
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

router.onReady(() => {
    // 等路由都准备就绪以后，在加载前我们加一个钩子
    router.beforeResolve((to, from, next) => {
        const matched = router.getMatchedComponents(to)
        const prevMatched = router.getMatchedComponents(from)

        // 获取将要渲染的组件
        let diffed = false
        const activated = matched.filter((c, i) => {
            return diffed || (diffed = (prevMatched[i] !== c))
        })

        if (!activated.length) {
            return next()
        }
        
        // 判断获取到的组件里面有没有asyncData，有的话执行
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
    ...
})
```
* 在entry-server.js中，我们加入
```
...

export default context => {
    return new Promise((resolve, reject) => {
        const {
            app,
            router,
            store
        } = createApp();
        router.push(context.url)
        router.onReady(() => {
            ...
            
            // 判断获取到的组件里面有没有asyncData，有的话执行
            Promise.all(matchedComponents.map(Component => {
                if (Component.asyncData) {
                    return Component.asyncData({
                        store,
                        route: router.currentRoute
                    })
                }
            })).then(() => {
                // 将store里面的state赋值给上下文中的state，它会序列化到我们上面所说的window__INITIAL_STATE__这个值内
                context.state = store.state
                resolve(app)
            })
        }, reject)
    })
}
```
* 接下来可以直接在组件中使用asyncData
```
// About.vue

<script>
export default {
    ...

    // 在这里直接派发一个action去改变state
    asyncData({ store, route }) {
        // 我使用的是豆瓣电影top250的api
        return store.dispatch("fetchMovieList");
    }
}
</script>
```
* 因为axios是一个异步请求，所以我使用了async await来保证数据同步

***环境变量***
* 很多教程提到配置环境变量使用new webpack.DefinePlugin()，但其实vue-cli3里有更方便的方法，就是新建.env文件，可以通过判断是development还是production来读取文件里的环境变量，[官方也有提到](https://cli.vuejs.org/zh/guide/mode-and-env.html#%E6%A8%A1%E5%BC%8F)。
* 更或者说，可以用到我们开头说的cross-env也是非常方便的。
* 回看到title自定义那一块，其实我自定义了一个环境变量，VUE_APP_ENV。
* 以VUE_APP_*开头的环境变量，是可以自动被识别纳入到程序里面的哦。

## 部署
* 思路其实就是找一个可以运行node的工具
* 这里我选择了PM2
* 因为之前我也用过它来部署nuxt，相对有一些麻烦如果直接跑路径，因此这次我决定写一个配置文件
* 废话不多说

***pm2.conf.json***
```
{
    "apps":[
        {
            "name":"vue_ssr_demo",// 叫什么名字
            "script":"server.js",// 入口文件是什么
            "watch":true,
            "instances":6,// 线程
        }
    ]
}
```
这是很简单的一个配置，还有不少选项，大家可以自行度娘一下。

***大概是这么操作***
* 先打包好项目
* 将打包好生成的dist文件夹和pm2.conf.json、package.json、server.js、index.template.html放在一起（注意好文件本身所存在的位置，比如在src下，也要新建一个src文件夹扔进去）
* 运行一下`npm install`或者`cnpm install`，安装一下所需要的依赖
* 最后就是`pm2 start pm2.conf.json`，我们的项目就成功跑起来啦！
* 需要关闭、重启，可以使用一些字面意思的命令，比如`stop，restart，kill`

***windows下配置pm2开机自启***
* 安装`npm i pm2-windows-service -g`或者`cnpm i pm2-windows-service -g`
* 自定义安装一个windows服务`pm2-service-install -n myservice`（定义一个叫myservice的服务）
* 运行pm2`pm2 start pm2.conf.json`
* 查看一下是否运行成功`pm2 list`
* 记得要保存一下脚本`pm2 save`
* 这样就完成了自启配置（如果不行，可检查一下pm2的环境变量是否配置）

## 其它
***cross-env的妙用***
* 拿上述的部署来说，可能我们在执行node入口文件的时候，也存在一些环境变量的问题，那么我们就不能单纯的使用`pm2 start xxx`
* 这个时候我们可以把命令放到package.json里，通过cross-env的方式，去设置某些环境变量，最后再执行pm2
```
// package.json
{
  ...

  "scripts": {
    ...

    "run:pm2": "cross-env WEBPACK_TARGET=node VUE_APP_ENV=server pm2 start pm2.conf.json"
  },

  ...
}
```
这时候我们就需要换个方式去执行,用我们熟悉的`npm run run:pm2`就可以啦。

## 题外话
* 不知道有没有简单可靠的方法可以不通过vuex来做数据获取、渲染呢？
* 根路径/没有进行服务器渲染，可以解决吗？看了很多demo和文章都是做了重定向到别的路径下