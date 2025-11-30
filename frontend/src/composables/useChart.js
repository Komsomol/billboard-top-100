import { ref } from 'vue';
import { fetchChart, fetchChartsList } from '../services/billboard.js';

/**
 * Composable for managing Billboard chart data
 * Video data is now included in the API response (server-side enrichment)
 */
export const useChart = () => {
  // State
  const chart = ref(null);
  const chartsList = ref([]);
  const selectedChart = ref('hot-100');
  const selectedDate = ref('');
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetches chart data (videos included from server)
   */
  const loadChart = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await fetchChart(selectedChart.value, selectedDate.value);
      chart.value = data;
    } catch (err) {
      error.value = {
        message: 'Failed to load chart',
        details: err.message
      };
      chart.value = null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Loads list of available charts
   */
  const loadChartsList = async () => {
    try {
      const data = await fetchChartsList();
      chartsList.value = data;
    } catch (err) {
      console.error('Failed to load charts list:', err.message);
    }
  };

  /**
   * Clears current chart data
   */
  const clearChart = () => {
    chart.value = null;
    error.value = null;
  };

  // Current year for navigation
  const currentYear = ref(new Date().getFullYear());

  /**
   * Navigate to previous year's chart
   */
  const goToPreviousYear = async () => {
    currentYear.value -= 1;
    selectedDate.value = `${currentYear.value}-06-15`;
    await loadChart();
  };

  /**
   * Navigate to next year's chart
   */
  const goToNextYear = async () => {
    const thisYear = new Date().getFullYear();
    if (currentYear.value >= thisYear) return;
    currentYear.value += 1;
    // If current year, don't set a date (get latest)
    if (currentYear.value === thisYear) {
      selectedDate.value = '';
    } else {
      selectedDate.value = `${currentYear.value}-06-15`;
    }
    await loadChart();
  };

  /**
   * Gets video for a song by index
   * @param {number} index - Song index
   * @returns {Object|null} Video data or null
   */
  const getVideoForSong = (index) => {
    if (!chart.value || !chart.value.songs[index]) {
      return null;
    }
    return chart.value.songs[index].video || null;
  };

  return {
    // State
    chart,
    chartsList,
    selectedChart,
    selectedDate,
    currentYear,
    loading,
    error,

    // Actions
    loadChart,
    loadChartsList,
    clearChart,
    getVideoForSong,
    goToPreviousYear,
    goToNextYear
  };
};
