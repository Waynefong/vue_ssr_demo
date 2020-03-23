const Vue = require('vue');
const Koa = require('koa');
const Router = require('koa-router');
// const history = require('koa-connect-history-api-fallback')
const koaStatic = require('koa-static')

// 引入客户端，服务端生成的json文件, html 模板文件
const serverBundle = require('./dist/vue-ssr-server-bundle.json');
const clientManifest = require('./dist/vue-ssr-client-manifest.json');

// 通过createBundleRenderer进行json的加载
let renderer = require('vue-server-renderer').createBundleRenderer(serverBundle, {
  runInNewContext: false, // 推荐
  template: require('fs').readFileSync('./src/index.template.html', 'utf-8'), // 页面模板
  clientManifest // 客户端构建 manifest
});

// 创建koa koa-router实列
const app = new Koa();
const router = new Router();

const render = async (ctx, next) => {
  ctx.set('Content-Type', 'text/html')

  // 报错时返回
  const handleError = err => {
    if (err.code === 404) {
      ctx.status = 404
      ctx.body = '404 Page Not Found'
    } else {
      ctx.status = 500
      ctx.body = '500 Internal Server Error'
      console.error(`error during render : ${ctx.url}`)
      console.error(err.stack)
    }
  }

  // index.template.html插值默认的内容
  const context = {
    url: ctx.url,
    title: 'vue_ssr_demo',
    meta: `
      <meta charset="utf-8">
      <meta name="" content="vue_ssr_demo">
      <meta http-equiv="cache-control" content="no-cache" />
      <meta http-equiv="Pragma" content="no-cache" />
      <meta http-equiv="expires" content="0" />
    `
  }
  try {
    // 转换出整体的html
    const html = await renderer.renderToString(context);
    ctx.status = 200
    ctx.body = html;
  } catch (err) {
    handleError(err);
  }
  next();
}
// app.use(history());
// 设置静态资源文件
app.use(koaStatic('./dist'));
router.get('*', render);

// 加载路由组件
app
  .use(router.routes())
  .use(router.allowedMethods())

// 启动服务
app.listen(3000, () => {
  console.log(`server started at localhost:3000`);
});