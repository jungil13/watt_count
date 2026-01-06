<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div class="flex items-center gap-4">
          <BackButton />
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Consumption Records</h1>
        </div>
        <button
          v-if="isMainUser"
          @click="showAddModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base w-full sm:w-auto"
        >
          ➕ Add Record
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading...</p>
      </div>

      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumption</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing Cycle</th>
              <th v-if="isMainUser" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              <th v-else class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">View</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="record in records" :key="record.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.full_name || record.username }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(record.reading_date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.previous_reading }} kWh</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.current_reading }} kWh</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ record.consumption_kwh }} kWh</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ record.billing_cycle || '-' }}</td>
              <td v-if="isMainUser" class="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  @click="editRecord(record)"
                  class="text-blue-600 hover:text-blue-800 mr-3"
                >
                  Edit
                </button>
                <button
                  @click="deleteRecord(record.id)"
                  class="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
              <td v-else class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                View Only
              </td>
            </tr>
            <tr v-if="records.length === 0">
              <td :colspan="isMainUser ? 7 : 6" class="px-6 py-4 text-center text-sm text-gray-500">
                No consumption records found
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden divide-y divide-gray-200">
          <div v-for="record in records" :key="record.id" class="p-4 space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-gray-900">{{ record.full_name || record.username }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(record.reading_date) }}</p>
              </div>
              <div v-if="isMainUser" class="flex gap-2">
                <button
                  @click="editRecord(record)"
                  class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                >
                  Edit
                </button>
                <button
                  @click="deleteRecord(record.id)"
                  class="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                >
                  Delete
                </button>
              </div>
              <div v-else class="text-xs text-gray-400">
                View Only
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p class="text-xs text-gray-500">Previous</p>
                <p class="font-medium">{{ record.previous_reading }} kWh</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Current</p>
                <p class="font-medium">{{ record.current_reading }} kWh</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Consumption</p>
                <p class="font-semibold text-blue-600">{{ record.consumption_kwh }} kWh</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Cycle</p>
                <p class="font-medium">{{ record.billing_cycle || '-' }}</p>
              </div>
            </div>
          </div>
          <div v-if="records.length === 0" class="p-4 text-center text-sm text-gray-500">
            No consumption records found
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || editingRecord" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg sm:text-xl font-bold mb-4">{{ editingRecord ? 'Edit' : 'Add' }} Consumption Record</h2>
        
        <form @submit.prevent="saveRecord" class="space-y-4">
          <div v-if="isMainUser">
            <label class="block text-sm font-medium text-gray-700 mb-2">User</label>
            <select v-model="formData.user_id" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Select user</option>
              <option :value="user.id">{{ user.full_name }} (You)</option>
              <option v-for="u in sharedUsers" :key="u.id" :value="u.id">{{ u.full_name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reading Date (This Month)</label>
            <input
              v-model="formData.reading_date"
              type="date"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Last Month Reading (kWh)</label>
            <input
              v-model.number="formData.previous_reading"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Previous month's reading"
            />
            <p class="text-xs text-gray-500 mt-1">Leave empty to auto-fill from last record</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">This Month Reading (kWh)</label>
            <input
              v-model.number="formData.current_reading"
              type="number"
              step="0.01"
              min="0"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Current month's reading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Billing Cycle</label>
            <input
              v-model="formData.billing_cycle"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., January 2024"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              v-model="formData.notes"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="3"
            ></textarea>
          </div>

          <div class="flex gap-3">
            <button
              type="submit"
              class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              type="button"
              @click="closeModal"
              class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '../store/auth.js';
import { consumptionService, userService } from '../services/localStorage.js';
import BackButton from '../components/BackButton.vue';
import notificationService from '../services/notifications.js';

const { user, isMainUser } = useAuth();

const loading = ref(true);
const records = ref([]);
const sharedUsers = ref([]);
const showAddModal = ref(false);
const editingRecord = ref(null);

const formData = ref({
  user_id: '',
  reading_date: new Date().toISOString().split('T')[0],
  previous_reading: '',
  current_reading: '',
  billing_cycle: '',
  notes: ''
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const loadRecords = async () => {
  try {
    loading.value = true;
    if (isMainUser.value) {
      records.value = consumptionService.getAll(user.value.id);
      sharedUsers.value = userService.getAllSharedUsers(user.value.id);
    } else {
      records.value = consumptionService.getMy(user.value.id);
    }
  } catch (error) {
    console.error('Error loading records:', error);
  } finally {
    loading.value = false;
  }
};

const saveRecord = async () => {
  try {
    // If previous_reading is not provided, get it from the latest record
    if (!formData.value.previous_reading && !editingRecord.value) {
      const latest = consumptionService.getLatestByUserId(formData.value.user_id || user.value.id);
      if (latest) {
        formData.value.previous_reading = latest.current_reading || 0;
      } else {
        formData.value.previous_reading = 0;
      }
    }

    if (editingRecord.value) {
      consumptionService.update(editingRecord.value.id, formData.value);
    } else {
      const consumption_kwh = formData.value.current_reading - (formData.value.previous_reading || 0);
      consumptionService.create({
        ...formData.value,
        consumption_kwh
      });
    }
    closeModal();
    loadRecords();
    notificationService.notifySuccess('Consumption record saved successfully');
  } catch (error) {
    alert(error.message || 'Error saving record');
    notificationService.notifyError(error.message || 'Error saving record');
  }
};

const editRecord = (record) => {
  editingRecord.value = record;
  formData.value = {
    user_id: record.user_id,
    reading_date: record.reading_date,
    previous_reading: record.previous_reading || 0,
    current_reading: record.current_reading,
    billing_cycle: record.billing_cycle || '',
    notes: record.notes || ''
  };
};

const deleteRecord = async (id) => {
  if (!confirm('Are you sure you want to delete this record?')) return;
  
  try {
    consumptionService.delete(id);
    loadRecords();
    notificationService.notifySuccess('Record deleted successfully');
  } catch (error) {
    alert(error.message || 'Error deleting record');
    notificationService.notifyError(error.message || 'Error deleting record');
  }
};

const closeModal = () => {
  showAddModal.value = false;
  editingRecord.value = null;
  formData.value = {
    user_id: '',
    reading_date: new Date().toISOString().split('T')[0],
    previous_reading: '',
    current_reading: '',
    billing_cycle: '',
    notes: ''
  };
};

onMounted(() => {
  loadRecords();
});
</script>



