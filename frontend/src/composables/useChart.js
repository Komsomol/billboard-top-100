import { ref } from 'vue';
import { fetchChart } from '../services/billboard.js';

/**
 * Composable for managing Billboard chart data
 */
export const useChart = () => {
  const chart = ref(null);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetches current week's Hot 100 chart
   */
  const loadChart = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await fetchChart('hot-100');
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

  return {
    chart,
    loading,
    error,
    loadChart
  };
};
