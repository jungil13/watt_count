<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile-friendly header -->
    <header class="bg-white shadow sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Billing Calculator</h1>
            <p class="text-xs sm:text-sm text-gray-600 mt-1">Calculate bills for all apartments/units</p>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <!-- Current Rate Display -->
      <div v-if="currentRate" class="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p class="text-xs sm:text-sm text-gray-600">Current Electricity Rate</p>
            <p class="text-xl sm:text-2xl font-bold text-blue-700">₱{{ currentRate.rate_per_kwh }} per kWh</p>
          </div>
          <button
            @click="loadRates"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm w-full sm:w-auto"
          >
            Refresh Rate
          </button>
        </div>
      </div>

      <!-- Billing Cycle Input -->
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 class="text-base sm:text-lg font-semibold mb-4">Billing Information</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Billing Cycle</label>
            <input
              v-model="billingCycle"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., January 2024"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reading Date (This Month)</label>
            <input
              v-model="readingDate"
              type="date"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- Users Input Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 class="text-base sm:text-lg font-semibold">Meter Readings</h2>
          <button
            @click="autoFillPreviousReadings"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm w-full sm:w-auto"
          >
            Auto-fill Last Month Readings
          </button>
        </div>
        
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Month</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">This Month</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumption</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(user, index) in usersWithReadings" :key="user.id" class="hover:bg-gray-50">
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ user.full_name }}</p>
                    <p class="text-xs text-gray-500">@{{ user.username }}</p>
                  </div>
                </td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="user.previous_reading"
                    type="number"
                    step="0.01"
                    class="w-24 lg:w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    @input="calculateUserBill(user)"
                  />
                  <p class="text-xs text-gray-400 mt-1">Last month</p>
                </td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="user.current_reading"
                    type="number"
                    step="0.01"
                    required
                    class="w-24 lg:w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter"
                    @input="calculateUserBill(user)"
                  />
                  <p class="text-xs text-gray-400 mt-1">This month</p>
                </td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div class="text-sm">
                    <span class="font-medium text-gray-900">
                      {{ Math.abs(user.consumption_kwh || 0).toFixed(2) }} kWh
                    </span>
                    <div v-if="user.current_reading !== null && user.current_reading !== undefined" class="text-xs text-gray-500 mt-1">
                      {{ user.previous_reading || 0 }} - {{ user.current_reading }} = {{ Math.abs(user.consumption_kwh).toFixed(2) }}
                    </div>
                  </div>
                </td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-bold text-blue-600">
                    ₱{{ Math.abs(user.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </span>
                </td>
                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    v-if="user.current_reading !== null && user.current_reading !== undefined"
                    @click="saveUserRecord(user)"
                    class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                  >
                    Save
                  </button>
                </td>
              </tr>
              <tr v-if="usersWithReadings.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                  No users found. Add shared users first.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden divide-y divide-gray-200">
          <div v-for="(user, index) in usersWithReadings" :key="user.id" class="p-4 space-y-3">
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ user.full_name }}</p>
              <p class="text-xs text-gray-500">@{{ user.username }}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Last Month</label>
                <input
                  v-model.number="user.previous_reading"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  @input="calculateUserBill(user)"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">This Month</label>
                <input
                  v-model.number="user.current_reading"
                  type="number"
                  step="0.01"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter"
                  @input="calculateUserBill(user)"
                />
              </div>
            </div>

            <div v-if="user.current_reading !== null && user.current_reading !== undefined" class="bg-blue-50 rounded-lg p-3 space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Consumption:</span>
                <span class="font-semibold text-blue-700">
                  {{ Math.abs(user.consumption_kwh || 0).toFixed(2) }} kWh
                </span>
              </div>
              <div class="text-xs text-gray-500">
                {{ user.previous_reading || 0 }} - {{ user.current_reading }} = {{ Math.abs(user.consumption_kwh).toFixed(2) }} kWh
              </div>
              <div class="flex justify-between text-sm pt-1 border-t border-blue-200">
                <span class="text-gray-600">Amount:</span>
                <span class="font-bold text-blue-700">
                  ₱{{ Math.abs(user.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </span>
              </div>
              <button
                @click="saveUserRecord(user)"
                class="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Save Record
              </button>
            </div>
            <div v-else class="text-xs text-gray-400 text-center py-2">
              Enter readings to calculate
            </div>
          </div>
          <div v-if="usersWithReadings.length === 0" class="p-4 text-center text-sm text-gray-500">
            No users found. Add shared users first.
          </div>
        </div>
      </div>

      <!-- Summary Card -->
      <div v-if="usersWithReadings.some(u => u.current_reading !== null && u.current_reading !== undefined && u.consumption_kwh !== 0)" class="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 class="text-base sm:text-lg font-semibold mb-4">Billing Summary</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-gray-50 rounded-lg p-3 sm:p-4">
            <p class="text-xs sm:text-sm text-gray-600">Total Units</p>
            <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ usersWithReadings.length }}</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-3 sm:p-4">
            <p class="text-xs sm:text-sm text-gray-600">Total Consumption</p>
            <p class="text-xl sm:text-2xl font-bold text-blue-700">{{ totalConsumption.toFixed(2) }} kWh</p>
          </div>
          <div class="bg-green-50 rounded-lg p-3 sm:p-4">
            <p class="text-xs sm:text-sm text-gray-600">Total Amount</p>
            <p class="text-xl sm:text-2xl font-bold text-green-700">₱{{ totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-3 sm:p-4">
            <p class="text-xs sm:text-sm text-gray-600">Avg per Unit</p>
            <p class="text-xl sm:text-2xl font-bold text-yellow-700">₱{{ Math.abs(averageAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="usersWithReadings.length > 0" class="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 class="text-base sm:text-lg font-semibold mb-4">Bulk Actions</h2>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="saveAllRecords"
            :disabled="!canSaveAll || saving"
            class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm sm:text-base"
          >
            {{ saving ? 'Saving...' : '💾 Save All & Generate Bills' }}
          </button>
          <button
            @click="clearAll"
            class="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium text-sm sm:text-base"
          >
            🗑️ Clear All
          </button>
        </div>
        <p v-if="canSaveAll" class="text-xs text-gray-500 mt-3">
          Ready to save {{ validUsersCount }} record(s) for billing cycle: <strong>{{ billingCycle || 'Not set' }}</strong>
        </p>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="message" :class="messageType === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'" class="p-4 border rounded-lg text-sm">
        {{ message }}
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { userService, rateService, billService, consumptionService } from '../services/localStorage.js';
import { useAuth } from '../store/auth.js';
import BackButton from '../components/BackButton.vue';
import notificationService from '../services/notifications.js';

const { user } = useAuth();
const currentRate = ref(null);
const billingCycle = ref('');
const readingDate = ref(new Date().toISOString().split('T')[0]);
const usersWithReadings = ref([]);
const saving = ref(false);
const message = ref('');
const messageType = ref('success');

const totalConsumption = computed(() => {
  return Math.abs(usersWithReadings.value.reduce((sum, user) => sum + (user.consumption_kwh || 0), 0));
});

const totalAmount = computed(() => {
  return Math.abs(usersWithReadings.value.reduce((sum, user) => sum + (user.total_amount || 0), 0));
});

const averageAmount = computed(() => {
  const validUsers = usersWithReadings.value.filter(u => u.total_amount !== 0 && u.total_amount !== null && u.total_amount !== undefined);
  return validUsers.length > 0 ? Math.abs(totalAmount.value) / validUsers.length : 0;
});

const canSaveAll = computed(() => {
  return usersWithReadings.value.some(user => 
    user.current_reading !== null && 
    user.current_reading !== undefined &&
    user.current_reading >= 0
  );
});

const validUsersCount = computed(() => {
  return usersWithReadings.value.filter(user => 
    user.current_reading !== null && 
    user.current_reading !== undefined &&
    user.current_reading >= 0
  ).length;
});

const loadRates = async () => {
  try {
    currentRate.value = rateService.getCurrent();
    if (!currentRate.value) {
      showMessage('No electricity rate configured. Please set a rate in Settings first.', 'error');
    }
  } catch (error) {
    showMessage('No electricity rate configured. Please set a rate in Settings first.', 'error');
  }
};

const loadUsers = async () => {
  try {
    const users = userService.getAllSharedUsers(user.value.id);
    const mainUser = userService.getById(user.value.id);
    
    // Include main user and all shared users
    const allUsers = [mainUser, ...users];
    
    usersWithReadings.value = allUsers.map(user => ({
      ...user,
      previous_reading: 0,
      current_reading: null,
      consumption_kwh: 0,
      total_amount: 0
    }));
    
    await autoFillPreviousReadings();
  } catch (error) {
    console.error('Error loading users:', error);
    showMessage('Error loading users', 'error');
  }
};

const autoFillPreviousReadings = async () => {
  try {
    showMessage('Loading previous readings...', 'success');
    // Get all bills to find latest readings for each user
    const allBills = billService.getAll(user.value.id);
    
    let filledCount = 0;
    for (const user of usersWithReadings.value) {
      // Find the latest bill for this user to get their last reading
      const userBills = allBills.filter(b => b.user_id === user.id);
      if (userBills && userBills.length > 0) {
        // Sort by date descending and get the most recent bill
        const latest = userBills.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0];
        // Previous reading should be the last month's current reading from the bill
        if (latest.current_reading) {
          user.previous_reading = parseFloat(latest.current_reading || 0);
          filledCount++;
        } else {
          user.previous_reading = 0;
        }
      } else {
        // No previous bills, try to get from consumption records as fallback
        try {
          const records = consumptionService.getAll(user.value.id);
          const userRecords = records.filter(r => r.user_id === user.id);
          if (userRecords && userRecords.length > 0) {
            const latest = userRecords.sort((a, b) => 
              new Date(b.reading_date) - new Date(a.reading_date)
            )[0];
            user.previous_reading = parseFloat(latest.current_reading || 0);
            filledCount++;
          } else {
            user.previous_reading = 0;
          }
        } catch (err) {
          user.previous_reading = 0;
        }
      }
    }
    
    showMessage(`Loaded previous readings for ${filledCount} user(s)`, 'success');
  } catch (error) {
    console.error('Error auto-filling readings:', error);
    showMessage('Error loading previous readings', 'error');
  }
};

const calculateUserBill = (user) => {
  if (user.current_reading === null || user.current_reading === undefined || !currentRate.value) {
    user.consumption_kwh = 0;
    user.total_amount = 0;
    return;
  }

  // Previous reading is last month, current reading is this month
  const prev = parseFloat(user.previous_reading || 0);
  const curr = parseFloat(user.current_reading);
  
  // Calculate: (This Month - Last Month) × Rate = Amount
  // Allow negative consumption (meter reset, replacement, or corrections)
  user.consumption_kwh = parseFloat((curr - prev).toFixed(2));
  user.total_amount = parseFloat((user.consumption_kwh * currentRate.value.rate_per_kwh).toFixed(2));
};

const saveUserRecord = async (user) => {
  if (!billingCycle.value || !readingDate.value) {
    showMessage('Please enter billing cycle and reading date first', 'error');
    return;
  }

  // Allow any current reading value - no restrictions
  if (user.current_reading === null || user.current_reading === undefined) {
    showMessage('Please enter a current reading for ' + user.full_name, 'error');
    return;
  }

  try {
    saving.value = true;
    // Create consumption record
    const consumption_kwh = user.current_reading - (user.previous_reading || 0);
    const record = consumptionService.create({
      user_id: user.id,
      reading_date: readingDate.value,
      current_reading: user.current_reading,
      previous_reading: user.previous_reading || 0,
      consumption_kwh: consumption_kwh,
      billing_cycle: billingCycle.value
    });

    // Auto-generate bill if billing cycle is provided
    if (billingCycle.value && currentRate.value) {
      const total_amount = consumption_kwh * currentRate.value.rate_per_kwh;
      billService.create({
        user_id: user.id,
        consumption_record_id: record.id,
        billing_cycle: billingCycle.value,
        consumption_kwh: consumption_kwh,
        rate_per_kwh: currentRate.value.rate_per_kwh,
        total_amount: total_amount
      });
    }

    showMessage(`Record saved for ${user.full_name}`, 'success');
    notificationService.notifySuccess(`Record saved for ${user.full_name}`);
    
    // Update previous reading for next time
    user.previous_reading = user.current_reading;
    user.current_reading = null;
    user.consumption_kwh = 0;
    user.total_amount = 0;
  } catch (error) {
    showMessage(`Error saving record for ${user.full_name}: ${error.message}`, 'error');
    notificationService.notifyError(`Error saving record: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

const saveAllRecords = async () => {
  if (!billingCycle.value || !readingDate.value) {
    showMessage('Please enter billing cycle and reading date first', 'error');
    return;
  }

  if (!canSaveAll.value) {
    showMessage('No valid records to save', 'error');
    return;
  }

  saving.value = true;
  message.value = '';

  try {
    const validUsers = usersWithReadings.value.filter(user => 
      user.current_reading !== null && 
      user.current_reading !== undefined
    );

    let successCount = 0;
    let errorCount = 0;

    for (const user of validUsers) {
      try {
        // Create consumption record
        const prevReading = user.previous_reading !== null && user.previous_reading !== undefined ? user.previous_reading : 0;
        const consumption_kwh = user.current_reading - prevReading;
        const record = consumptionService.create({
          user_id: user.id,
          reading_date: readingDate.value,
          current_reading: user.current_reading,
          previous_reading: prevReading,
          consumption_kwh: consumption_kwh,
          billing_cycle: billingCycle.value
        });

        // Auto-generate bill if billing cycle is provided
        if (billingCycle.value && currentRate.value) {
          const total_amount = consumption_kwh * currentRate.value.rate_per_kwh;
          billService.create({
            user_id: user.id,
            consumption_record_id: record.id,
            billing_cycle: billingCycle.value,
            consumption_kwh: consumption_kwh,
            rate_per_kwh: currentRate.value.rate_per_kwh,
            total_amount: total_amount
          });
        }

        // Update previous reading for next time
        user.previous_reading = user.current_reading;
        user.current_reading = null;
        user.consumption_kwh = 0;
        user.total_amount = 0;
        
        successCount++;
      } catch (error) {
        console.error(`Error saving record for ${user.full_name}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      showMessage(`Successfully saved ${successCount} record(s)${errorCount > 0 ? `. ${errorCount} error(s).` : '.'}`, 'success');
      notificationService.notifySuccess(`Successfully saved ${successCount} record(s) and generated bills!`);
    } else {
      showMessage('Failed to save records. Please try again.', 'error');
      notificationService.notifyError('Failed to save records');
    }
  } catch (error) {
    showMessage('Error saving records: ' + error.message, 'error');
  } finally {
    saving.value = false;
  }
};

const clearAll = () => {
  if (confirm('Are you sure you want to clear all readings?')) {
    usersWithReadings.value.forEach(user => {
      user.current_reading = null;
      user.consumption_kwh = 0;
      user.total_amount = 0;
    });
    showMessage('All readings cleared', 'success');
  }
};

const showMessage = (msg, type = 'success') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

onMounted(async () => {
  await loadRates();
  await loadUsers();
});
</script>

