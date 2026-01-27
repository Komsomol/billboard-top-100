import axios from 'axios';

/**
 * Fetches chart data
 * In production: loads pre-rendered static JSON
 * In development: calls local API server
 */
export const fetchChart = async () => {
  try {
    // In production, load static pre-rendered data
    // In development, call the API server
    const isDev = import.meta.env.DEV;
    const url = isDev ? '/api/chart' : '/data/chart.json';

    const response = await axios.get(url);
    const data = isDev ? response.data : response.data;

    if (!data.success) {
      throw new Error(data.error || 'Failed to load chart data');
    }
    return data.data;
  } catch (error) {
    console.error('Failed to fetch chart:', error.message);
    throw error;
  }
};
