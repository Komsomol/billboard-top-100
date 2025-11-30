import axios from 'axios';

const API_BASE = '/api';

/**
 * Fetches list of all available Billboard charts
 * @returns {Promise<Array>} Array of chart objects
 */
export const fetchChartsList = async () => {
  try {
    const response = await axios.get(`${API_BASE}/charts`);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch charts list:', error.message);
    throw error;
  }
};

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

/**
 * Fetches YouTube video data for a single song (for lazy loading)
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<Object|null>} Video data or null
 */
export const fetchVideo = async (title, artist) => {
  try {
    const response = await axios.get(`${API_BASE}/video`, {
      params: { title, artist }
    });
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch video:', error.message);
    return null;
  }
};

/**
 * Popular chart options for the dropdown
 */
export const POPULAR_CHARTS = [
  { value: 'hot-100', label: 'Hot 100' },
  { value: 'billboard-200', label: 'Billboard 200' },
  { value: 'artist-100', label: 'Artist 100' },
  { value: 'billboard-global-200', label: 'Global 200' },
  { value: 'hot-country-songs', label: 'Hot Country Songs' },
  { value: 'hot-rock-songs', label: 'Hot Rock Songs' },
  { value: 'hot-r-and-b-hip-hop-songs', label: 'Hot R&B/Hip-Hop Songs' },
  { value: 'pop-songs', label: 'Pop Songs' },
  { value: 'dance-electronic-songs', label: 'Dance/Electronic Songs' },
  { value: 'latin-songs', label: 'Hot Latin Songs' }
];
