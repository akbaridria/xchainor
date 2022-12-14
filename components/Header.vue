<template>
  <div class="container mx-auto p-5 flex items-center justify-end gap-x-3">
    <!-- <button class="group bg-slate-900 border-2 rounded-xl border-slate-600 py-1 text-sm text-white/50 px-2 flex items-center gap-x-2 hover:text-white hover:border-blue-600">
        <ion-icon name="wallet-outline" />
        <div class="lowercase">0x73E1...4D19</div>
        <ion-icon name="chevron-down" />
    </button> -->
    <button @click="$emit('changeDarkMode', !darkMode)" class="group text-slate-600 text-xl hover:text-blue-600">
        <ion-icon v-if="!darkMode" name="sunny-outline" size="lg" />
        <ion-icon v-if="darkMode" name="moon-outline" size="lg" />
    </button>
  </div>
</template>

<script>
export default {
  name: 'Header',
  props: {
      darkMode: {
        type: Boolean,
        required: false,
        default: true
      }
    }
}
</script>

<style>

</style>