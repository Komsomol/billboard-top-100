import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getChart } from '../../src/index.js';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, 'video-cache.json');
const BLOCKED_CHANNELS = ['7clouds'];

const cacheKey = (title, artist) => `${artist} - ${title}`;

const loadCache = () => {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    console.warn('Failed to read video cache, starting fresh');
    return {};
  }
};

const saveCache = (cache) => {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
};

const buildSearchQuery = (title, artist) => {
  const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
  const cleanArtist = artist.split(/,|Featuring|&/i)[0].trim();
  return `${cleanArtist} ${cleanTitle} official video`;
};

const isBlockedChannel = (channel) =>
  BLOCKED_CHANNELS.some(blocked => channel.toLowerCase().includes(blocked.toLowerCase()));

const scoreResult = (title, channel, artist) => {
  const chanLower = channel.toLowerCase();
  const titleLower = title.toLowerCase();

  if (isBlockedChannel(channel)) return -1;

  let score = 0;
  if (chanLower.includes(artist)) score += 10;
  if (titleLower.includes('official video') || titleLower.includes('official music video')) score += 5;
  if (chanLower.includes('vevo')) score += 8;
  if (titleLower.includes('lyric') || titleLower.includes('audio')) score -= 3;
  return score;
};

const searchVideo = async (title, artist) => {
  const query = buildSearchQuery(title, artist);
  const cleanArtist = artist.split(/,|Featuring|&/i)[0].trim().toLowerCase();

  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      `ytsearch5:${query}`,
      '--print', '%(id)s\t%(title)s\t%(channel)s',
      '--no-download'
    ], { timeout: 30000 });

    const results = stdout.trim().split('\n')
      .filter(line => line.includes('\t'))
      .map(line => {
        const [id, videoTitle, channel] = line.split('\t');
        return { id, title: videoTitle, channel };
      });

    if (results.length === 0) return null;

    const scored = results
      .map(r => ({ ...r, score: scoreResult(r.title, r.channel, cleanArtist) }))
      .filter(r => r.score >= 0)
      .sort((a, b) => b.score - a.score);

    const best = scored.length > 0 ? scored[0] : results[0];
    return {
      videoId: best.id,
      embedUrl: `https://www.youtube.com/embed/${best.id}`,
      watchUrl: `https://www.youtube.com/watch?v=${best.id}`
    };
  } catch (error) {
    console.error(`yt-dlp search failed for "${artist} - ${title}":`, error.message);
    return null;
  }
};

const enrichSongsWithVideos = async (songs, limit = 20) => {
  const cache = loadCache();
  const songsToEnrich = songs.slice(0, limit);
  const enrichedSongs = [];
  let cacheHits = 0;
  let searches = 0;

  for (const song of songsToEnrich) {
    const key = cacheKey(song.title, song.artist);

    if (key in cache && cache[key] !== null) {
      cacheHits++;
      enrichedSongs.push({ ...song, video: cache[key] });
      continue;
    }

    searches++;
    const video = await searchVideo(song.title, song.artist);
    if (video) {
      cache[key] = video;
    }
    enrichedSongs.push({ ...song, video: video || null });
  }

  saveCache(cache);
  console.log(`Video cache: ${cacheHits} hits, ${searches} searches`);

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

    // Enrich with YouTube videos via yt-dlp
    console.log('Searching for YouTube videos...');
    chart.songs = await enrichSongsWithVideos(chart.songs, 20);

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
