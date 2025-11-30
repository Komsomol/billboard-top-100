import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load test fixtures
const sampleChartHtml = readFileSync(
  join(__dirname, 'fixtures', 'sample-chart.html'),
  'utf8'
);
const sampleChartsListHtml = readFileSync(
  join(__dirname, 'fixtures', 'sample-charts-list.html'),
  'utf8'
);

// Mock the chart-fetcher module
jest.unstable_mockModule('../src/chart-fetcher.js', () => ({
  fetchChart: jest.fn(),
  fetchChartsList: jest.fn()
}));

// Import after mocking
const { fetchChart, fetchChartsList } = await import('../src/chart-fetcher.js');
const { getChart, listCharts, BillboardError, ErrorCodes } = await import('../src/index.js');

describe('index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exports', () => {
    it('exports getChart function', () => {
      expect(typeof getChart).toBe('function');
    });

    it('exports listCharts function', () => {
      expect(typeof listCharts).toBe('function');
    });

    it('exports BillboardError class', () => {
      expect(BillboardError).toBeDefined();
    });

    it('exports ErrorCodes', () => {
      expect(ErrorCodes).toBeDefined();
      expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
    });
  });

  describe('getChart', () => {
    it('returns chart data with Promise API', async () => {
      fetchChart.mockResolvedValue(sampleChartHtml);

      const chart = await getChart('hot-100', '2016-11-19');

      expect(chart).toHaveProperty('week');
      expect(chart).toHaveProperty('songs');
      expect(chart.songs.length).toBeGreaterThan(0);
    });

    it('uses default chart name when not provided', async () => {
      fetchChart.mockResolvedValue(sampleChartHtml);

      await getChart();

      expect(fetchChart).toHaveBeenCalledWith('hot-100', '');
    });

    it('uses default date when not provided', async () => {
      fetchChart.mockResolvedValue(sampleChartHtml);

      await getChart('billboard-200');

      expect(fetchChart).toHaveBeenCalledWith('billboard-200', '');
    });

    it('supports callback API for backwards compatibility', (done) => {
      fetchChart.mockResolvedValue(sampleChartHtml);

      getChart('hot-100', '2016-11-19', (err, chart) => {
        expect(err).toBeNull();
        expect(chart).toHaveProperty('songs');
        done();
      });
    });

    it('supports callback with only chart name', (done) => {
      fetchChart.mockResolvedValue(sampleChartHtml);

      getChart('hot-100', (err, chart) => {
        expect(err).toBeNull();
        expect(chart).toHaveProperty('songs');
        done();
      });
    });

    it('supports callback with no arguments', (done) => {
      fetchChart.mockResolvedValue(sampleChartHtml);

      getChart((err, chart) => {
        expect(err).toBeNull();
        expect(chart).toHaveProperty('songs');
        done();
      });
    });

    it('throws error for invalid chart name', async () => {
      await expect(getChart('Hot 100')).rejects.toThrow(BillboardError);
      await expect(getChart('Hot 100')).rejects.toMatchObject({
        code: ErrorCodes.INVALID_INPUT
      });
    });

    it('throws error for invalid date format', async () => {
      await expect(getChart('hot-100', '11-19-2016')).rejects.toThrow(BillboardError);
      await expect(getChart('hot-100', 'invalid')).rejects.toMatchObject({
        code: ErrorCodes.INVALID_INPUT
      });
    });

    it('passes errors to callback', (done) => {
      fetchChart.mockRejectedValue(new Error('Network error'));

      getChart('hot-100', '2016-11-19', (err, chart) => {
        expect(err).toBeDefined();
        expect(chart).toBeNull();
        done();
      });
    });
  });

  describe('listCharts', () => {
    it('returns charts list with Promise API', async () => {
      fetchChartsList.mockResolvedValue(sampleChartsListHtml);

      const charts = await listCharts();

      expect(Array.isArray(charts)).toBe(true);
      expect(charts.length).toBeGreaterThan(0);
      expect(charts[0]).toHaveProperty('name');
      expect(charts[0]).toHaveProperty('url');
    });

    it('supports callback API for backwards compatibility', (done) => {
      fetchChartsList.mockResolvedValue(sampleChartsListHtml);

      listCharts((err, charts) => {
        expect(err).toBeNull();
        expect(Array.isArray(charts)).toBe(true);
        done();
      });
    });

    it('passes errors to callback', (done) => {
      fetchChartsList.mockRejectedValue(new Error('Network error'));

      listCharts((err, charts) => {
        expect(err).toBeDefined();
        expect(charts).toBeNull();
        done();
      });
    });
  });
});
