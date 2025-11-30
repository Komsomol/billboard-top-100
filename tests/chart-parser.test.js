import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import {
  parseChart,
  parseChartsList,
  extractRank,
  extractTitle,
  extractArtist,
  extractCover,
  extractPositionStats,
  extractChartWeek,
  extractText,
  extractAttr,
  isValidImageUrl,
  SELECTORS
} from '../src/chart-parser.js';
import { BillboardError } from '../src/errors.js';
import { ErrorCodes } from '../src/constants.js';

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

describe('chart-parser', () => {
  describe('SELECTORS', () => {
    it('exports required selectors', () => {
      expect(SELECTORS).toHaveProperty('CHART_ROW');
      expect(SELECTORS).toHaveProperty('TITLE');
      expect(SELECTORS).toHaveProperty('COVER_IMAGE');
    });
  });

  describe('isValidImageUrl', () => {
    it('returns true for valid Billboard image URLs', () => {
      expect(isValidImageUrl('https://charts-static.billboard.com/img/2024/01/artist-180x180.jpg')).toBe(true);
    });

    it('returns false for placeholder/fallback images', () => {
      expect(isValidImageUrl('https://example.com/lazyload-fallback.gif')).toBe(false);
      expect(isValidImageUrl('https://example.com/placeholder.jpg')).toBe(false);
    });

    it('returns false for empty/null values', () => {
      expect(isValidImageUrl('')).toBe(false);
      expect(isValidImageUrl(null)).toBe(false);
      expect(isValidImageUrl(undefined)).toBe(false);
    });

    it('returns true for non-Billboard http URLs', () => {
      expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
    });
  });

  describe('extractText', () => {
    it('extracts text from element', () => {
      const $ = cheerio.load('<div><span class="test">Hello World</span></div>');
      const result = extractText($, $('div'), 'span.test');
      expect(result).toBe('Hello World');
    });

    it('trims whitespace and normalizes spaces', () => {
      const $ = cheerio.load('<div><span class="test">  Hello   World  </span></div>');
      const result = extractText($, $('div'), 'span.test');
      expect(result).toBe('Hello World');
    });

    it('returns empty string for missing element', () => {
      const $ = cheerio.load('<div></div>');
      const result = extractText($, $('div'), 'span.missing');
      expect(result).toBe('');
    });
  });

  describe('extractAttr', () => {
    it('extracts attribute from element', () => {
      const $ = cheerio.load('<div><img class="test" src="image.jpg"></div>');
      const result = extractAttr($, $('div'), 'img.test', 'src');
      expect(result).toBe('image.jpg');
    });

    it('returns empty string for missing attribute', () => {
      const $ = cheerio.load('<div><img class="test"></div>');
      const result = extractAttr($, $('div'), 'img.test', 'src');
      expect(result).toBe('');
    });
  });

  describe('extractRank', () => {
    it('extracts rank from data-detail-target attribute', () => {
      const $ = cheerio.load(sampleChartHtml);
      const row = $(SELECTORS.CHART_ROW).first();
      expect(extractRank($, row)).toBe(1);
    });

    it('extracts rank 2 from second row', () => {
      const $ = cheerio.load(sampleChartHtml);
      const rows = $(SELECTORS.CHART_ROW);
      expect(extractRank($, rows.eq(1))).toBe(2);
    });
  });

  describe('extractTitle', () => {
    it('extracts song title', () => {
      const $ = cheerio.load(sampleChartHtml);
      const row = $(SELECTORS.CHART_ROW).first();
      expect(extractTitle($, row)).toBe('Test Song One');
    });
  });

  describe('extractArtist', () => {
    it('extracts artist from link', () => {
      const $ = cheerio.load(sampleChartHtml);
      const row = $(SELECTORS.CHART_ROW).first();
      expect(extractArtist($, row)).toBe('Test Artist');
    });

    it('extracts artist from span when no link', () => {
      const $ = cheerio.load(sampleChartHtml);
      const rows = $(SELECTORS.CHART_ROW);
      expect(extractArtist($, rows.eq(1))).toBe('Another Artist');
    });
  });

  describe('extractCover', () => {
    it('extracts cover image URL from src', () => {
      const $ = cheerio.load(sampleChartHtml);
      const row = $(SELECTORS.CHART_ROW).first();
      expect(extractCover($, row)).toBe('https://charts-static.billboard.com/img/2024/01/artist-abc-song-one-180x180.jpg');
    });

    it('prefers data-lazy-src over placeholder src', () => {
      const $ = cheerio.load(sampleChartHtml);
      const rows = $(SELECTORS.CHART_ROW);
      const cover = extractCover($, rows.eq(2));
      expect(cover).toBe('https://charts-static.billboard.com/img/2024/03/third-artist-song-three-344x344.jpg');
    });

    it('returns higher resolution image when available', () => {
      const $ = cheerio.load(sampleChartHtml);
      const rows = $(SELECTORS.CHART_ROW);
      const cover = extractCover($, rows.eq(2));
      expect(cover).toContain('344x344');
    });
  });

  describe('extractPositionStats', () => {
    it('extracts position stats', () => {
      const $ = cheerio.load(sampleChartHtml);
      const row = $(SELECTORS.CHART_ROW).first();
      const stats = extractPositionStats($, row);

      expect(stats.positionLastWeek).toBe(2);
      expect(stats.peakPosition).toBe(1);
      expect(stats.weeksOnChart).toBe(10);
    });

    it('handles non-numeric last week (new entry)', () => {
      const $ = cheerio.load(sampleChartHtml);
      const rows = $(SELECTORS.CHART_ROW);
      const stats = extractPositionStats($, rows.eq(2));

      expect(stats.positionLastWeek).toBeNull();
    });
  });

  describe('extractChartWeek', () => {
    it('extracts week from data-date attribute', () => {
      const $ = cheerio.load(sampleChartHtml);
      expect(extractChartWeek($)).toBe('2024-11-23');
    });
  });

  describe('parseChart', () => {
    it('parses chart HTML successfully', () => {
      const chart = parseChart(sampleChartHtml);

      expect(chart).toHaveProperty('week');
      expect(chart).toHaveProperty('songs');
      expect(chart).toHaveProperty('previousWeek');
      expect(chart).toHaveProperty('nextWeek');
    });

    it('extracts week date', () => {
      const chart = parseChart(sampleChartHtml);
      expect(chart.week).toBe('2024-11-23');
    });

    it('extracts correct number of songs', () => {
      const chart = parseChart(sampleChartHtml);
      expect(chart.songs).toHaveLength(3);
    });

    it('extracts song properties', () => {
      const chart = parseChart(sampleChartHtml);
      const song = chart.songs[0];

      expect(song).toHaveProperty('rank', 1);
      expect(song).toHaveProperty('title', 'Test Song One');
      expect(song).toHaveProperty('artist', 'Test Artist');
      expect(song).toHaveProperty('cover');
      expect(song).toHaveProperty('position');
    });

    it('extracts position data', () => {
      const chart = parseChart(sampleChartHtml);
      const position = chart.songs[0].position;

      expect(position).toHaveProperty('positionLastWeek', 2);
      expect(position).toHaveProperty('peakPosition', 1);
      expect(position).toHaveProperty('weeksOnChart', 10);
    });

    it('sorts songs by rank', () => {
      const chart = parseChart(sampleChartHtml);
      expect(chart.songs[0].rank).toBe(1);
      expect(chart.songs[1].rank).toBe(2);
      expect(chart.songs[2].rank).toBe(3);
    });

    it('throws BillboardError for invalid HTML', () => {
      expect(() => parseChart('<html><body></body></html>')).toThrow(BillboardError);
    });

    it('throws NOT_FOUND error when no songs found', () => {
      try {
        parseChart('<html><body></body></html>');
        fail('Should have thrown');
      } catch (error) {
        expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      }
    });
  });

  describe('parseChartsList', () => {
    it('parses charts list HTML successfully', () => {
      const charts = parseChartsList(sampleChartsListHtml);

      expect(Array.isArray(charts)).toBe(true);
      expect(charts.length).toBe(3);
    });

    it('extracts chart name and URL', () => {
      const charts = parseChartsList(sampleChartsListHtml);

      expect(charts[0]).toHaveProperty('name');
      expect(charts[0]).toHaveProperty('url');
    });

    it('converts chart name to title case', () => {
      const charts = parseChartsList(sampleChartsListHtml);

      expect(charts[0].name).toBe('Hot 100');
      expect(charts[1].name).toBe('Billboard 200');
    });

    it('builds full URL', () => {
      const charts = parseChartsList(sampleChartsListHtml);

      expect(charts[0].url).toContain('https://www.billboard.com');
    });

    it('throws BillboardError for empty chart list', () => {
      expect(() => parseChartsList('<html><body></body></html>')).toThrow(BillboardError);
    });

    it('throws NOT_FOUND error when no charts found', () => {
      try {
        parseChartsList('<html><body></body></html>');
        fail('Should have thrown');
      } catch (error) {
        expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      }
    });
  });
});
