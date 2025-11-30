/**
 * Billboard Top 100 - Main Module
 * Public API for fetching Billboard chart data
 */

import { fetchChart, fetchChartsList } from './chart-fetcher.js';
import { parseChart, parseChartsList } from './chart-parser.js';
import { isValidChartName, isValidDateFormat } from './date-utils.js';
import { BillboardError, createInvalidInputError } from './errors.js';
import { ErrorCodes } from './constants.js';

/**
 * @typedef {Object} Song
 * @property {number} rank - Chart position
 * @property {string} title - Song title
 * @property {string} artist - Artist name
 * @property {string} cover - Cover image URL
 * @property {Object} position - Position details
 * @property {number|null} position.positionLastWeek - Position last week
 * @property {number|null} position.peakPosition - Peak chart position
 * @property {number|null} position.weeksOnChart - Weeks on chart
 */

/**
 * @typedef {Object} NeighborChart
 * @property {string} url - URL of the neighboring chart
 * @property {string} date - Date of the neighboring chart
 */

/**
 * @typedef {Object} Chart
 * @property {string} week - Chart week date (YYYY-MM-DD)
 * @property {Song[]} songs - Array of songs
 * @property {NeighborChart} previousWeek - Previous week's chart info
 * @property {NeighborChart} nextWeek - Next week's chart info
 */

/**
 * @typedef {Object} ChartInfo
 * @property {string} name - Chart name
 * @property {string} url - Chart URL
 */

/**
 * Gets chart data for a specific chart and date
 *
 * @param {string} [chartName='hot-100'] - Chart name (e.g., 'hot-100', 'billboard-200')
 * @param {string} [date=''] - Date in YYYY-MM-DD format (defaults to current week)
 * @returns {Promise<Chart>} Chart data
 * @throws {BillboardError} On invalid input, network error, or parse error
 *
 * @example
 * // Get current Hot 100
 * const chart = await getChart();
 *
 * @example
 * // Get specific chart and date
 * const chart = await getChart('billboard-200', '2024-01-15');
 *
 * @example
 * // With callback (legacy support)
 * getChart('hot-100', '2024-01-15', (err, chart) => {
 *   if (err) console.error(err);
 *   else console.log(chart);
 * });
 */
export const getChart = async (chartName, date, callback) => {
  // Handle callback-style invocation for backwards compatibility
  if (typeof chartName === 'function') {
    callback = chartName;
    chartName = 'hot-100';
    date = '';
  } else if (typeof date === 'function') {
    callback = date;
    date = '';
  }

  // Normalize arguments
  chartName = chartName || 'hot-100';
  date = date || '';

  // Create promise-based implementation
  const execute = async () => {
    // Validate chart name
    if (chartName && !isValidChartName(chartName)) {
      throw createInvalidInputError(
        `Invalid chart name: "${chartName}". Chart names should be lowercase with hyphens (e.g., "hot-100").`
      );
    }

    // Validate date if provided
    if (date && !isValidDateFormat(date)) {
      throw createInvalidInputError(
        `Invalid date format: "${date}". Use YYYY-MM-DD format (e.g., "2024-01-15").`
      );
    }

    const html = await fetchChart(chartName, date);
    return parseChart(html);
  };

  // Support both Promise and callback styles
  if (typeof callback === 'function') {
    try {
      const result = await execute();
      callback(null, result);
    } catch (error) {
      callback(error, null);
    }
  } else {
    return execute();
  }
};

/**
 * Lists all available Billboard charts
 *
 * @returns {Promise<ChartInfo[]>} Array of available charts
 * @throws {BillboardError} On network error or parse error
 *
 * @example
 * // Get all charts
 * const charts = await listCharts();
 * console.log(charts);
 * // [{ name: 'Hot 100', url: 'https://...' }, ...]
 *
 * @example
 * // With callback (legacy support)
 * listCharts((err, charts) => {
 *   if (err) console.error(err);
 *   else console.log(charts);
 * });
 */
export const listCharts = async (callback) => {
  const execute = async () => {
    const html = await fetchChartsList();
    return parseChartsList(html);
  };

  // Support both Promise and callback styles
  if (typeof callback === 'function') {
    try {
      const result = await execute();
      callback(null, result);
    } catch (error) {
      callback(error, null);
    }
  } else {
    return execute();
  }
};

// Re-export for public API
export { BillboardError, ErrorCodes };
