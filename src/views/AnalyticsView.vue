<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Analytics & Charts</h1>
            <p class="text-xs sm:text-sm text-gray-600 mt-1">Consumption and billing insights</p>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading charts...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Consumption Chart -->
        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 class="text-lg font-semibold mb-4">Monthly Consumption (kWh)</h2>
          <div class="h-64 sm:h-96">
            <Line :data="consumptionChartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Bills Chart -->
        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 class="text-lg font-semibold mb-4">Monthly Bills Amount (₱)</h2>
          <div class="h-64 sm:h-96">
            <Bar :data="billsChartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Consumption by User -->
        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 class="text-lg font-semibold mb-4">Consumption by User</h2>
          <div class="h-64 sm:h-96">
            <Doughnut :data="userConsumptionData" :options="doughnutOptions" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Line, Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { consumptionService, billService } from '../services/localStorage.js';
import { useAuth } from '../store/auth.js';
import BackButton from '../components/BackButton.vue';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const { isMainUser, user } = useAuth();
const loading = ref(true);
const consumptionRecords = ref([]);
const bills = ref([]);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
    }
  }
};

const consumptionChartData = computed(() => {
  const monthlyData = {};
  
  consumptionRecords.value.forEach(record => {
    const date = new Date(record.reading_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey] += parseFloat(record.consumption_kwh || 0);
  });

  const labels = Object.keys(monthlyData).sort();
  const data = labels.map(key => monthlyData[key]);

  return {
    labels: labels.map(key => {
      const [year, month] = key.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [{
      label: 'Consumption (kWh)',
      data: data,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };
});

const billsChartData = computed(() => {
  const monthlyData = {};
  
  bills.value.forEach(bill => {
    const date = new Date(bill.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey] += parseFloat(bill.total_amount || 0);
  });

  const labels = Object.keys(monthlyData).sort();
  const data = labels.map(key => monthlyData[key]);

  return {
    labels: labels.map(key => {
      const [year, month] = key.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [{
      label: 'Bills Amount (₱)',
      data: data,
      backgroundColor: 'rgba(34, 197, 94, 0.5)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 1
    }]
  };
});

const userConsumptionData = computed(() => {
  const userData = {};
  
  consumptionRecords.value.forEach(record => {
    const userName = record.full_name || record.username;
    if (!userData[userName]) {
      userData[userName] = 0;
    }
    userData[userName] += parseFloat(record.consumption_kwh || 0);
  });

  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(251, 191, 36, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(236, 72, 153, 0.8)',
  ];

  return {
    labels: Object.keys(userData),
    datasets: [{
      data: Object.values(userData),
      backgroundColor: colors.slice(0, Object.keys(userData).length),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };
});

const loadData = async () => {
  try {
    loading.value = true;
    if (isMainUser.value) {
      consumptionRecords.value = consumptionService.getAll(user.value.id);
      bills.value = billService.getAll(user.value.id);
    } else {
      consumptionRecords.value = consumptionService.getMy(user.value.id);
      bills.value = billService.getMy(user.value.id);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

