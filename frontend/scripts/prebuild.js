import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getChart } from '../../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const buildSearchQuery = (title, artist) => {
  const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
  const cleanArtist = artist.split(/,|Featuring|&/i)[0].trim();
  return `${cleanArtist} ${cleanTitle} official music video`;
};

const searchVideo = async (title, artist, apiKey) => {
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: buildSearchQuery(title, artist),
      type: 'video',
      videoCategoryId: '10',
      maxResults: '1',
      key: apiKey
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    const data = await response.json();

    if (data.items?.length > 0) {
      const video = data.items[0];
      return {
        videoId: video.id.videoId,
        embedUrl: `https://www.youtube.com/embed/${video.id.videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`
      };
    }
    return null;
  } catch (error) {
    console.error(`YouTube search failed for "${title}":`, error.message);
    return null;
  }
};

const enrichSongsWithVideos = async (songs, apiKey, limit = 20) => {
  if (!apiKey) {
    console.warn('No YouTube API key - skipping video enrichment');
    return songs;
  }

  const songsToEnrich = songs.slice(0, limit);
  const enrichedSongs = [];

  for (const song of songsToEnrich) {
    const video = await searchVideo(song.title, song.artist, apiKey);
    enrichedSongs.push({
      ...song,
      video: video || null
    });
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return enrichedSongs;
};

async function prebuild() {
  console.log('Pre-building chart data...');

  try {
    // Fetch chart data
    console.log('Fetching Billboard Hot 100...');
    const chart = await getChart('hot-100');

    // Limit to top 20
    chart.songs = chart.songs.slice(0, 20);

    // Enrich with YouTube videos
    const apiKey = process.env.VITE_YOUTUBE_API_KEY;
    if (apiKey) {
      console.log('Enriching with YouTube videos...');
      chart.songs = await enrichSongsWithVideos(chart.songs, apiKey, 20);
    }

    // Create output directory
    const outputDir = join(__dirname, '..', 'public', 'data');
    mkdirSync(outputDir, { recursive: true });

    // Write chart data
    const outputPath = join(outputDir, 'chart.json');
    writeFileSync(outputPath, JSON.stringify({
      success: true,
      data: chart,
      generatedAt: new Date().toISOString()
    }, null, 2));

    console.log(`Chart data written to ${outputPath}`);
    console.log(`Songs: ${chart.songs.length}`);
    console.log(`Week: ${chart.week}`);

  } catch (error) {
    console.error('Prebuild failed:', error.message);
    process.exit(1);
  }
}

prebuild();
