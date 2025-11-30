<script setup>
import { onMounted } from 'vue';
import { useChart } from './composables/useChart.js';
import SongList from './components/SongList.vue';
import LoadingState from './components/LoadingState.vue';
import ErrorState from './components/ErrorState.vue';

const { chart, loading, error, loadChart } = useChart();

onMounted(() => {
  loadChart();
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="py-6 sm:py-8 md:py-10 lg:py-12 text-center">
      <div class="container-app">
        <div class="flex items-center justify-center gap-3 sm:gap-4">
          <!-- Logo -->
          <div class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                      rounded-xl sm:rounded-2xl flex items-center justify-center text-white
                      shadow-lg"
               style="background: linear-gradient(135deg, var(--color-billboard-accent), var(--color-billboard-accent-dark)); box-shadow: 0 10px 15px -3px rgba(255, 107, 107, 0.2);">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <!-- Title -->
          <div class="text-left">
            <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              Billboard Hot 100
            </h1>
            <p class="text-gray-400 text-xs sm:text-sm md:text-base mt-0.5">
              This Week's Top 20
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 pb-6 sm:pb-8 md:pb-10">
      <div class="container-app">
        <LoadingState v-if="loading" message="Loading chart..." />

        <ErrorState
          v-else-if="error"
          :message="error.message"
          :details="error.details"
          @retry="loadChart"
        />

        <SongList
          v-else-if="chart"
          :songs="chart.songs"
          :chart-week="chart.week"
        />
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-4 sm:py-6 text-center">
      <p class="text-xs sm:text-sm text-gray-500">Data from Billboard.com</p>
    </footer>
  </div>
</template>
