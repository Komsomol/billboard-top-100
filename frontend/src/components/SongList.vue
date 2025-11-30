<script setup>
import { computed } from 'vue';
import SongCard from './SongCard.vue';

const props = defineProps({
  songs: {
    type: Array,
    required: true
  },
  chartWeek: {
    type: String,
    default: ''
  }
});

const formattedDate = computed(() => {
  if (!props.chartWeek) return '';
  try {
    const date = new Date(props.chartWeek);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return props.chartWeek;
  }
});
</script>

<template>
  <div class="w-full">
    <!-- Week Label -->
    <div v-if="chartWeek" class="text-center mb-4 sm:mb-6 md:mb-8">
      <span class="text-xs sm:text-sm text-gray-500">
        Week of {{ formattedDate }}
      </span>
    </div>

    <!-- Songs Grid - Single column on mobile, 2 columns on large desktop -->
    <div class="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-5
                xl:grid xl:grid-cols-2 xl:gap-6">
      <SongCard
        v-for="song in songs"
        :key="`${song.rank}-${song.title}`"
        :song="song"
        :video="song.video"
      />
    </div>

    <!-- Empty State -->
    <div v-if="songs.length === 0" class="text-center py-12 sm:py-16 text-gray-500">
      No songs to display
    </div>
  </div>
</template>
