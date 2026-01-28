import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getChart } from '../../src/index.js';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, 'video-cache.json');

/** Maximum number of songs to enrich with video data */
const SONGS_LIMIT = 20;

/** Number of YouTube search results to fetch per song (ytsearchN:) */
const YT_SEARCH_COUNT = 5;

/** Timeout for each yt-dlp subprocess in milliseconds */
const YT_DLP_TIMEOUT_MS = 30000;

/**
 * Scoring weights for ranking YouTube search results.
 * Higher scores indicate a more likely official music video.
 */
const SCORE_WEIGHTS = {
  TITLE_MATCH: 15,      // Video title contains the song title (prevents wrong-song matches)
  ARTIST_CHANNEL: 10,   // Channel name contains the artist name
  VEVO_CHANNEL: 8,      // VEVO channels host official music videos
  OFFICIAL_VIDEO: 5,    // Title contains "Official Video" / "Official Music Video"
  LYRIC_OR_AUDIO: -3,   // Penalize lyric videos and audio-only uploads
  BLOCKED: -1           // Sentinel: filtered out entirely
};

// Channels that re-upload songs with custom visuals (not official content)
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

/**
 * Builds a YouTube search query for a song.
 * Strips parenthetical info (e.g., "(feat. X)") from the title and
 * uses only the primary artist (before commas/featuring/ampersands).
 * @param {string} title - Song title from Billboard
 * @param {string} artist - Artist name from Billboard
 * @returns {string} Search query string
 */
const buildSearchQuery = (title, artist) => {
  const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
  const cleanArtist = artist.split(/,|Featuring|&/i)[0].trim();
  return `${cleanArtist} ${cleanTitle} official video`;
};

/**
 * Checks if a YouTube channel is in the blocked list.
 * Blocked channels re-upload songs with non-official visuals.
 * @param {string} channel - YouTube channel name
 * @returns {boolean} True if the channel should be excluded
 */
const isBlockedChannel = (channel) =>
  BLOCKED_CHANNELS.some(blocked => channel.toLowerCase().includes(blocked.toLowerCase()));

/**
 * Scores a YouTube search result to rank official music videos higher.
 * Returns SCORE_WEIGHTS.BLOCKED (-1) for blocked channels (filtered out by caller).
 * @param {string} title - Video title
 * @param {string} channel - YouTube channel name
 * @param {string} artist - Lowercase primary artist name
 * @param {string} songTitle - Lowercase song title to match against
 * @returns {number} Score (higher = more likely official video, -1 = blocked)
 */
const scoreResult = (title, channel, artist, songTitle) => {
  const chanLower = channel.toLowerCase();
  const titleLower = title.toLowerCase();

  if (isBlockedChannel(channel)) return SCORE_WEIGHTS.BLOCKED;

  let score = 0;
  if (titleLower.includes(songTitle)) score += SCORE_WEIGHTS.TITLE_MATCH;
  if (chanLower.includes(artist)) score += SCORE_WEIGHTS.ARTIST_CHANNEL;
  if (titleLower.includes('official video') || titleLower.includes('official music video')) score += SCORE_WEIGHTS.OFFICIAL_VIDEO;
  if (chanLower.includes('vevo')) score += SCORE_WEIGHTS.VEVO_CHANNEL;
  if (titleLower.includes('lyric') || titleLower.includes('audio')) score += SCORE_WEIGHTS.LYRIC_OR_AUDIO;
  return score;
};

/**
 * Searches YouTube for the best matching music video using yt-dlp.
 * Requires yt-dlp to be installed as a system-level CLI tool.
 * Uses --flat-playlist to read only search metadata (avoids visiting
 * individual video pages, which triggers YouTube bot detection).
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<{videoId: string, embedUrl: string, watchUrl: string}|null>}
 */
const searchVideo = async (title, artist) => {
  const query = buildSearchQuery(title, artist);
  const cleanArtist = artist.split(/,|Featuring|&/i)[0].trim().toLowerCase();
  const cleanTitle = title.replace(/\(.*?\)/g, '').trim().toLowerCase();

  try {
    // Output format: tab-delimited "videoId\tvideoTitle\tchannelName" per line
    const { stdout } = await execFileAsync('yt-dlp', [
      `ytsearch${YT_SEARCH_COUNT}:${query}`,
      '--flat-playlist',
      '--print', '%(id)s\t%(title)s\t%(channel)s',
      '--no-download'
    ], { timeout: YT_DLP_TIMEOUT_MS });

    const results = stdout.trim().split('\n')
      .filter(line => line.includes('\t'))
      .map(line => {
        const [id, videoTitle, channel] = line.split('\t');
        return { id, title: videoTitle, channel };
      });

    if (results.length === 0) return null;

    const scored = results
      .map(r => ({ ...r, score: scoreResult(r.title, r.channel, cleanArtist, cleanTitle) }))
      .filter(r => r.score >= 0)
      .sort((a, b) => b.score - a.score);

    // Debug: log scoring for visibility in CI
    console.log(`  "${artist} - ${title}" results:`);
    results.forEach(r => {
      const s = scoreResult(r.title, r.channel, cleanArtist, cleanTitle);
      console.log(`    [${s}] ${r.title} (${r.channel}) id=${r.id}`);
    });

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

/**
 * Enriches an array of songs with YouTube video data.
 * Uses a persistent JSON file cache to avoid redundant yt-dlp searches.
 * Only new songs (not in cache) trigger yt-dlp calls.
 * @param {Array<{title: string, artist: string}>} songs - Songs to enrich
 * @param {number} [limit=SONGS_LIMIT] - Maximum number of songs to process
 * @returns {Promise<Array>} Songs with video property added
 */
const enrichSongsWithVideos = async (songs, limit = SONGS_LIMIT) => {
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

/**
 * Main prebuild entry point. Fetches the Billboard Hot 100 chart,
 * enriches top songs with YouTube video links via yt-dlp, and writes
 * the result as static JSON for the Cloudflare Pages frontend.
 */
async function prebuild() {
  console.log('Pre-building chart data...');

  try {
    console.log('Fetching Billboard Hot 100...');
    const chart = await getChart('hot-100');

    chart.songs = chart.songs.slice(0, SONGS_LIMIT);

    console.log('Searching for YouTube videos...');
    chart.songs = await enrichSongsWithVideos(chart.songs, SONGS_LIMIT);

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
