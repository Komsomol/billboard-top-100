<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  song: {
    type: Object,
    required: true
  },
  video: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['play-video']);

const showVideo = ref(false);

const rankClass = computed(() => {
  if (props.song.rank === 1) return 'rank-gold';
  if (props.song.rank === 2) return 'rank-silver';
  if (props.song.rank === 3) return 'rank-bronze';
  return '';
});

const positionChange = computed(() => {
  const lastWeek = props.song.position?.positionLastWeek;
  if (!lastWeek) return { type: 'new', label: 'NEW' };

  const change = lastWeek - props.song.rank;
  if (change > 0) return { type: 'up', label: `+${change}` };
  if (change < 0) return { type: 'down', label: `${change}` };
  return { type: 'same', label: '=' };
});

const handlePlayClick = () => {
  if (props.video) {
    showVideo.value = true;
    emit('play-video', props.video);
  }
};

const closeVideo = () => {
  showVideo.value = false;
};
</script>

<template>
  <div class="song-card" :class="{ 'has-video': video }">
    <div class="rank" :class="rankClass">
      {{ song.rank }}
    </div>

    <div class="cover-container">
      <img
        v-if="song.cover"
        :src="song.cover"
        :alt="song.title"
        class="cover"
        loading="lazy"
      />
      <div v-else class="cover-placeholder">
        <span>{{ song.title.charAt(0) }}</span>
      </div>

      <button
        v-if="video"
        class="play-overlay"
        @click="handlePlayClick"
        aria-label="Play music video"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>

    <div class="info">
      <h3 class="title">{{ song.title }}</h3>
      <p class="artist">{{ song.artist }}</p>

      <div class="stats">
        <span class="stat" :class="positionChange.type">
          {{ positionChange.label }}
        </span>
        <span v-if="song.position?.peakPosition" class="stat peak">
          Peak: #{{ song.position.peakPosition }}
        </span>
        <span v-if="song.position?.weeksOnChart" class="stat weeks">
          {{ song.position.weeksOnChart }} weeks
        </span>
      </div>
    </div>

    <a
      v-if="video"
      :href="video.watchUrl"
      target="_blank"
      rel="noopener"
      class="youtube-link"
      title="Watch on YouTube"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
      </svg>
    </a>

    <!-- Video Modal -->
    <Teleport to="body">
      <div v-if="showVideo && video" class="video-modal" @click.self="closeVideo">
        <div class="video-container">
          <button class="close-btn" @click="closeVideo">&times;</button>
          <iframe
            :src="`${video.embedUrl}?autoplay=1`"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.song-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #1a1a2e;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.song-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.song-card.has-video {
  cursor: pointer;
}

.rank {
  font-size: 1.5rem;
  font-weight: 700;
  min-width: 48px;
  text-align: center;
  color: #666;
}

.rank-gold {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.rank-silver {
  color: #c0c0c0;
  text-shadow: 0 0 10px rgba(192, 192, 192, 0.5);
}

.rank-bronze {
  color: #cd7f32;
  text-shadow: 0 0 10px rgba(205, 127, 50, 0.5);
}

.cover-container {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.song-card:hover .play-overlay {
  opacity: 1;
}

.play-overlay svg {
  width: 32px;
  height: 32px;
  color: #fff;
}

.info {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist {
  font-size: 0.875rem;
  color: #a0a0a0;
  margin: 0 0 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stat {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #0f0f1a;
}

.stat.up {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.stat.down {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.stat.new {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.stat.same {
  color: #a0a0a0;
}

.stat.peak {
  color: #fbbf24;
}

.stat.weeks {
  color: #06b6d4;
}

.youtube-link {
  padding: 0.5rem;
  color: #666;
  transition: color 0.2s;
}

.youtube-link:hover {
  color: #ff0000;
}

.youtube-link svg {
  width: 24px;
  height: 24px;
}

/* Video Modal */
.video-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 900px;
  aspect-ratio: 16 / 9;
}

.video-container iframe {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}

.close-btn:hover {
  color: #ef4444;
}

@media (max-width: 640px) {
  .song-card {
    padding: 0.75rem;
  }

  .rank {
    font-size: 1.25rem;
    min-width: 36px;
  }

  .cover-container {
    width: 48px;
    height: 48px;
  }

  .stats {
    display: none;
  }
}
</style>
