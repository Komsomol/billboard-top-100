import {
  toTitleCase,
  formatDateToYYYYMMDD,
  isValidDateFormat,
  isValidChartName,
  MONTH_MAP
} from '../src/date-utils.js';

describe('date-utils', () => {
  describe('toTitleCase', () => {
    it('converts lowercase string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('converts mixed case string to title case', () => {
      expect(toTitleCase('hELLo WoRLd')).toBe('Hello World');
    });

    it('handles single word', () => {
      expect(toTitleCase('hello')).toBe('Hello');
    });

    it('handles empty string', () => {
      expect(toTitleCase('')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(toTitleCase(null)).toBe('');
      expect(toTitleCase(undefined)).toBe('');
      expect(toTitleCase(123)).toBe('');
    });

    it('handles strings with hyphens', () => {
      expect(toTitleCase('hot-100')).toBe('Hot-100');
    });

    it('handles strings with numbers', () => {
      expect(toTitleCase('billboard 200')).toBe('Billboard 200');
    });
  });

  describe('formatDateToYYYYMMDD', () => {
    it('converts "Month Day, Year" to "YYYY-MM-DD"', () => {
      expect(formatDateToYYYYMMDD('November 19, 2016')).toBe('2016-11-19');
    });

    it('handles all months correctly', () => {
      expect(formatDateToYYYYMMDD('January 1, 2020')).toBe('2020-01-01');
      expect(formatDateToYYYYMMDD('February 15, 2020')).toBe('2020-02-15');
      expect(formatDateToYYYYMMDD('March 20, 2020')).toBe('2020-03-20');
      expect(formatDateToYYYYMMDD('April 10, 2020')).toBe('2020-04-10');
      expect(formatDateToYYYYMMDD('May 5, 2020')).toBe('2020-05-05');
      expect(formatDateToYYYYMMDD('June 30, 2020')).toBe('2020-06-30');
      expect(formatDateToYYYYMMDD('July 4, 2020')).toBe('2020-07-04');
      expect(formatDateToYYYYMMDD('August 8, 2020')).toBe('2020-08-08');
      expect(formatDateToYYYYMMDD('September 21, 2020')).toBe('2020-09-21');
      expect(formatDateToYYYYMMDD('October 31, 2020')).toBe('2020-10-31');
      expect(formatDateToYYYYMMDD('November 11, 2020')).toBe('2020-11-11');
      expect(formatDateToYYYYMMDD('December 25, 2020')).toBe('2020-12-25');
    });

    it('handles single digit days', () => {
      expect(formatDateToYYYYMMDD('January 5, 2020')).toBe('2020-01-05');
    });

    it('returns empty string for invalid input', () => {
      expect(formatDateToYYYYMMDD('')).toBe('');
      expect(formatDateToYYYYMMDD(null)).toBe('');
      expect(formatDateToYYYYMMDD(undefined)).toBe('');
      expect(formatDateToYYYYMMDD('invalid date')).toBe('');
      expect(formatDateToYYYYMMDD('2020-01-15')).toBe('');
    });

    it('handles whitespace', () => {
      expect(formatDateToYYYYMMDD('  November 19, 2016  ')).toBe('2016-11-19');
    });

    it('returns empty for malformed dates', () => {
      expect(formatDateToYYYYMMDD('November 2016')).toBe('');
      expect(formatDateToYYYYMMDD('19, 2016')).toBe('');
    });
  });

  describe('isValidDateFormat', () => {
    it('returns true for valid YYYY-MM-DD format', () => {
      expect(isValidDateFormat('2024-01-15')).toBe(true);
      expect(isValidDateFormat('2020-12-31')).toBe(true);
      expect(isValidDateFormat('1999-06-01')).toBe(true);
    });

    it('returns false for invalid formats', () => {
      expect(isValidDateFormat('01-15-2024')).toBe(false);
      expect(isValidDateFormat('2024/01/15')).toBe(false);
      expect(isValidDateFormat('January 15, 2024')).toBe(false);
      expect(isValidDateFormat('2024-1-15')).toBe(false);
      expect(isValidDateFormat('2024-01-5')).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(isValidDateFormat(null)).toBe(false);
      expect(isValidDateFormat(undefined)).toBe(false);
      expect(isValidDateFormat(20240115)).toBe(false);
    });

    it('returns false for invalid dates', () => {
      expect(isValidDateFormat('2024-13-01')).toBe(false);
      expect(isValidDateFormat('2024-00-15')).toBe(false);
    });
  });

  describe('isValidChartName', () => {
    it('returns true for valid chart names', () => {
      expect(isValidChartName('hot-100')).toBe(true);
      expect(isValidChartName('billboard-200')).toBe(true);
      expect(isValidChartName('artist-100')).toBe(true);
      expect(isValidChartName('country-songs')).toBe(true);
    });

    it('returns false for invalid chart names', () => {
      expect(isValidChartName('Hot 100')).toBe(false);
      expect(isValidChartName('hot_100')).toBe(false);
      expect(isValidChartName('HOT-100')).toBe(false);
      expect(isValidChartName('hot 100')).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(isValidChartName(null)).toBe(false);
      expect(isValidChartName(undefined)).toBe(false);
      expect(isValidChartName(100)).toBe(false);
    });
  });

  describe('MONTH_MAP', () => {
    it('has all 12 months', () => {
      expect(Object.keys(MONTH_MAP)).toHaveLength(12);
    });

    it('maps months to correct numbers', () => {
      expect(MONTH_MAP['January']).toBe('01');
      expect(MONTH_MAP['December']).toBe('12');
    });
  });
});
