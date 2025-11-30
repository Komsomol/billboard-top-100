# Billboard Top 100 - AI Context Documentation

## Project Overview

A Node.js module that scrapes Billboard.com chart data to retrieve top songs, albums, and artists programmatically. Published as an npm package.

- **Package Name**: `billboard-top-100`
- **Version**: 4.0.0
- **License**: MIT
- **Repository**: https://github.com/darthbatman/billboard-top-100
- **Node.js**: >=18.0.0 required
- **Module System**: ES Modules (ESM)

## Architecture

### File Structure

```
billboard-top-100/
├── src/                      # Core Node.js module
│   ├── index.js              # Main entry point, exports public API
│   ├── chart-fetcher.js      # HTTP fetching with retry logic
│   ├── chart-parser.js       # HTML parsing and data extraction
│   ├── date-utils.js         # Date formatting utilities
│   ├── constants.js          # Configuration constants
│   └── errors.js             # Custom error classes
├── tests/                    # Jest test suite
│   ├── fixtures/
│   │   ├── sample-chart.html
│   │   └── sample-charts-list.html
│   ├── chart-fetcher.test.js
│   ├── chart-parser.test.js
│   ├── date-utils.test.js
│   ├── errors.test.js
│   ├── index.test.js
│   └── test.js               # Manual integration test
├── frontend/                 # Vue 3 + Vite frontend
│   ├── server/               # Express API server
│   ├── src/                  # Vue application
│   ├── .env                  # Environment variables
│   └── package.json
├── billboard-top-100.js      # Legacy entry (re-exports from src/)
├── package.json
├── jest.config.js
└── CLAUDE.md
```

### Core Modules

#### `src/index.js`
Main entry point exporting the public API:
- `getChart(chartName?, date?)` - Fetch chart data (Promise-based with callback fallback)
- `listCharts()` - List all available charts (Promise-based with callback fallback)
- `BillboardError` - Custom error class
- `ErrorCodes` - Error code constants

#### `src/chart-fetcher.js`
Handles HTTP requests with:
- Axios for HTTP client
- 30-second timeout configuration
- Retry logic (3 attempts) for transient failures
- User-Agent headers to avoid blocking

#### `src/chart-parser.js`
Parses Billboard HTML using Cheerio (updated for 2024+ Billboard structure):
- `parseChart(html)` - Parses chart page HTML
- `parseChartsList(html)` - Parses charts index HTML
- `extractRank($, row)` - Extracts rank from `data-detail-target` attribute
- `extractTitle($, row)` - Extracts song title from `h3.c-title`
- `extractArtist($, row)` - Extracts artist name from span/link
- `extractCover($, row)` - Extracts cover image URL (prefers highest resolution, filters placeholders)
- `extractPositionStats($, row)` - Extracts LW/Peak/Weeks stats
- `extractChartWeek($)` - Extracts week date from `data-date` attribute
- `extractText($, element, selector)` - Safe text extraction
- `extractAttr($, element, selector, attr)` - Safe attribute extraction
- `isValidImageUrl(url)` - Validates image URL (filters placeholders)

#### `src/date-utils.js`
Date utilities:
- `formatDateToYYYYMMDD(monthDayYear)` - Converts "Month Day, Year" to "YYYY-MM-DD"
- `toTitleCase(str)` - Title-case string conversion
- `isValidDateFormat(date)` - Validates YYYY-MM-DD format
- `isValidChartName(name)` - Validates chart name format

#### `src/constants.js`
Configuration:
- `BILLBOARD_BASE_URL` - https://www.billboard.com
- `BILLBOARD_CHARTS_URL` - Charts endpoint
- `REQUEST_TIMEOUT` - 30000ms
- `MAX_RETRIES` - 3
- `SELECTORS` - CSS selectors for parsing
- `NeighboringWeek` - Enum (PREVIOUS, NEXT)
- `ErrorCodes` - Error code constants

#### `src/errors.js`
Custom error handling:
- `BillboardError` - Base error class with code and cause
- Factory functions: `createNetworkError`, `createParseError`, `createNotFoundError`, `createInvalidInputError`, `createTimeoutError`

## Public API

### `getChart(chartName?, date?)`

Fetches chart data for a specific chart and date.

