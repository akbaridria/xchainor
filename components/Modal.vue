<template>
  <div class="fixed top-0 left-0 right-0 z-50 h-full" @click="$emit('closeModal')">
    <div class="backdrop-blur-sm bg-white/30 flex items-center justify-center h-full">
        <div class="shadow-2xl shadow-white bg-slate-800 rounded-lg min-w-[340px] grid gap-3" @click.stop="">
          <div class="text-center pt-5 text-white/50">
            Select Token
          </div>
          <div class="group mx-5 flex justify-between items-center border-2 rounded-full border-slate-700 px-3 py-2 focus-within:border-blue-600">
            <input class="bg-slate-800 outline-0 text-sm text-white/50" type="text" placeholder="Search Token By Name">
            <ion-icon name="search-outline" class="text-xl text-slate-700" />
          </div>
          <div class="max-h-[50vh] no-scrollbar overflow-y-auto">
            <button @click.stop="$emit('closeModal')" class="group p-5 flex w-full items-center gap-x-3 text-sm py-2 hover:bg-blue-600" v-for="index in 10" :key="index">
              <img width="24px" src="https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png" alt="">
              <div class="flex flex-col">
                <div class="text-white">Avalanche</div>
                <div class="text-xs text-left text-white/50">Avax</div>
              </div>
            </button>
          </div>
        </div>
    </div>
  </div>
</template>

<script>
export default {

}
</script>

<style>

</style>