import axios from 'axios';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Cache configuration (24 hours TTL)
const CACHE_TTL = 24 * 60 * 60 * 1000;
const videoCache = new Map();

const createCacheKey = (title, artist) => {
  return `${artist}-${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

const getFromCache = (key) => {
  const cached = videoCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    videoCache.delete(key);
    return null;
  }

  return cached.data;
};

const saveToCache = (key, data) => {
  videoCache.set(key, { data, timestamp: Date.now() });
};

const buildSearchQuery = (title, artist) => {
  const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
  const cleanArtist = artist.split(/,|Featuring|&/i)[0].trim();
  return `${cleanArtist} ${cleanTitle} official music video`;
};

const searchVideo = async (title, artist, apiKey) => {
  const cacheKey = createCacheKey(title, artist);

  const cached = getFromCache(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        q: buildSearchQuery(title, artist),
        type: 'video',
        videoCategoryId: '10',
        maxResults: 1,
        key: apiKey
      }
    });

    let result = null;
    if (response.data.items?.length > 0) {
      const video = response.data.items[0];
      result = {
        videoId: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle
      };
    }

    saveToCache(cacheKey, result);
    return result;
  } catch (error) {
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

    return null;
  }
};

/**
 * Fetches YouTube video IDs for an array of songs
 */
export const enrichSongsWithVideos = async (songs, apiKey, limit = 20) => {
  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    console.warn('YouTube API key not configured - skipping video enrichment');
    return songs;
  }

  const songsToEnrich = songs.slice(0, limit);
  const batchSize = 5;
  const enrichedSongs = [];

  for (let i = 0; i < songsToEnrich.length; i += batchSize) {
    const batch = songsToEnrich.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (song) => {
        const video = await searchVideo(song.title, song.artist, apiKey);
        return {
          ...song,
          video: video ? {
            videoId: video.videoId,
            embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
            watchUrl: `https://www.youtube.com/watch?v=${video.videoId}`
          } : null
        };
      })
    );

    enrichedSongs.push(...results);

    if (i + batchSize < songsToEnrich.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return enrichedSongs;
};
