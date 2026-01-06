<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <BackButton />
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Settings</h1>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <!-- Electricity Rate -->
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 class="text-base sm:text-lg font-semibold mb-4">Electricity Rate</h2>
        
        <div v-if="currentRate" class="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <p class="text-xs sm:text-sm text-gray-500">Current Rate</p>
          <p class="text-xl sm:text-2xl font-bold">₱{{ currentRate.rate_per_kwh }} per kWh</p>
          <p class="text-xs sm:text-sm text-gray-500 mt-1">
            Effective from: {{ formatDate(currentRate.effective_from) }}
            <span v-if="currentRate.effective_to"> to {{ formatDate(currentRate.effective_to) }}</span>
          </p>
        </div>

        <form @submit.prevent="setRate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rate per kWh</label>
            <input
              v-model.number="rateForm.rate_per_kwh"
              type="number"
              step="0.0001"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., 12.50"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Effective From</label>
            <input
              v-model="rateForm.effective_from"
              type="date"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Effective To (Optional)</label>
            <input
              v-model="rateForm.effective_to"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Set Rate
          </button>
        </form>
      </div>

      <!-- Rate History -->
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 class="text-base sm:text-lg font-semibold mb-4">Rate History</h2>
        <div v-if="rateHistory.length > 0" class="space-y-2">
          <div v-for="rate in rateHistory" :key="rate.id" class="p-3 border rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-semibold">₱{{ rate.rate_per_kwh }} per kWh</p>
                <p class="text-sm text-gray-500">
                  {{ formatDate(rate.effective_from) }}
                  <span v-if="rate.effective_to"> - {{ formatDate(rate.effective_to) }}</span>
                </p>
              </div>
              <span
                :class="rate.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ rate.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-500">No rate history</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { rateService } from '../services/localStorage.js';
import { useAuth } from '../store/auth.js';
import BackButton from '../components/BackButton.vue';
import notificationService from '../services/notifications.js';

const { user } = useAuth();
const currentRate = ref(null);
const rateHistory = ref([]);

const rateForm = ref({
  rate_per_kwh: '',
  effective_from: new Date().toISOString().split('T')[0],
  effective_to: ''
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const loadRates = async () => {
  try {
    currentRate.value = rateService.getCurrent();
    rateHistory.value = rateService.getAll();
  } catch (error) {
    console.error('Error loading rates:', error);
  }
};

const setRate = async () => {
  try {
    rateService.create({
      ...rateForm.value,
      created_by: user.value.id
    });
    notificationService.notifySuccess('Electricity rate set successfully');
    rateForm.value = {
      rate_per_kwh: '',
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: ''
    };
    loadRates();
  } catch (error) {
    notificationService.notifyError(error.message || 'Error setting rate');
    alert(error.message || 'Error setting rate');
  }
};

onMounted(() => {
  loadRates();
});
</script>


