<script setup>
defineProps({
  message: {
    type: String,
    default: 'Loading...'
  }
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 sm:py-20 md:py-24 gap-6">
    <!-- Music Bars Animation -->
    <div class="flex gap-1 items-end h-10 sm:h-12">
      <div class="w-2 sm:w-2.5 h-5 bg-gradient-to-t from-indigo-500 to-purple-500 rounded animate-pulse-bar delay-0"></div>
      <div class="w-2 sm:w-2.5 h-7 bg-gradient-to-t from-indigo-500 to-purple-500 rounded animate-pulse-bar delay-100"></div>
      <div class="w-2 sm:w-2.5 h-10 bg-gradient-to-t from-indigo-500 to-purple-500 rounded animate-pulse-bar delay-200"></div>
      <div class="w-2 sm:w-2.5 h-7 bg-gradient-to-t from-indigo-500 to-purple-500 rounded animate-pulse-bar delay-300"></div>
      <div class="w-2 sm:w-2.5 h-5 bg-gradient-to-t from-indigo-500 to-purple-500 rounded animate-pulse-bar delay-400"></div>
    </div>
    <p class="text-gray-400 text-sm sm:text-base">{{ message }}</p>
  </div>
</template>

<style scoped>
@keyframes pulse-bar {
  0%, 100% {
    transform: scaleY(0.5);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

.animate-pulse-bar {
  animation: pulse-bar 1s ease-in-out infinite;
}

.delay-0 { animation-delay: 0s; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
</style>
