import axios from 'axios';

const API_BASE = '/api';

/**
 * Fetches chart data for a specific chart
 * @param {string} chartName - Chart name (e.g., 'hot-100')
 * @param {string} [date] - Optional date in YYYY-MM-DD format
 * @returns {Promise<Object>} Chart data with songs array
 */
export const fetchChart = async (chartName = 'hot-100', date = '') => {
  try {
    const url = date
      ? `${API_BASE}/chart/${chartName}?date=${date}`
      : `${API_BASE}/chart/${chartName}`;

    const response = await axios.get(url);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch chart:', error.message);
    throw error;
  }
};
