<script setup>
defineProps({
  message: {
    type: String,
    default: 'Something went wrong'
  },
  details: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['retry']);
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 sm:py-20 md:py-24 text-center gap-4">
    <!-- Error Icon -->
    <div class="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-red-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-full h-full">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>

    <!-- Error Message -->
    <h3 class="text-lg sm:text-xl md:text-2xl font-semibold text-white">
      {{ message }}
    </h3>

    <!-- Error Details -->
    <p v-if="details" class="text-gray-500 text-sm sm:text-base max-w-sm sm:max-w-md">
      {{ details }}
    </p>

    <!-- Retry Button -->
    <button
      @click="emit('retry')"
      class="mt-4 px-5 py-2.5 sm:px-6 sm:py-3
             bg-gray-800/50 border border-gray-700
             rounded-lg sm:rounded-xl
             text-sm sm:text-base text-white
             hover:bg-gray-700 hover:border-indigo-500
             transition-colors duration-200"
    >
      Try Again
    </button>
  </div>
</template>
