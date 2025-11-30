/**
 * Billboard Top 100 - Chart Parser Module
 * Pure functions for parsing Billboard HTML (Updated for 2024+ structure)
 */

import * as cheerio from 'cheerio';
import { BILLBOARD_BASE_URL, NeighboringWeek } from './constants.js';
import { formatDateToYYYYMMDD, toTitleCase } from './date-utils.js';
import { createParseError, createNotFoundError } from './errors.js';

/**
 * CSS Selectors for Billboard.com (2024+ structure)
 */
export const SELECTORS = {
  CHART_ROW: 'ul.o-chart-results-list-row',
  TITLE: 'h3.c-title',
  ARTIST: 'li.o-chart-results-list__item span.c-label a',
  ARTIST_SPAN: 'li.o-chart-results-list__item span.c-label.a-no-trucate',
  COVER_IMAGE: 'img.c-lazy-image__img',
  RANK: 'li.o-chart-results-list__item span.c-label',
  DATE_BUTTON: 'button.date-selector__button, [class*="date-selector"]',
  CHART_PANEL_LINK: '.chart-panel__link, a[href*="/charts/"]'
};

/**
 * Extracts text content from an element, trimmed
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Cheerio element
 * @param {string} selector - CSS selector
 * @returns {string} Extracted text
 */
export const extractText = ($, element, selector) => {
  try {
    const found = $(element).find(selector).first();
    return found.text().trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
  } catch (error) {
    return '';
  }
};

/**
 * Extracts attribute from an element
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Cheerio element
 * @param {string} selector - CSS selector
 * @param {string} attr - Attribute name
 * @returns {string} Attribute value
 */
export const extractAttr = ($, element, selector, attr) => {
  try {
    const found = $(element).find(selector).first();
    return found.attr(attr) || '';
  } catch (error) {
    return '';
  }
};

/**
 * Extracts rank from chart row
 * @param {Object} $ - Cheerio instance
 * @param {Object} row - Chart row element
 * @returns {number} Rank number
 */
