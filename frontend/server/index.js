import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getChart, listCharts } from '../../src/index.js';
import { enrichSongsWithVideos, searchVideo } from './youtube.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const envExamplePath = join(__dirname, '..', '.env.example');
const isProduction = process.env.NODE_ENV === 'production';

// Check if .env file exists (skip in production where env vars are set externally)
if (!isProduction && !existsSync(envPath)) {
  console.error('\n❌ Environment file not found!');
  console.error('   Copy .env.example to .env and configure your settings:');
  console.error(`   cp ${envExamplePath} ${envPath}\n`);
  process.exit(1);
}

// Load environment variables (in production, they're set externally)
if (!isProduction) {
  dotenv.config({ path: envPath });
}

// Validate environment variables
const validateEnv = () => {
  const warnings = [];

  if (!process.env.VITE_YOUTUBE_API_KEY ||
      process.env.VITE_YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    warnings.push('VITE_YOUTUBE_API_KEY is not configured - YouTube video search will be disabled');
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
    console.warn('');
  }
};

validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// Billboard chart cache (permanent for historical data)
const chartCache = new Map();

const createChartCacheKey = (chartName, date) => `${chartName}:${date || 'latest'}`;

const getFromChartCache = (chartName, date) => {
  const key = createChartCacheKey(chartName, date);
  return chartCache.get(key) || null;
};

const saveToChartCache = (chartName, date, data) => {
  const key = createChartCacheKey(chartName, date);
  chartCache.set(key, data);
  console.log(`Chart cached: ${key}`);
};

// Pre-cache last 10 years on startup (gentle, spaced requests)
const precacheCharts = async () => {
  const currentYear = new Date().getFullYear();
  const yearsToCache = 10;
  const apiKey = process.env.VITE_YOUTUBE_API_KEY;

  console.log(`\nPre-caching Hot 100 charts for last ${yearsToCache} years...`);

  for (let i = 1; i <= yearsToCache; i++) {
    const year = currentYear - i;
    const date = `${year}-06-15`;

    try {
      // Check if already cached
      if (getFromChartCache('hot-100', date)) {
        console.log(`  ${year}: Already cached`);
        continue;
      }

      // Fetch and cache
      const chart = await getChart('hot-100', date);
      chart.songs = chart.songs.slice(0, 20);
      chart.songs = await enrichSongsWithVideos(chart.songs, apiKey, 20);
      saveToChartCache('hot-100', date, chart);
      console.log(`  ${year}: Cached (${chart.songs.length} songs)`);

      // Wait 2 seconds between requests to be gentle
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`  ${year}: Failed - ${error.message}`);
    }
  }

  console.log(`Pre-caching complete. ${chartCache.size} charts cached.\n`);
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (isProduction) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

/**
 * GET /api/charts
 * Returns list of all available Billboard charts
 */
app.get('/api/charts', async (req, res) => {
  try {
    const charts = await listCharts();
    res.json({ success: true, data: charts });
  } catch (error) {
    console.error('Error fetching charts:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

/**
 * GET /api/chart/:name
 * Returns chart data for specified chart and optional date
 * Query params: date (YYYY-MM-DD format), limit (number of songs to return, default 20)
 */
app.get('/api/chart/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { date, limit: songLimit } = req.query;

    // Check cache first
    const cached = getFromChartCache(name, date);
    if (cached) {
      console.log(`Chart cache hit: ${name}:${date || 'latest'}`);
      return res.json({ success: true, data: cached });
    }

    const chart = await getChart(name, date || '');

    // Limit songs to top N (default 20 to save API quota)
    const limit = parseInt(songLimit) || 20;
    chart.songs = chart.songs.slice(0, limit);

    // Enrich ALL displayed songs with YouTube video data
    const apiKey = process.env.VITE_YOUTUBE_API_KEY;
    chart.songs = await enrichSongsWithVideos(chart.songs, apiKey, limit);

    // Cache the result (only historical data, not "latest")
    if (date) {
      saveToChartCache(name, date, chart);
    }

    res.json({ success: true, data: chart });
  } catch (error) {
    console.error('Error fetching chart:', error.message);
    res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

/**
 * GET /api/chart
 * Returns Hot 100 chart for current week (default)
 * Query params: date (YYYY-MM-DD format), limit (number of songs to return, default 20)
 */
app.get('/api/chart', async (req, res) => {
  try {
    const { date, limit: songLimit } = req.query;

    // Check cache first
    const cached = getFromChartCache('hot-100', date);
    if (cached) {
      console.log(`Chart cache hit: hot-100:${date || 'latest'}`);
      return res.json({ success: true, data: cached });
    }

    const chart = await getChart('hot-100', date || '');

    // Limit songs to top N (default 20 to save API quota)
    const limit = parseInt(songLimit) || 20;
    chart.songs = chart.songs.slice(0, limit);

    // Enrich ALL displayed songs with YouTube video data
    const apiKey = process.env.VITE_YOUTUBE_API_KEY;
    chart.songs = await enrichSongsWithVideos(chart.songs, apiKey, limit);

    // Cache the result (only historical data, not "latest")
    if (date) {
      saveToChartCache('hot-100', date, chart);
    }

    res.json({ success: true, data: chart });
  } catch (error) {
    console.error('Error fetching chart:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

/**
 * GET /api/video
 * Returns YouTube video data for a single song
 * Query params: title, artist
 */
app.get('/api/video', async (req, res) => {
  try {
    const { title, artist } = req.query;

    if (!title || !artist) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: title and artist',
        code: 'INVALID_INPUT'
      });
    }

    const apiKey = process.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey || apiKey === 'your_youtube_api_key_here') {
      return res.status(503).json({
        success: false,
        error: 'YouTube API not configured',
        code: 'API_NOT_CONFIGURED'
      });
    }

    const video = await searchVideo(title, artist, apiKey);

    if (video) {
      res.json({
        success: true,
        data: {
          videoId: video.videoId,
          embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
          watchUrl: `https://www.youtube.com/watch?v=${video.videoId}`
        }
      });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    console.error('Error fetching video:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    });
  }
});

// Serve SPA for all other routes in production
if (isProduction) {
  app.get('*', (req, res) => {
    const distPath = join(__dirname, '..', 'dist');
    res.sendFile(join(distPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Billboard API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /api/charts - List all charts');
  console.log('  GET /api/chart - Hot 100 (current week)');
  console.log('  GET /api/chart/:name?date=YYYY-MM-DD - Specific chart');

  // Pre-caching disabled - only showing current week
  // precacheCharts();
});