```javascript
import { getChart } from 'billboard-top-100';

// Modern Promise/async-await
const chart = await getChart('hot-100', '2024-01-15');

// With defaults (hot-100, current week)
const chart = await getChart();

// Legacy callback API
getChart('hot-100', '2024-01-15', (err, chart) => {
  if (err) console.error(err);
  else console.log(chart);
});
```

**Parameters:**
- `chartName` (string, optional) - Chart name (default: 'hot-100')
- `date` (string, optional) - Date in YYYY-MM-DD format (default: current week)

**Returns:** `Promise<Chart>`

```typescript
interface Chart {
  week: string;           // "YYYY-MM-DD"
  songs: Song[];
  previousWeek: NeighborChart;
  nextWeek: NeighborChart;
}

interface Song {
  rank: number;
  title: string;
  artist: string;
  cover: string;
  position: {
    positionLastWeek: number | null;
    peakPosition: number | null;
    weeksOnChart: number | null;
  };
}

interface NeighborChart {
  url: string;
  date: string;
}
```

### `listCharts()`

Lists all available Billboard charts.

```javascript
import { listCharts } from 'billboard-top-100';

const charts = await listCharts();
// [{ name: 'Hot 100', url: 'https://...' }, ...]
```

**Returns:** `Promise<ChartInfo[]>`

### Error Handling

```javascript
import { getChart, BillboardError, ErrorCodes } from 'billboard-top-100';

try {
  const chart = await getChart('invalid chart name');
} catch (error) {
  if (error instanceof BillboardError) {
    console.log(error.code);    // 'INVALID_INPUT'
    console.log(error.message); // Descriptive message
    console.log(error.cause);   // Original error if wrapped
  }
}
```

**Error Codes:**
- `NETWORK_ERROR` - HTTP request failed
- `PARSE_ERROR` - HTML parsing failed
- `NOT_FOUND` - Chart data not found
- `INVALID_INPUT` - Invalid parameters
- `TIMEOUT` - Request timed out

## Code Patterns

### Functional Programming

All modules follow functional programming principles:
- Pure functions for data transformation
- No side effects except in fetcher module
- Immutable data patterns
- Composition over inheritance

### Error Handling

All functions use try-catch with custom BillboardError:

```javascript
try {
  // operation
} catch (error) {
  if (error.code) {
    throw error; // Re-throw BillboardError
  }
  throw createParseError('Failed to parse', error);
}
```

## Development

### Setup

```bash
npm install
```

### Testing

```bash
npm test              # Run all tests (uses --experimental-vm-modules)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Manual integration test (hits live Billboard.com)
node tests/test.js
```

**Note**: Jest runs with `--experimental-vm-modules` flag to support ES Modules.

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.6.0 | HTTP client |
| cheerio | ^1.0.0-rc.12 | HTML parsing |

| Dev Package | Version | Purpose |
|-------------|---------|---------|
| jest | ^29.7.0 | Testing framework |

## Known Limitations

1. **Web Scraping Fragility**: Billboard.com HTML changes may break parsing. CSS selectors in `constants.js` may need updates.
2. **Rate Limiting**: No built-in rate limiting; Billboard may block excessive requests.
3. **Historical Data**: Some older charts may have different HTML structures.
4. **Cover Images**: srcset parsing varies by chart position (rank 1 vs others).

## CSS Selectors Used

Key selectors for Billboard.com 2024+ structure (defined in `src/chart-parser.js`):

```javascript
SELECTORS = {
  CHART_ROW: 'ul.o-chart-results-list-row',
  TITLE: 'h3.c-title',
  ARTIST: 'li.o-chart-results-list__item span.c-label a',
  ARTIST_SPAN: 'li.o-chart-results-list__item span.c-label.a-no-trucate',
  COVER_IMAGE: 'img.c-lazy-image__img',
  RANK: 'li.o-chart-results-list__item span.c-label',
  DATE_BUTTON: 'button.date-selector__button, [class*="date-selector"]',
  CHART_PANEL_LINK: '.chart-panel__link, a[href*="/charts/"]'
}
```

