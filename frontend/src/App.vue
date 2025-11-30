<script setup>
import { onMounted } from 'vue';
import { useChart } from './composables/useChart.js';
import ChartSelector from './components/ChartSelector.vue';
import SongList from './components/SongList.vue';
import LoadingState from './components/LoadingState.vue';
import ErrorState from './components/ErrorState.vue';

const {
  chart,
  selectedChart,
  selectedDate,
  loading,
  error,
  loadChart
} = useChart();

// Load default chart on mount
onMounted(() => {
  loadChart();
});

const handleFetch = () => {
  loadChart();
};

const handleRetry = () => {
  loadChart();
};
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="container">
        <h1>
          <span class="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </span>
          Billboard Charts
        </h1>
        <p class="subtitle">Discover top songs with music videos</p>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <ChartSelector
          v-model="selectedChart"
          v-model:selected-date="selectedDate"
          :loading="loading"
          @fetch="handleFetch"
        />

        <LoadingState
          v-if="loading"
          message="Fetching chart data..."
        />

        <ErrorState
          v-else-if="error"
          :message="error.message"
          :details="error.details"
          @retry="handleRetry"
        />

        <SongList
          v-else-if="chart"
          :songs="chart.songs"
          :chart-week="chart.week"
        />

        <div v-else class="empty-state">
          <p>Select a chart and click "Get Chart" to view songs</p>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <p>
          Powered by Billboard.com &amp; YouTube
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
/* Global styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f0f1a;
  color: #fff;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}

button {
  font-family: inherit;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  padding: 2rem 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 1px solid #333;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.icon {
  width: 36px;
  height: 36px;
  color: #6366f1;
}

.icon svg {
  width: 100%;
  height: 100%;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.main {
  flex: 1;
  padding: 2rem 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.footer {
  padding: 1.5rem 0;
  border-top: 1px solid #333;
  text-align: center;
}

.footer p {
  font-size: 0.875rem;
  color: #666;
}

@media (max-width: 640px) {
  .header h1 {
    font-size: 1.5rem;
  }

  .icon {
    width: 28px;
    height: 28px;
  }
}
</style>
