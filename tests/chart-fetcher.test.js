import {
  isRetryableError,
  delay,
  createHttpClient
} from '../src/chart-fetcher.js';

// Note: fetchChart and fetchChartsList are tested in integration tests
// These unit tests cover the utility functions

describe('chart-fetcher', () => {
  describe('delay', () => {
    it('delays for specified milliseconds', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('isRetryableError', () => {
    it('returns true for ECONNRESET', () => {
      const error = new Error('Connection reset');
      error.code = 'ECONNRESET';
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for ENOTFOUND', () => {
      const error = new Error('DNS lookup failed');
      error.code = 'ENOTFOUND';
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for ECONNABORTED', () => {
      const error = new Error('Connection aborted');
      error.code = 'ECONNABORTED';
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for timeout errors', () => {
      const error = new Error('timeout of 30000ms exceeded');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for 5xx server errors', () => {
      const error = new Error('Server error');
      error.response = { status: 500 };
      expect(isRetryableError(error)).toBe(true);

      error.response.status = 503;
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for rate limiting (429)', () => {
      const error = new Error('Too many requests');
      error.response = { status: 429 };
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns false for 4xx client errors (except 429)', () => {
      const error = new Error('Not found');
      error.response = { status: 404 };
      expect(isRetryableError(error)).toBe(false);

      error.response.status = 400;
      expect(isRetryableError(error)).toBe(false);
    });

    it('returns false for generic errors', () => {
      const error = new Error('Something went wrong');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('createHttpClient', () => {
    it('creates axios instance with defaults', () => {
      const client = createHttpClient();

      expect(client).toBeDefined();
      expect(client.defaults).toBeDefined();
      expect(client.defaults.timeout).toBe(30000);
      expect(client.defaults.headers['User-Agent']).toBeDefined();
    });
  });
});
