# Billboard Top 100 - AI Context Documentation

## Project Overview

A Node.js module that scrapes Billboard.com chart data to retrieve top songs, albums, and artists programmatically. Published as an npm package. Includes a Vue 3 frontend deployed to Cloudflare Pages.

- **Package Name**: `billboard-top-100`
- **Version**: 4.0.0
- **License**: MIT
- **Repository**: https://github.com/Komsomol/billboard-top-100
- **Live Site**: https://billboard-hot-100.pages.dev
- **Node.js**: >=18.0.0 required
- **Module System**: ES Modules (ESM)

## Architecture

### File Structure

```
billboard-top-100/
├── src/                      # Core Node.js module
│   ├── index.js              # Public API: getChart(), listCharts()
│   ├── chart-fetcher.js      # HTTP fetching with retry logic (axios)
│   ├── chart-parser.js       # HTML parsing with Cheerio (2024+ selectors)
│   ├── date-utils.js         # Date formatting utilities
│   ├── constants.js          # URLs, timeouts, CSS selectors, error codes
│   └── errors.js             # BillboardError class + factory functions
├── tests/                    # Jest test suite (--experimental-vm-modules)
│   ├── fixtures/             # HTML fixtures for parser tests
│   ├── chart-fetcher.test.js
│   ├── chart-parser.test.js
│   ├── date-utils.test.js
│   ├── errors.test.js
│   ├── index.test.js
│   └── test.js               # Manual integration test (hits live site)
├── frontend/                 # Vue 3 + Vite + Tailwind CSS v4
│   ├── server/
│   │   ├── index.js          # Express API server (dev mode)
│   │   └── youtube.js        # YouTube API client (dev mode only)
│   ├── src/
│   │   ├── components/
│   │   │   ├── SongCard.vue  # Song display with video modal
│   │   │   ├── SongList.vue  # Songs list container
│   │   │   ├── LoadingState.vue
│   │   │   └── ErrorState.vue
│   │   ├── composables/
│   │   │   └── useChart.js   # Chart data state management
│   │   ├── services/
│   │   │   └── billboard.js  # API client (dev: /api, prod: /data/chart.json)
│   │   ├── App.vue           # Root component
│   │   └── main.js
│   ├── scripts/
│   │   └── prebuild.js       # Static chart data generator (yt-dlp)
│   ├── public/data/           # Generated chart.json (gitignored)
│   ├── .env                  # Local env vars (gitignored)
│   └── package.json
├── .github/workflows/
│   └── deploy.yml            # Cloudflare Pages CI/CD
├── package.json
├── jest.config.js
└── CLAUDE.md
```

### Data Flow

#### Production (Cloudflare Pages)
```
GitHub Actions (daily 6 AM UTC cron or push to master)
  → npm run build
    → prebuild.js: fetch Billboard Hot 100
    → prebuild.js: yt-dlp search for YouTube videos (cached)
    → prebuild.js: write public/data/chart.json
    → vite build: compile Vue app + static assets
  → wrangler: deploy dist/ to Cloudflare Pages
  → User loads site → fetches /data/chart.json (static file)
```

#### Development
```
npm run dev (from frontend/)
  → Express server on :3001
  → Vite dev server with HMR on :5173
  → API calls: /api/chart → getChart() → Billboard.com → YouTube API
```

## Core Module (src/)

### Public API

```javascript
import { getChart, listCharts, BillboardError, ErrorCodes } from 'billboard-top-100';

// Fetch chart (defaults: hot-100, current week)
const chart = await getChart('hot-100', '2024-01-15');

// List all available charts
const charts = await listCharts();
```

### Data Structures

```javascript
// Chart object
{
  week: "2024-01-15",         // YYYY-MM-DD
  songs: [{
    rank: 1,
    title: "Song Title",
    artist: "Artist Name",
    cover: "https://...",     // Highest resolution available
    position: {
      positionLastWeek: 2,    // or null
      peakPosition: 1,        // or null
      weeksOnChart: 5         // or null
    }
  }],
  previousWeek: { url: "", date: "" },
  nextWeek: { url: "", date: "" }
}
```

### Error Codes
- `NETWORK_ERROR`, `PARSE_ERROR`, `NOT_FOUND`, `INVALID_INPUT`, `TIMEOUT`

### CSS Selectors (2024+ Billboard.com)

Defined in `src/chart-parser.js`. If Billboard changes HTML structure, update these:
```javascript
CHART_ROW: 'ul.o-chart-results-list-row'
TITLE: 'h3.c-title'
ARTIST: 'li.o-chart-results-list__item span.c-label a'
ARTIST_SPAN: 'li.o-chart-results-list__item span.c-label.a-no-trucate'
COVER_IMAGE: 'img.c-lazy-image__img'
```

