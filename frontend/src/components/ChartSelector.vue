<script setup>
import { ref } from 'vue';
import { POPULAR_CHARTS } from '../services/billboard.js';

const props = defineProps({
  modelValue: {
    type: String,
    default: 'hot-100'
  },
  selectedDate: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'update:selectedDate', 'fetch']);

const handleChartChange = (event) => {
  emit('update:modelValue', event.target.value);
};

const handleDateChange = (event) => {
  emit('update:selectedDate', event.target.value);
};

const handleFetch = () => {
  emit('fetch');
};
</script>

<template>
  <div class="chart-selector">
    <div class="selector-row">
      <div class="field">
        <label for="chart-select">Chart</label>
        <select
          id="chart-select"
          :value="modelValue"
          :disabled="loading"
          @change="handleChartChange"
        >
          <option
            v-for="chart in POPULAR_CHARTS"
            :key="chart.value"
            :value="chart.value"
          >
            {{ chart.label }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="date-input">Date (optional)</label>
        <input
          id="date-input"
          type="date"
          :value="selectedDate"
          :disabled="loading"
          @change="handleDateChange"
        />
      </div>

      <button
        class="fetch-btn"
        :disabled="loading"
        @click="handleFetch"
      >
        <span v-if="loading" class="spinner"></span>
        <span v-else>Get Chart</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chart-selector {
  background: #1a1a2e;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.selector-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.field label {
  font-size: 0.875rem;
  color: #a0a0a0;
  font-weight: 500;
}

.field select,
.field input {
  padding: 0.75rem 1rem;
  border: 1px solid #333;
  border-radius: 8px;
  background: #0f0f1a;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}

.field select:focus,
.field input:focus {
  outline: none;
  border-color: #6366f1;
}

.field select:disabled,
.field input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fetch-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  min-width: 140px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fetch-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.fetch-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .selector-row {
    flex-direction: column;
  }

  .field {
    width: 100%;
  }

  .fetch-btn {
    width: 100%;
  }
}
</style>
