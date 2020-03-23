<template>
  <div class="about">
    <h1>This is an about page</h1>
    <ul>
      <li v-for="item,index in movieList" :key="index">{{item.title}}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "about",
  title: "about",
  data() {
    return {
      movieList: this.$store.state.movieList
    };
  },
  asyncData({ store, route }) {
    return store.dispatch("fetchMovieList");
  }
};
</script>

