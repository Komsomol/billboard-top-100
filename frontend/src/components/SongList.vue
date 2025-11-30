<script setup>
import { computed } from 'vue';
import SongCard from './SongCard.vue';

const props = defineProps({
  songs: {
    type: Array,
    required: true
  },
  videos: {
    type: Map,
    default: () => new Map()
  },
  loadingVideos: {
    type: Set,
    default: () => new Set()
  },
  chartWeek: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['play-video']);

const formattedWeek = computed(() => {
  if (!props.chartWeek) return '';
  try {
    const date = new Date(props.chartWeek);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return props.chartWeek;
  }
});

const getVideo = (index) => {
  return props.videos.get(index) || null;
};

const isLoadingVideo = (index) => {
  return props.loadingVideos.has(index);
};
</script>

<template>
  <div class="song-list">
    <div v-if="chartWeek" class="chart-header">
      <h2>Chart Week: {{ formattedWeek }}</h2>
      <p class="song-count">{{ songs.length }} songs</p>
    </div>

    <div class="songs-grid">
      <SongCard
        v-for="(song, index) in songs"
        :key="`${song.rank}-${song.title}`"
        :song="song"
        :video="getVideo(index)"
        :loading-video="isLoadingVideo(index)"
        @play-video="emit('play-video', $event)"
      />
    </div>

    <div v-if="songs.length === 0" class="empty-state">
      <p>No songs to display</p>
    </div>
  </div>
</template>

<style scoped>
.song-list {
  width: 100%;
}

.chart-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
}

.chart-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem;
}

.song-count {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

.songs-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}
</style>
