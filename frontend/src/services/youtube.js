import axios from 'axios';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// Check for required environment variable
const isApiKeyConfigured = () => {
  if (!API_KEY || API_KEY === 'your_youtube_api_key_here') {
    console.warn(
      '[YouTube Service] VITE_YOUTUBE_API_KEY is not configured.\n' +
      'Copy .env.example to .env and add your YouTube API key.\n' +
      'Get a key at: https://console.cloud.google.com/apis/credentials'
    );
    return false;
  }
  return true;
};

// Cache for YouTube search results to avoid duplicate API calls
const videoCache = new Map();

/**
 * Builds a specific search query for finding official music videos
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {string} Search query optimized for music videos
 */
const buildSearchQuery = (title, artist) => {
  // Clean up the title and artist
  const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
  const cleanArtist = artist
    .replace(/Featuring/gi, '')
    .replace(/&/g, '')
    .split(',')[0]
    .trim();

  return `${cleanArtist} ${cleanTitle} official music video`;
};

/**
 * Searches YouTube for an official music video
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<Object|null>} Video data or null if not found
 */
export const searchMusicVideo = async (title, artist) => {
  // Check if API key is configured
  if (!isApiKeyConfigured()) {
    return null;
  }

  const cacheKey = `${title}-${artist}`.toLowerCase();

  // Check cache first
  if (videoCache.has(cacheKey)) {
    return videoCache.get(cacheKey);
  }

  try {
    const query = buildSearchQuery(title, artist);

    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: 1,
        key: API_KEY
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      const result = {
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        channelTitle: video.snippet.channelTitle,
        embedUrl: `https://www.youtube.com/embed/${video.id.videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`
      };

      // Cache the result
      videoCache.set(cacheKey, result);
      return result;
    }

    videoCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error('YouTube API error:', error.message);
    // Return null instead of throwing to gracefully handle API errors
    return null;
  }
};

/**
 * Searches YouTube for multiple songs in parallel
 * @param {Array} songs - Array of song objects with title and artist
 * @param {number} [limit=10] - Maximum number of songs to search
 * @returns {Promise<Map>} Map of song index to video data
 */
export const searchMusicVideos = async (songs, limit = 10) => {
  const results = new Map();
  const songsToSearch = songs.slice(0, limit);

  const promises = songsToSearch.map(async (song, index) => {
    const video = await searchMusicVideo(song.title, song.artist);
    if (video) {
      results.set(index, video);
    }
  });

  await Promise.all(promises);
  return results;
};

/**
 * Clears the video cache
 */
export const clearVideoCache = () => {
  videoCache.clear();
};