## Prebuild & Video Search (frontend/scripts/prebuild.js)

### How It Works

1. Fetches Billboard Hot 100 chart data
2. Limits to top 20 songs
3. For each song, searches YouTube via `yt-dlp` (no API key needed)
4. Scores results to pick the best official music video
5. Caches results in `frontend/scripts/video-cache.json`
6. Writes final data to `frontend/public/data/chart.json`

### Video Scoring Logic

Fetches 5 YouTube results per song via `yt-dlp ytsearch5:` and scores them:
- **+10**: Channel name contains the artist name (official channel)
- **+8**: VEVO channel
- **+5**: Title contains "Official Video" or "Official Music Video"
- **-3**: Title contains "lyric" or "audio"
- **-1 (filtered out)**: Channel in `BLOCKED_CHANNELS` list (e.g., "7clouds")

Highest score wins. Falls back to first result if all are filtered.

### Video Cache

- **Path**: `frontend/scripts/video-cache.json` (gitignored)
- **Format**: `{ "Artist - Title": { videoId, embedUrl, watchUrl } }`
- **Only successful lookups are cached** -- null/failed results are retried next run
- **CI persistence**: GitHub Actions `actions/cache@v4` with `video-cache-${{ github.run_id }}` key and `video-cache-` restore prefix
- **Cache invalidation**: Only new songs entering the chart trigger yt-dlp searches

### Running Locally

```bash
# Generate chart.json locally (requires yt-dlp installed)
node frontend/scripts/prebuild.js

# Full build (prebuild + vite)
cd frontend && npm run build
```

### Modifying Video Search

- **Block a channel**: Add to `BLOCKED_CHANNELS` array in `prebuild.js`
- **Change search query**: Edit `buildSearchQuery()` function
- **Adjust scoring**: Edit `scoreResult()` function
- **Change result count**: Modify `ytsearch5:` number in `searchVideo()`

## CI/CD (.github/workflows/deploy.yml)

### Triggers
- Push to main/master
- Daily cron at 6 AM UTC (refreshes chart data)
- Manual workflow_dispatch

### Pipeline
1. Checkout + Node.js 20 setup
2. `pip install yt-dlp`
3. `npm ci` (root + frontend)
4. Restore video cache from previous run
5. `npm run build` (prebuild + vite)
6. Deploy `frontend/dist/` to Cloudflare Pages via wrangler

### Required Secrets
- `CLOUDFLARE_API_TOKEN` -- Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` -- Cloudflare account ID

### No Longer Required
- `VITE_YOUTUBE_API_KEY` -- replaced by yt-dlp (no API key needed)

## Development

### Setup
```bash
npm install
cd frontend && npm install
```

### Testing
```bash
npm test              # Jest (--experimental-vm-modules for ESM)
npm run test:watch
npm run test:coverage # 80% lines/statements/functions, 70% branches

node tests/test.js    # Manual integration test (hits live Billboard.com)
```

### Local Frontend
```bash
cd frontend
cp .env.example .env  # YouTube API key only needed for dev server mode
npm run dev           # Express :3001 + Vite :5173
```

## Troubleshooting

### No songs found
Billboard.com HTML structure changed. Update CSS selectors in `src/chart-parser.js`. Compare live HTML with expected selectors. Run `node tests/test.js` to verify.

### Missing videos after deploy
1. Check GitHub Actions logs for `yt-dlp` errors
2. Verify `yt-dlp` is installed in CI (`pip install yt-dlp`)
3. Check video cache: `gh cache list --repo Komsomol/billboard-top-100`
4. To force fresh video search: delete all `video-cache-*` entries via `gh cache delete` and retrigger deploy

### Videos showing wrong content (lyrics, covers)
1. Add offending channel to `BLOCKED_CHANNELS` in `prebuild.js`
2. Delete video cache and rebuild
3. Adjust scoring weights in `scoreResult()` if needed

### Stale video cache in CI
GitHub Actions cache is immutable per key. The `video-cache-${{ github.run_id }}` key ensures each run saves a new cache. Old caches are restored via `restore-keys: video-cache-` prefix matching (most recent first).

To clear all caches:
```bash
gh cache list --repo Komsomol/billboard-top-100
gh cache delete <cache-id> --repo Komsomol/billboard-top-100
```

## Dependencies

### Core Module
| Package | Purpose |
|---------|---------|
| axios | HTTP client for Billboard.com |
| cheerio | HTML parsing |

### Frontend
| Package | Purpose |
|---------|---------|
| vue ^3.4 | UI framework |
| express | Dev server API |
| tailwindcss ^4 | Styling |
| vite ^5 | Build tool |

### System (not npm)
| Tool | Purpose |
|------|---------|
| yt-dlp | YouTube video search (prebuild) |
