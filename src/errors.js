/**
 * Billboard Top 100 - Errors Module
 * Custom error classes for better error handling
 */

import { ErrorCodes } from './constants.js';

/**
 * Custom error class for Billboard scraping errors
 */
export class BillboardError extends Error {
  /**
   * Creates a new BillboardError
   * @param {string} message - Error message
   * @param {string} code - Error code from ErrorCodes
   * @param {Error} [cause] - Original error that caused this error
   */
  constructor(message, code, cause = null) {
    super(message);
    this.name = 'BillboardError';
    this.code = code;
    this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a network error
 * @param {string} message - Error message
 * @param {Error} [cause] - Original error
 * @returns {BillboardError}
 */
export const createNetworkError = (message, cause = null) =>
  new BillboardError(message, ErrorCodes.NETWORK_ERROR, cause);

/**
 * Creates a parse error
 * @param {string} message - Error message
 * @param {Error} [cause] - Original error
 * @returns {BillboardError}
 */
export const createParseError = (message, cause = null) =>
  new BillboardError(message, ErrorCodes.PARSE_ERROR, cause);

/**
 * Creates a not found error
 * @param {string} message - Error message
 * @returns {BillboardError}
 */
export const createNotFoundError = (message) =>
  new BillboardError(message, ErrorCodes.NOT_FOUND);

/**
 * Creates an invalid input error
 * @param {string} message - Error message
 * @returns {BillboardError}
 */
export const createInvalidInputError = (message) =>
  new BillboardError(message, ErrorCodes.INVALID_INPUT);

/**
 * Creates a timeout error
 * @param {string} message - Error message
 * @param {Error} [cause] - Original error
 * @returns {BillboardError}
 */
export const createTimeoutError = (message, cause = null) =>
  new BillboardError(message, ErrorCodes.TIMEOUT, cause);
