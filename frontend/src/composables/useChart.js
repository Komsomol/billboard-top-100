import { ref, reactive } from 'vue';
import { fetchChart, fetchChartsList } from '../services/billboard.js';
import { searchMusicVideo } from '../services/youtube.js';

/**
 * Composable for managing Billboard chart data and YouTube videos
 */
export const useChart = () => {
  // State
  const chart = ref(null);
  const chartsList = ref([]);
  const selectedChart = ref('hot-100');
  const selectedDate = ref('');
  const loading = ref(false);
  const error = ref(null);

  // Video state - using reactive for Maps/Sets
  const videos = reactive(new Map());
  const loadingVideos = reactive(new Set());

  /**
   * Fetches chart data and triggers video search
   */
  const loadChart = async () => {
    loading.value = true;
    error.value = null;
    videos.clear();
    loadingVideos.clear();

    try {
      const data = await fetchChart(selectedChart.value, selectedDate.value);
      chart.value = data;

      // Start loading videos for top songs
      loadVideosForSongs(data.songs, 20);
    } catch (err) {
      error.value = {
        message: 'Failed to load chart',
        details: err.message
      };
      chart.value = null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Loads YouTube videos for songs
   * @param {Array} songs - Songs array
   * @param {number} limit - Max songs to search
   */
  const loadVideosForSongs = async (songs, limit = 10) => {
    const songsToLoad = songs.slice(0, limit);

    // Load videos in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < songsToLoad.length; i += batchSize) {
      const batch = songsToLoad.slice(i, i + batchSize);
      const batchIndices = batch.map((_, idx) => i + idx);

      // Mark as loading
      batchIndices.forEach((idx) => loadingVideos.add(idx));

      // Fetch in parallel
      const promises = batch.map(async (song, batchIdx) => {
        const index = i + batchIdx;
        try {
          const video = await searchMusicVideo(song.title, song.artist);
          if (video) {
            videos.set(index, video);
          }
        } catch (err) {
          console.error(`Failed to load video for ${song.title}:`, err.message);
        } finally {
          loadingVideos.delete(index);
        }
      });

      await Promise.all(promises);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < songsToLoad.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  };

  /**
   * Loads a video for a specific song
   * @param {number} index - Song index
   */
  const loadVideoForSong = async (index) => {
    if (!chart.value || videos.has(index) || loadingVideos.has(index)) {
      return;
    }

    const song = chart.value.songs[index];
    if (!song) return;

    loadingVideos.add(index);

    try {
      const video = await searchMusicVideo(song.title, song.artist);
      if (video) {
        videos.set(index, video);
      }
    } catch (err) {
      console.error(`Failed to load video for ${song.title}:`, err.message);
    } finally {
      loadingVideos.delete(index);
    }
  };

  /**
   * Loads list of available charts
   */
  const loadChartsList = async () => {
    try {
      const data = await fetchChartsList();
      chartsList.value = data;
    } catch (err) {
      console.error('Failed to load charts list:', err.message);
    }
  };

  /**
   * Clears current chart data
   */
  const clearChart = () => {
    chart.value = null;
    videos.clear();
    loadingVideos.clear();
    error.value = null;
  };

  return {
    // State
    chart,
    chartsList,
    selectedChart,
    selectedDate,
    loading,
    error,
    videos,
    loadingVideos,

    // Actions
    loadChart,
    loadChartsList,
    loadVideoForSong,
    clearChart
  };
};
