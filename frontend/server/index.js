import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getChart, listCharts } from '../../src/index.js';
import { enrichSongsWithVideos } from './youtube.js';

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
 * Query params: date (YYYY-MM-DD format), videos (number of songs to get videos for)
 */
app.get('/api/chart/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { date, videos: videoLimit } = req.query;

    const chart = await getChart(name, date || '');

    // Enrich songs with YouTube video data
    const limit = parseInt(videoLimit) || 20;
    const apiKey = process.env.VITE_YOUTUBE_API_KEY;
    chart.songs = await enrichSongsWithVideos(chart.songs, apiKey, limit);

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
 */
app.get('/api/chart', async (req, res) => {
  try {
    const { date, videos: videoLimit } = req.query;
    const chart = await getChart('hot-100', date || '');

    // Enrich songs with YouTube video data
    const limit = parseInt(videoLimit) || 20;
    const apiKey = process.env.VITE_YOUTUBE_API_KEY;
    chart.songs = await enrichSongsWithVideos(chart.songs, apiKey, limit);

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
});
