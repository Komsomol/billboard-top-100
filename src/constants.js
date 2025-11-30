/**
 * Billboard Top 100 - Constants Module
 * Configuration constants for the scraper
 */

export const BILLBOARD_BASE_URL = 'https://www.billboard.com';
export const BILLBOARD_CHARTS_URL = `${BILLBOARD_BASE_URL}/charts/`;

export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second

export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * CSS selectors for Billboard.com HTML parsing
 * These may need updates if Billboard changes their site structure
 */
export const SELECTORS = Object.freeze({
  CHART_ITEM: '.chart-list-item',
  DATE_SELECTOR: '.chart-detail-header__date-selector-button',
  DATE_OPTION: '.dropdown__date-selector-option',
  DATE_OPTION_DISABLED: 'dropdown__date-selector-option--disabled',
  CHART_PANEL_LINK: '.chart-panel__link'
});

/**
 * Enum for neighboring week types
 */
export const NeighboringWeek = Object.freeze({
  PREVIOUS: 1,
  NEXT: 2
});

/**
 * Error codes for BillboardError
 */
export const ErrorCodes = Object.freeze({
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  TIMEOUT: 'TIMEOUT'
});
