// 获取组件内所配置的title值
function getTitle(vm) {
    const {
        title
    } = vm.$options;
    if (title) {
        return typeof title === 'function' ? title.call(vm) : title
    }
}

// 服务器端设置title
const serverTitleMixin = {
    created() {
        const title = getTitle(this)
        if (title && this.$ssrContext) {
            this.$ssrContext.title = title
        }
    }
}

// 客户端设置title
const clientTitleMixin = {
    mounted() {
        const title = getTitle(this)
        if (title) {
            document.title = title
        }
    }
}

// 根据环境变量去调用所需方法
export default process.env.VUE_APP_ENV === 'server' ? serverTitleMixin : clientTitleMixin