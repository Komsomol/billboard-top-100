<script setup>
defineProps({
  message: {
    type: String,
    default: 'Something went wrong'
  },
  details: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['retry']);
</script>

<template>
  <div class="error-state">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <h3>{{ message }}</h3>
    <p v-if="details">{{ details }}</p>
    <button @click="emit('retry')">Try Again</button>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.icon {
  width: 64px;
  height: 64px;
  color: #ef4444;
}

.icon svg {
  width: 100%;
  height: 100%;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

p {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
  max-width: 400px;
}

button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

button:hover {
  background: #252540;
  border-color: #6366f1;
}
</style>
