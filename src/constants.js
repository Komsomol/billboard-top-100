/**
 * Billboard Top 100 - Constants Module
 * Configuration constants for the scraper
 */

export const BILLBOARD_BASE_URL = 'https://www.billboard.com';
export const BILLBOARD_CHARTS_URL = `${BILLBOARD_BASE_URL}/charts/`;

/** Axios request timeout — long enough for Billboard's slow responses */
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/** Maximum number of fetch attempts per request (1 initial + 2 retries) */
export const MAX_RETRIES = 3;

/** Base delay between retries; multiplied by attempt number (linear backoff) */
export const RETRY_DELAY = 1000; // 1 second

/** Mimics a real browser to avoid being blocked by Billboard's CDN */
export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// NOTE: Stale SELECTORS export removed — authoritative selectors live in chart-parser.js

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
