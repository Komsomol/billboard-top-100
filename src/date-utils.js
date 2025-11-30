/**
 * Billboard Top 100 - Date Utilities Module
 * Pure functions for date formatting and string manipulation
 */

/**
 * Month name to number mapping
 */
export const MONTH_MAP = Object.freeze({
  'January': '01',
  'February': '02',
  'March': '03',
  'April': '04',
  'May': '05',
  'June': '06',
  'July': '07',
  'August': '08',
  'September': '09',
  'October': '10',
  'November': '11',
  'December': '12'
});

/**
 * Converts a string to title case
 * @param {string} str - The string to convert
 * @returns {string} The title-cased string
 * @example
 * toTitleCase("hello woRld") // "Hello World"
 */
export const toTitleCase = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Converts "Month Day, Year" date format to "YYYY-MM-DD"
 * @param {string} monthDayYearDate - Date in "Month Day, Year" format
 * @returns {string} Date in "YYYY-MM-DD" format, or empty string on failure
 * @example
 * formatDateToYYYYMMDD("November 19, 2016") // "2016-11-19"
 */
export const formatDateToYYYYMMDD = (monthDayYearDate) => {
  try {
    if (typeof monthDayYearDate !== 'string' || !monthDayYearDate.trim()) {
      return '';
    }

    const trimmed = monthDayYearDate.trim();
    const parts = trimmed.split(',');

    if (parts.length < 2) {
      return '';
    }

    const yyyy = parts[1].trim();
    const monthDay = parts[0].trim().split(' ');

    if (monthDay.length < 2) {
      return '';
    }

    const month = monthDay[0];
    const dd = monthDay[1].padStart(2, '0');
    const mm = MONTH_MAP[month];

    if (!mm || !yyyy || !dd) {
      return '';
    }

    return `${yyyy}-${mm}-${dd}`;
  } catch (error) {
    return '';
  }
};

/**
 * Validates a date string in YYYY-MM-DD format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date format
 */
export const isValidDateFormat = (dateStr) => {
  if (typeof dateStr !== 'string') {
    return false;
  }
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Validates a chart name
 * @param {string} chartName - Chart name to validate
 * @returns {boolean} True if valid chart name
 */
export const isValidChartName = (chartName) => {
  if (typeof chartName !== 'string') {
    return false;
  }
  // Chart names should be lowercase with hyphens
  const regex = /^[a-z0-9-]+$/;
  return regex.test(chartName);
};
