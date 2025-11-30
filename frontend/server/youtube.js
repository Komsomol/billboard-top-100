import axios from 'axios';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Cache configuration
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const videoCache = new Map();

/**
 * Creates a cache key from artist and title
 */
const createCacheKey = (title, artist) => {
  return `${artist}-${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

/**
 * Gets cached video data if not expired
 */
const getFromCache = (key) => {
  const cached = videoCache.get(key);
  if (!cached) return null;

  // Check if expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    videoCache.delete(key);
    return null;
  }

  return cached.data;
};

/**
 * Saves video data to cache
 */
const saveToCache = (key, data) => {
  videoCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Returns cache statistics
 */
export const getCacheStats = () => ({
  size: videoCache.size,
  keys: Array.from(videoCache.keys())
});

/**
 * Builds search query for finding official music videos
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {string} Search query optimized for music videos
 */
export const buildSearchQuery = (title, artist) => {
  const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
  const cleanArtist = artist
    .split(/,|Featuring|&/i)[0]
    .trim();

  return `${cleanArtist} ${cleanTitle} official music video`;
};

/**
 * Searches YouTube for a single music video (with caching)
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @param {string} apiKey - YouTube API key
 * @returns {Promise<Object|null>} Video data or null
 */
export const searchVideo = async (title, artist, apiKey) => {
  const cacheKey = createCacheKey(title, artist);

  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached !== null) {
    console.log(`Cache hit for "${title}" by ${artist}`);
    return cached;
  }

  try {
    const query = buildSearchQuery(title, artist);

    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        videoCategoryId: '10',
        maxResults: 1,
        key: apiKey
      }
    });

    let result = null;
    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      result = {
        videoId: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle
      };
    }

    // Save to cache (even null results to avoid re-searching)
    saveToCache(cacheKey, result);
    console.log(`Cache miss for "${title}" - saved to cache`);

    return result;
  } catch (error) {
    // Log detailed error info
    const status = error.response?.status || 'unknown';
    const apiError = error.response?.data?.error;

    if (apiError) {
      console.error(`YouTube API error for "${title}": [${status}] ${apiError.message}`);
      if (apiError.errors?.[0]?.reason) {
        console.error(`  Reason: ${apiError.errors[0].reason}`);
      }
    } else {
      console.error(`YouTube search failed for "${title}": [${status}] ${error.message}`);
    }

    // Don't cache errors - allow retry later
    return null;
  }
};

/**
 * Fetches YouTube video IDs for an array of songs
 * @param {Array} songs - Array of song objects with title and artist
 * @param {string} apiKey - YouTube API key
 * @param {number} limit - Max songs to search (default 20)
 * @returns {Promise<Array>} Songs array with video data added
 */
export const enrichSongsWithVideos = async (songs, apiKey, limit = 20) => {
  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    console.warn('YouTube API key not configured - skipping video enrichment');
    return songs;
  }

  const songsToEnrich = songs.slice(0, limit);
  const remainingSongs = songs.slice(limit);

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  const enrichedSongs = [];

  for (let i = 0; i < songsToEnrich.length; i += batchSize) {
    const batch = songsToEnrich.slice(i, i + batchSize);

    const promises = batch.map(async (song) => {
      const video = await searchVideo(song.title, song.artist, apiKey);
      return {
        ...song,
        video: video ? {
          videoId: video.videoId,
          embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
          watchUrl: `https://www.youtube.com/watch?v=${video.videoId}`
        } : null
      };
    });

    const results = await Promise.all(promises);
    enrichedSongs.push(...results);

    // Small delay between batches (only if we made actual API calls)
    if (i + batchSize < songsToEnrich.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Add remaining songs without video data
  const remainingWithNull = remainingSongs.map((song) => ({
    ...song,
    video: null
  }));

  return [...enrichedSongs, ...remainingWithNull];
};