export const extractRank = ($, row) => {
  try {
    const rankAttr = $(row).attr('data-detail-target');
    if (rankAttr) {
      return parseInt(rankAttr, 10);
    }
    // Fallback: extract from first span.c-label
    const rankText = $(row).find('li.o-chart-results-list__item').first().find('span.c-label').first().text().trim();
    return parseInt(rankText, 10) || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Extracts title from chart row
 * @param {Object} $ - Cheerio instance
 * @param {Object} row - Chart row element
 * @returns {string} Song title
 */
export const extractTitle = ($, row) => {
  return extractText($, row, 'h3.c-title');
};

/**
 * Extracts artist from chart row
 * @param {Object} $ - Cheerio instance
 * @param {Object} row - Chart row element
 * @returns {string} Artist name
 */
export const extractArtist = ($, row) => {
  // Try to get from link first
  const artistLink = extractText($, row, 'span.c-label.a-no-trucate a');
  if (artistLink) {
    return artistLink;
  }
  // Fallback to span text
  const artistSpan = $(row).find('span.c-label.a-no-trucate').first().text().trim();
  return artistSpan || '';
};

/**
 * Checks if URL is a valid Billboard image (not a placeholder)
 * @param {string} url - URL to check
 * @returns {boolean} True if valid image URL
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  // Exclude placeholder/fallback images
  if (url.includes('lazyload-fallback') || url.includes('placeholder')) {
    return false;
  }
  // Prefer charts-static.billboard.com URLs
  return url.includes('charts-static.billboard.com') || url.startsWith('http');
};

/**
 * Extracts cover image URL from chart row
 * Prefers higher resolution images (344x344) over thumbnails (180x180)
 * @param {Object} $ - Cheerio instance
 * @param {Object} row - Chart row element
 * @returns {string} Cover image URL
 */
export const extractCover = ($, row) => {
  const images = $(row).find('img.c-lazy-image__img');
  let bestUrl = '';
  let bestSize = 0;

  images.each((i, img) => {
    // Check data-lazy-src first (usually higher resolution)
    const dataSrc = $(img).attr('data-lazy-src') || '';
    const src = $(img).attr('src') || '';

    // Try to extract size from URL (e.g., 180x180, 344x344)
    const getSize = (url) => {
      const match = url.match(/(\d+)x(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Prefer data-lazy-src if it's a valid image
    if (isValidImageUrl(dataSrc)) {
      const size = getSize(dataSrc);
      if (size > bestSize) {
        bestSize = size;
        bestUrl = dataSrc;
      }
    }

    // Check src if it's a valid image (not placeholder)
    if (isValidImageUrl(src)) {
      const size = getSize(src);
      if (size > bestSize) {
        bestSize = size;
        bestUrl = src;
      }
    }
  });

  return bestUrl;
};

/**
 * Extracts position stats from chart row (LW, Peak, Weeks)
 * @param {Object} $ - Cheerio instance
 * @param {Object} row - Chart row element
 * @returns {Object} Position data
 */
export const extractPositionStats = ($, row) => {
  const stats = {
    positionLastWeek: null,
    peakPosition: null,
    weeksOnChart: null
  };

  try {
    // Find all the stat containers
    const statContainers = $(row).find('div.lrv-u-flex.lrv-u-justify-content-space-between');

    statContainers.each((i, container) => {
      const label = $(container).find('span.c-span').first().text().trim().toUpperCase();
      const value = $(container).find('span.c-label').first().text().trim();
      const numValue = parseInt(value, 10);

      if (label.includes('LW') && !isNaN(numValue)) {
        stats.positionLastWeek = numValue;
      } else if (label.includes('PEAK') && !isNaN(numValue)) {
        stats.peakPosition = numValue;
      } else if (label.includes('WEEK') && !isNaN(numValue)) {
        stats.weeksOnChart = numValue;
      }
    });
  } catch (error) {
    // Keep nulls
  }

  return stats;
};

/**
 * Extracts chart week date from page
 * @param {Object} $ - Cheerio instance
 * @returns {string} Date in YYYY-MM-DD format
 */
export const extractChartWeek = ($) => {
  try {
    // Look for data-date attribute
    const dateAttr = $('[data-date]').first().attr('data-date');
    if (dateAttr && /^\d{4}-\d{2}-\d{2}$/.test(dateAttr)) {
      return dateAttr;
    }

    // Look for date in title or header
    const titleText = $('title').text();
    const dateMatch = titleText.match(/(\w+ \d+, \d{4})/);
    if (dateMatch) {
      return formatDateToYYYYMMDD(dateMatch[1]);
    }

    // Look for date selector button
    const dateButton = $('.date-selector__button, [class*="date-selector"] button').first().text().trim();
    if (dateButton) {
      return formatDateToYYYYMMDD(dateButton);
    }

    return '';
  } catch (error) {
    return '';
  }
};

/**
 * Parses chart HTML and extracts chart data
 * @param {string} html - HTML content to parse
 * @returns {Object} Parsed chart data
 * @throws {BillboardError} If parsing fails or no songs found
 */
export const parseChart = (html) => {
  try {
    const $ = cheerio.load(html);

    // Extract week date
    const week = extractChartWeek($);

    // Extract songs
    const songs = [];
    $(SELECTORS.CHART_ROW).each((index, row) => {
      const rank = extractRank($, row);
      const title = extractTitle($, row);
      const artist = extractArtist($, row);
      const cover = extractCover($, row);
      const position = extractPositionStats($, row);

      // Only add if we have at least a title or artist
      if (title || artist) {
        songs.push({
          rank: rank || index + 1,
          title,
          artist,
          cover,
          position
        });
      }
    });

    if (songs.length === 0) {
      throw createNotFoundError('No songs found in chart data. Billboard HTML structure may have changed.');
    }

    // Sort by rank to ensure correct order
    songs.sort((a, b) => a.rank - b.rank);

    return {
      week,
      songs,
      previousWeek: { url: '', date: '' },
      nextWeek: { url: '', date: '' }
    };
  } catch (error) {
    if (error.code) {
      throw error; // Re-throw BillboardError
    }
    throw createParseError('Failed to parse chart HTML', error);
  }
};

/**
 * Parses charts list HTML and extracts available charts
 * @param {string} html - HTML content to parse
 * @returns {Array<Object>} Array of chart objects with name and url
 * @throws {BillboardError} If parsing fails or no charts found
 */
export const parseChartsList = (html) => {
  try {
    const $ = cheerio.load(html);
    const charts = [];
    const seen = new Set();

    // Look for chart links
    $('a[href*="/charts/"]').each((index, item) => {
      const href = $(item).attr('href');
      if (!href || !href.includes('/charts/')) {
        return;
      }

      // Extract chart name from URL
      const match = href.match(/\/charts\/([a-z0-9-]+)/i);
      if (!match) {
        return;
      }

      const chartSlug = match[1].toLowerCase();

      // Skip duplicates and non-chart pages
      if (seen.has(chartSlug) || chartSlug === 'charts' || chartSlug.length < 3) {
        return;
      }

      seen.add(chartSlug);

      const chartName = chartSlug.replace(/-/g, ' ');
      charts.push({
        name: toTitleCase(chartName),
        url: `${BILLBOARD_BASE_URL}/charts/${chartSlug}`
      });
    });

    if (charts.length === 0) {
      throw createNotFoundError('No charts found. Billboard HTML structure may have changed.');
    }

    return charts;
  } catch (error) {
    if (error.code) {
      throw error; // Re-throw BillboardError
    }
    throw createParseError('Failed to parse charts list HTML', error);
  }
};
