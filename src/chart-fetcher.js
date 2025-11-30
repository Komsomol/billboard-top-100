/**
 * Billboard Top 100 - Chart Fetcher Module
 * HTTP fetching with retry logic and error handling
 */

import axios from 'axios';
import {
  BILLBOARD_CHARTS_URL,
  REQUEST_TIMEOUT,
  MAX_RETRIES,
  RETRY_DELAY,
  USER_AGENT
} from './constants.js';
import {
  createNetworkError,
  createTimeoutError
} from './errors.js';

/**
 * Delays execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates axios instance with default configuration
 * @returns {Object} Configured axios instance
 */
export const createHttpClient = () =>
  axios.create({
    timeout: REQUEST_TIMEOUT,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  });

/**
 * Determines if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
export const isRetryableError = (error) => {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNABORTED') {
    return true;
  }
  // Timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return true;
  }
  // Server errors (5xx)
  if (error.response?.status >= 500) {
    return true;
  }
  // Rate limiting
  if (error.response?.status === 429) {
    return true;
  }
  return false;
};

/**
 * Fetches HTML from a URL with retry logic
 * @param {string} url - URL to fetch
 * @param {number} [retries=MAX_RETRIES] - Number of retries remaining
 * @returns {Promise<string>} HTML content
 * @throws {BillboardError} On network failure after retries
 */
export const fetchWithRetry = async (url, retries = MAX_RETRIES) => {
  const client = createHttpClient();

  try {
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    // Check if we should retry
    if (retries > 0 && isRetryableError(error)) {
      await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1));
      return fetchWithRetry(url, retries - 1);
    }

    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw createTimeoutError(`Request timed out after ${REQUEST_TIMEOUT}ms: ${url}`, error);
    }

    // Handle 404
    if (error.response?.status === 404) {
      throw createNetworkError(`Chart not found (404): ${url}`, error);
    }

    // Generic network error
    throw createNetworkError(
      `Failed to fetch ${url}: ${error.message || 'Unknown error'}`,
      error
    );
  }
};

/**
 * Fetches chart data from Billboard
 * @param {string} chartName - Chart name (e.g., 'hot-100')
 * @param {string} [date=''] - Date in YYYY-MM-DD format
 * @returns {Promise<string>} HTML content
 */
export const fetchChart = async (chartName, date = '') => {
  const url = date
    ? `${BILLBOARD_CHARTS_URL}${chartName}/${date}`
    : `${BILLBOARD_CHARTS_URL}${chartName}`;

  return fetchWithRetry(url);
};

/**
 * Fetches list of all available charts
 * @returns {Promise<string>} HTML content
 */
export const fetchChartsList = async () => {
  return fetchWithRetry(BILLBOARD_CHARTS_URL);
};
