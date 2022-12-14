<template>
  <div :class="darkMode ? 'dark' : 'light'">
    <div class="min-h-screen font-roboto bg-white text-black dark:bg-slate-800  dark:text-white">
      <Header :darkMode="darkMode" @changeDarkMode="darkMode = !darkMode" />

      <Nuxt />

      <Footer />

    </div>       
</div>
    
</template>

<script>
export default {
  name: 'default',
  data(){
    return {
      darkMode: true
    }
  }
}
</script>

<style>

</style>