import axios from 'axios';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Builds search query for finding official music videos
 */
const buildSearchQuery = (title, artist) => {
  const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
  const cleanArtist = artist
    .replace(/Featuring/gi, '')
    .replace(/&/g, '')
    .split(',')[0]
    .trim();

  return `${cleanArtist} ${cleanTitle} official music video`;
};

/**
 * Searches YouTube for a single music video
 */
const searchVideo = async (title, artist, apiKey) => {
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

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle
      };
    }

    return null;
  } catch (error) {
    console.error(`YouTube search failed for "${title}":`, error.message);
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

    // Small delay between batches
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
