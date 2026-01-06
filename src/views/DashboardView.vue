<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div class="flex items-center gap-3">
          <img src="/wattcount_logo.png" alt="WattCount Logo" class="w-10 h-10" />
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">WattCount Dashboard</h1>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            v-if="showInstallButton"
            @click="installPWA"
            class="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
          >
            📱 Install App
          </button>
          <span class="text-xs sm:text-sm text-gray-600 flex-1 sm:flex-none">Welcome, {{ user?.full_name }}</span>
          <button
            @click="handleLogout"
            class="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8">
          <router-link
            to="/dashboard"
            class="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
          >
            Overview
          </router-link>
          <router-link
            to="/bills"
            class="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Bills
          </router-link>
          <router-link
            v-if="isMainUser"
            to="/users"
            class="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Users
          </router-link>
          <router-link
            v-if="isMainUser"
            to="/calculator"
            class="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Calculator
          </router-link>
          <router-link
            v-if="isMainUser"
            to="/settings"
            class="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Settings
          </router-link>
          <router-link
            to="/analytics"
            class="border-b-2 border-transparent py-4 px-1 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
          >
            Analytics
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading...</p>
      </div>

      <div v-else class="space-y-4 sm:space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div class="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 class="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total Consumption</h3>
            <p class="text-2xl sm:text-3xl font-bold text-gray-900">{{ (stats.totalConsumption || 0).toFixed(2) }} kWh</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 class="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total Bills</h3>
            <p class="text-2xl sm:text-3xl font-bold text-gray-900">{{ stats.totalBills || 0 }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 class="text-xs sm:text-sm font-medium text-gray-500 mb-2">Unpaid Amount</h3>
            <p class="text-2xl sm:text-3xl font-bold text-red-600">₱{{ (stats.unpaidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
          </div>
        </div>

        <!-- Recent Bills -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Recent Bills</h2>
          </div>
          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing Cycle</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumption</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="bill in recentBills.slice(0, 5)" :key="bill.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ bill.billing_cycle }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div class="text-xs text-gray-500">{{ bill.previous_reading || 0 }} → {{ bill.current_reading }}</div>
                    <div class="font-medium">{{ bill.consumption_kwh }} kWh</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{{ bill.total_amount.toLocaleString() }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="{
                        'bg-green-100 text-green-800': bill.status === 'paid',
                        'bg-yellow-100 text-yellow-800': bill.status === 'partial',
                        'bg-red-100 text-red-800': bill.status === 'unpaid'
                      }"
                      class="px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ bill.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="recentBills.length === 0">
                  <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">No bills found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth.js';
import { billService } from '../services/localStorage.js';

const router = useRouter();
const { user, isMainUser, logout } = useAuth();

const loading = ref(true);
const recentBills = ref([]);
const showInstallButton = ref(false);
let deferredPrompt = null;

const stats = ref({
  totalConsumption: 0,
  totalBills: 0,
  unpaidAmount: 0
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const loadDashboardData = async () => {
  try {
    loading.value = true;
    
    // Load bills - shared users now see all bills (main + other shared users)
    const bills = billService.getMy(user.value.id, 5);
    recentBills.value = bills.slice(0, 5);
    
    // Calculate stats
    stats.value.totalBills = bills.length;
    stats.value.unpaidAmount = bills
      .filter(b => b.status !== 'paid')
      .reduce((sum, b) => sum + (b.remaining_amount || b.total_amount), 0);
    
    // Calculate total consumption from bills
    stats.value.totalConsumption = bills
      .filter(b => {
        const date = new Date(b.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, b) => sum + Math.abs(parseFloat(b.consumption_kwh || 0)), 0);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  } finally {
    loading.value = false;
  }
};

const handleLogout = () => {
  logout();
  router.push('/login');
};

const installPWA = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    deferredPrompt = null;
    showInstallButton.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
  
  // PWA Install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton.value = true;
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    showInstallButton.value = false;
    deferredPrompt = null;
  });
  
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    showInstallButton.value = false;
  }
});
</script>


