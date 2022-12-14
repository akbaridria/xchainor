<template>
  <div class="fixed top-0 left-0 right-0 z-50 h-full" @click="$emit('closeModal')">
    <div class="backdrop-blur-sm flex items-center justify-center h-full">
        <div class="bg-gray-200 dark:bg-slate-800 rounded-lg min-w-[340px] grid gap-3 pb-5" @click.stop="">
          <div class="text-center pt-5 text-gray dark:text-white/50">
            Select {{ identifier.postfix === 'token' ? 'Token' : 'Chain' }}
          </div>
          <div class="group mx-5 flex justify-between items-center border-2 rounded-full border-gray-400 dark:border-slate-700 px-3 py-2 focus-within:border-blue-600">
            <input v-model="search" value="" class="bg-gray-200 dark:bg-slate-800 outline-0 text-sm text-black dark:text-white/50" type="text" placeholder="Search Token By Name">
            <ion-icon name="search-outline" class="text-xl text-slate-700" />
          </div>
          <div class="max-h-[50vh] no-scrollbar overflow-y-auto">
            <button @click.stop="$emit('closeModal', {item, identifier})" class="group p-5 flex w-full items-center gap-x-3 text-sm py-2 hover:bg-blue-600" v-for="(item, index) in filteredList" :key="index">
              <img class="rounded-full" width="24px" :src="item.logoURI" alt="">
              <div class="flex flex-col">
                <div class="text-black dark:text-white">{{ item.name }}</div>
                <div class="text-xs text-left text-gray dark:text-white/50">{{item.symbol}}</div>
              </div>
            </button>
          </div>
        </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
  data(){
    return {
      search: ''
    }
  },
  props: {
    listModal: {
      type: Array,
      required: false,
      default: []
    },
    identifier: {
      type: Object,
      required: false,
      default: {postfix: 'token', prefix: 'from'}
    }
  },
  computed: {
    filteredList() {
      return this.listModal.filter(elem => {
        return elem.symbol.toLowerCase().includes(this.search.toLowerCase())
      })
    }
  }
}
</script>

<style>

</style>