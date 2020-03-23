import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export function createStore() {
  return new Vuex.Store({
    state: {
      movieList: []
    },
    mutations: {
      setMovieList(state, data) {
        state.movieList = data;
      }
    },
    actions: {
      // 为了保证数据能在页面渲染之前得到，这里用了async await
      async fetchMovieList({
        commit
      }) {
        await axios
          .get("https://douban.uieee.com/v2/movie/top250", {
            start: 1,
            count: 10
          })
          .then(res => {
            if (res.status == 200) {
              commit('setMovieList',res.data.subjects)
            }
          });
      }
    },
    modules: {}
  })
}