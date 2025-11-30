import {
  BillboardError,
  createNetworkError,
  createParseError,
  createNotFoundError,
  createInvalidInputError,
  createTimeoutError
} from '../src/errors.js';
import { ErrorCodes } from '../src/constants.js';

describe('errors', () => {
  describe('BillboardError', () => {
    it('creates error with message and code', () => {
      const error = new BillboardError('Test error', ErrorCodes.NETWORK_ERROR);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BillboardError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.NETWORK_ERROR);
      expect(error.name).toBe('BillboardError');
      expect(error.cause).toBeNull();
    });

    it('creates error with cause', () => {
      const cause = new Error('Original error');
      const error = new BillboardError('Wrapped error', ErrorCodes.PARSE_ERROR, cause);

      expect(error.cause).toBe(cause);
    });

    it('has stack trace', () => {
      const error = new BillboardError('Test', ErrorCodes.NOT_FOUND);
      expect(error.stack).toBeDefined();
    });
  });

  describe('error factory functions', () => {
    it('createNetworkError creates NETWORK_ERROR', () => {
      const error = createNetworkError('Network failed');

      expect(error).toBeInstanceOf(BillboardError);
      expect(error.code).toBe(ErrorCodes.NETWORK_ERROR);
      expect(error.message).toBe('Network failed');
    });

    it('createNetworkError includes cause', () => {
      const cause = new Error('Socket timeout');
      const error = createNetworkError('Network failed', cause);

      expect(error.cause).toBe(cause);
    });

    it('createParseError creates PARSE_ERROR', () => {
      const error = createParseError('Parse failed');

      expect(error.code).toBe(ErrorCodes.PARSE_ERROR);
    });

    it('createNotFoundError creates NOT_FOUND', () => {
      const error = createNotFoundError('Not found');

      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('createInvalidInputError creates INVALID_INPUT', () => {
      const error = createInvalidInputError('Invalid input');

      expect(error.code).toBe(ErrorCodes.INVALID_INPUT);
    });

    it('createTimeoutError creates TIMEOUT', () => {
      const error = createTimeoutError('Timed out');

      expect(error.code).toBe(ErrorCodes.TIMEOUT);
    });
  });
});
