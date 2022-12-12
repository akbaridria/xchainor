<template>
  <div class="h-full container mx-auto flex items-center justify-center py-10">
    <div class="bg-slate-900 p-5 rounded-xl min-w-[350px] grid gap-y-6 shadow-2xl shadow-blue-600/40">
      <div class="flex justify-end">
        Powered By Axelar
      </div>
      <div class="grid gap-y-1">
        <div class="relative bg-slate-800 rounded-xl p-2 grid gap-y-2">
          <button class="group text-sm flex items-center gap-x-2" @click="openModal = true">
            <div class="text-white/50">From</div> 
            <div class="flex gap-x-2 text-base items-center">Avalanche <img src="https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=023" alt="avalanche" width="18" /></div>
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          <div class="p-2 border-slate-400 flex justify-between">
            <input type="number" pattern="[0-9]+([,\.][0-9]+)?" class="bg-slate-800 text-lg rounded-lg text-white focus:outline-0" placeholder="0.0">
            <div class="flex items-center bg-slate-600 p-2 rounded-full gap-x-1 text-sm cursor-pointer hover:outline outline-offset-1 outline-1 outline-blue-600 transition-all">
              <img width="18px" src="https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png" alt="">
              <div>
                Avax
              </div>
              <ion-icon name="chevron-down"></ion-icon>
            </div>
          </div>
        </div>
        <div class="mx-auto">
          <ion-icon name="caret-down-circle-sharp" />
        </div>
        <div class="bg-slate-800 rounded-xl p-2 grid gap-y-2">
          <div class="text-sm flex items-center gap-x-2">
            <div class="text-white/50">To</div> 
            <div class="flex gap-x-2 text-base items-center">Avalanche <img src="https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=023" alt="avalanche" width="18" /></div>
            <ion-icon name="chevron-down"></ion-icon>
          </div>
          <div class="p-2 border-slate-400 flex justify-between">
            <input type="number" pattern="[0-9]+([,\.][0-9]+)?" class="bg-slate-800 text-lg rounded-lg text-white focus:outline-0" placeholder="0.0">
            <button class="group flex items-center bg-slate-600 p-2 rounded-full gap-x-1 text-sm cursor-pointer hover:outline outline-offset-1 outline-1 outline-blue-600 transition-all">
              <img width="18px" src="https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png" alt="">
              <div>
                Avax
              </div>
              <ion-icon name="chevron-down"></ion-icon>
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <button class="px-3 w-full py-2 text-sm bg-blue-600 rounded-full font-semibold hover:bg-blue-600/50 transition-colors">
          Connect Wallet
        </button>
      </div>

      <div class="bg-slate-800 rounded-lg p-2 text-sm grid gap-y-2">
        <div class="flex justify-between">
          <div>Relayer Gas Fee <ion-icon name="alert-circle-outline" /></div>
          <div>3 axlUSDC</div>
        </div>
        <div class="flex justify-between">
          <div>Estimated Wait Time <ion-icon name="alert-circle-outline" /></div>
          <div>~ 3minutes</div>
        </div>
      </div>
    </div>

    <Modal v-if="openModal" @closeModal="openModal = false" />
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  data(){
    return {
      openModal: false
    }
  },
}
</script>
