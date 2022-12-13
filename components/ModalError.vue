<template>
  <div class="fixed top-0 left-0 right-0 z-50 h-full" @click="$emit('closeModal')">
    <div class="backdrop-blur-sm  flex items-center justify-center h-full">
        <div class="bg-slate-800 rounded-lg max-w-[340px] grid gap-3 p-5 text-left" @click.stop="">
          <div class="flex items-center justify-between gap-x-2 font-bold" >
            <div>
              {{ title }} <ion-icon name="alert-circle"></ion-icon>
            </div>
            <div>
              <ion-icon name="close-outline" class="cursor-pointer text-blue-600 text-2xl"></ion-icon>
            </div>
          </div>
          <div>
            {{ description }}
          </div>
        </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal Error',
  props: {
    title: {
      type: String,
      required: false,
      default: 'Alert'
    },
    description: {
      type: String,
      required: false,
      default: 'Make sure that you choose different chain.'
    }
  }
}
</script>

<style>

</style>