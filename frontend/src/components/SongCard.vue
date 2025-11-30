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

const showModal = ref(false);

const openModal = () => {
  showModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  showModal.value = false;
  document.body.style.overflow = '';
};

const rankClass = computed(() => {
  if (props.song.rank === 1) return 'text-yellow-400';
  if (props.song.rank === 2) return 'text-gray-300';
  if (props.song.rank === 3) return 'text-amber-600';
  return 'text-gray-500';
});

const positionChange = computed(() => {
  const lastWeek = props.song.position?.positionLastWeek;
  if (!lastWeek) return { type: 'new', label: 'NEW', color: 'text-purple-400 bg-purple-400/10' };
  const change = lastWeek - props.song.rank;
  if (change > 0) return { type: 'up', label: `+${change}`, color: 'text-green-400 bg-green-400/10' };
  if (change < 0) return { type: 'down', label: `${change}`, color: 'text-red-400 bg-red-400/10' };
  return { type: 'same', label: '-', color: 'text-gray-500 bg-gray-500/10' };
});
</script>

<template>
  <div class="flex items-center gap-2 sm:gap-3 md:gap-4
              p-2.5 sm:p-3 md:p-4
              bg-white/[0.04] hover:bg-white/[0.08]
              rounded-xl sm:rounded-2xl
              transition-colors duration-150">
    <!-- Rank -->
    <div class="w-6 sm:w-7 md:w-8 text-center font-bold text-sm sm:text-base md:text-lg flex-shrink-0"
         :class="rankClass">
      {{ song.rank }}
    </div>

    <!-- Cover Image -->
    <img
      v-if="song.cover"
      :src="song.cover"
      :alt="song.title"
      class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
             rounded-lg sm:rounded-xl object-cover flex-shrink-0"
      loading="lazy"
    />
    <div v-else
         class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                rounded-lg sm:rounded-xl flex-shrink-0
                bg-gradient-to-br from-gray-700 to-gray-800
                flex items-center justify-center
                font-semibold text-base sm:text-lg text-gray-500">
      {{ song.title.charAt(0) }}
    </div>

    <!-- Song Info -->
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-sm sm:text-base md:text-lg
                  truncate leading-tight">
        {{ song.title }}
      </div>
      <div class="text-xs sm:text-sm md:text-base text-gray-400
                  truncate leading-tight mt-0.5">
        {{ song.artist }}
      </div>
    </div>

    <!-- Position Change Badge -->
    <div class="text-[10px] sm:text-xs font-semibold
                px-1.5 sm:px-2 py-0.5 sm:py-1
                rounded flex-shrink-0"
         :class="positionChange.color">
      {{ positionChange.label }}
    </div>

    <!-- Play Button -->
    <button
      v-if="video"
      @click="openModal"
      class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11
             flex items-center justify-center
             bg-red-600 hover:bg-red-500 hover:scale-110
             rounded-full flex-shrink-0
             transition-all duration-150 cursor-pointer"
      title="Play Video"
    >
      <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>
    <div v-else
         class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11
                flex items-center justify-center
                bg-white/10 rounded-full flex-shrink-0
                text-gray-600">
      <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </div>
  </div>

  <!-- Video Modal -->
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
      @click.self="closeModal"
    >
      <!-- Modal Content -->
      <div class="relative w-full max-w-4xl">
        <!-- Close Button -->
        <button
          @click="closeModal"
          class="absolute -top-12 right-0 w-10 h-10
                 flex items-center justify-center
                 text-white/70 hover:text-white
                 transition-colors cursor-pointer"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Song Info -->
        <div class="mb-4 text-center">
          <h3 class="text-lg sm:text-xl font-semibold text-white">{{ song.title }}</h3>
          <p class="text-sm sm:text-base text-gray-400">{{ song.artist }}</p>
        </div>

        <!-- Video Player -->
        <div class="relative w-full" style="padding-bottom: 56.25%;">
          <iframe
            v-if="video"
            :src="`${video.embedUrl}?autoplay=1`"
            class="absolute inset-0 w-full h-full rounded-lg"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  </Teleport>
</template>