### Image Extraction Logic
- Rank extracted from `data-detail-target` attribute on chart row
- Week date from `data-date` attribute or title parsing
- Cover images prefer `data-lazy-src` over `src` (higher resolution)
- Placeholder/fallback images (`lazyload-fallback`) are filtered out
- Image resolution extracted from URL pattern (e.g., `180x180`, `344x344`)

## Troubleshooting

### "No songs found" Error
- Billboard.com HTML structure may have changed
- Check if CSS selectors in `chart-parser.js` SELECTORS still match current site
- Compare live HTML with expected selectors (e.g., `ul.o-chart-results-list-row`)
- Run manual test: `node tests/test.js`

### Empty Data Fields
- Parsing fell back to empty/null values
- Check extraction functions in `chart-parser.js`
- Verify `data-detail-target`, `h3.c-title`, `span.c-label.a-no-trucate` exist

### Missing Cover Images
- Check if `img.c-lazy-image__img` selector matches
- Verify `isValidImageUrl` isn't filtering valid images
- Check for new placeholder URL patterns

### Timeout Errors
- Billboard.com may be slow or rate limiting
- Increase `REQUEST_TIMEOUT` in `constants.js`

### Invalid Input Errors
- Chart names must be lowercase with hyphens: `hot-100`, `billboard-200`
- Dates must be YYYY-MM-DD format: `2024-01-15`

## Migration from v3.x to v4.0

v4.0 migrates from CommonJS to ES Modules (ESM):

### Breaking Changes

1. **ES Modules** - Use `import` instead of `require`
2. **Node.js 18+** - Minimum Node.js version is now 18.0.0

### Migration Steps

```javascript
// Before (v3.x - CommonJS)
const { getChart, listCharts } = require('billboard-top-100');

// After (v4.0 - ESM)
import { getChart, listCharts } from 'billboard-top-100';
```

### If You Must Use CommonJS

For legacy projects that cannot migrate to ESM, use dynamic import:

```javascript
// CommonJS compatibility (async context required)
const { getChart, listCharts } = await import('billboard-top-100');
```

## Migration from v2.x

v3.0+ is backwards compatible but adds modern features:

1. **Promise support** - All methods now return Promises
2. **Better errors** - BillboardError with codes and causes
3. **Input validation** - Invalid inputs throw INVALID_INPUT errors
4. **Modern dependencies** - axios replaces deprecated request library

Legacy callback API still works:
```javascript
// Still supported
getChart('hot-100', (err, chart) => { ... });
```

---

## Frontend Application

A Vue 3 + Vite frontend with YouTube music video integration.

### Frontend Structure

```
frontend/
├── server/
│   └── index.js              # Express API server
├── src/
│   ├── components/
│   │   ├── ChartSelector.vue # Chart/date selection
│   │   ├── SongCard.vue      # Song display with video
│   │   ├── SongList.vue      # Songs grid
│   │   ├── LoadingState.vue  # Loading indicator
│   │   └── ErrorState.vue    # Error display
│   ├── composables/
│   │   └── useChart.js       # Chart state management
│   ├── services/
│   │   ├── billboard.js      # Billboard API client
│   │   └── youtube.js        # YouTube API client
│   ├── App.vue               # Root component
│   └── main.js               # App entry point
├── .env                      # Environment variables
├── vite.config.js            # Vite configuration
└── package.json
```

### Running the Frontend

```bash
# From project root
npm run dev

# Or from frontend directory
cd frontend
npm install
npm run dev
```

This starts:
- Express API server on http://localhost:3001
- Vite dev server on http://localhost:5173

### Environment Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with your YouTube API key
```

The server will:
- ❌ Exit with error if `.env` file is missing
- ⚠️ Warn if `VITE_YOUTUBE_API_KEY` is not configured (YouTube search disabled)

### Frontend Features

1. **Chart Selection** - Browse Hot 100, Billboard 200, and other charts
2. **Date Selection** - View historical chart data
3. **YouTube Integration** - Watch official music videos inline
4. **Responsive Design** - Works on mobile and desktop

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `PORT` | Express server port (default: 3001) |

### Frontend API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/charts` | List all available charts |
| `GET /api/chart` | Get Hot 100 (current week) |
| `GET /api/chart/:name` | Get specific chart |
| `GET /api/chart/:name?date=YYYY-MM-DD` | Get chart for date |
