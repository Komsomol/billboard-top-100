<script setup>
defineProps({
  message: {
    type: String,
    default: 'Loading...'
  }
});
</script>

<template>
  <div class="loading-state">
    <div class="loader">
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
    </div>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
}

.loader {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 40px;
}

.bar {
  width: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  animation: pulse 1s ease-in-out infinite;
}

.bar:nth-child(1) { height: 20px; animation-delay: 0s; }
.bar:nth-child(2) { height: 30px; animation-delay: 0.1s; }
.bar:nth-child(3) { height: 40px; animation-delay: 0.2s; }
.bar:nth-child(4) { height: 30px; animation-delay: 0.3s; }
.bar:nth-child(5) { height: 20px; animation-delay: 0.4s; }

@keyframes pulse {
  0%, 100% {
    transform: scaleY(0.5);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

p {
  color: #a0a0a0;
  font-size: 1rem;
  margin: 0;
}
</style>
