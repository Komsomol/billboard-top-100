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
    loading,
    error,

    // Actions
    loadChart,
    loadChartsList,
    clearChart,
    getVideoForSong
  };
};
