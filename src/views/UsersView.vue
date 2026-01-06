<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <BackButton />
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Manage Users</h1>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <!-- Shared Codes Section -->
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 class="text-base sm:text-lg font-semibold">Shared Codes</h2>
          <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              @click="generateCode"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              ➕ Generate New Code
            </button>
            <button
              @click="exportCodes"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              📥 Export Codes
            </button>
            <button
              @click="importCodes"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
            >
              📤 Import Codes
            </button>
          </div>
        </div>
        
        <div v-if="sharedCodes.length > 0" class="space-y-2">
          <div v-for="code in sharedCodes" :key="code.id" class="flex items-center justify-between p-3 border rounded-lg">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="font-mono font-bold text-lg">{{ code.code }}</p>
                <button
                  @click="copyCode(code.code)"
                  class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                  title="Copy code"
                >
                  📋 Copy
                </button>
              </div>
              <p class="text-sm text-gray-500">
                {{ code.is_used ? `Used by: ${code.used_by_full_name || code.used_by_username}` : 'Active - Ready to use' }}
                <span v-if="code.expires_at"> • Expires: {{ formatDate(code.expires_at) }}</span>
              </p>
            </div>
            <button
              v-if="!code.is_used"
              @click="deleteCode(code.code)"
              class="text-red-600 hover:text-red-800 text-sm ml-2"
            >
              Delete
            </button>
          </div>
        </div>
        <p v-else class="text-gray-500">No shared codes generated yet</p>
      </div>

      <!-- Shared Users List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 class="text-base sm:text-lg font-semibold">Shared Users</h2>
        </div>
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in sharedUsers" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.full_name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.username }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.phone_number }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ user.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(user.created_at) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    v-if="user.is_active"
                    @click="deactivateUser(user.id)"
                    class="text-red-600 hover:text-red-800"
                  >
                    Deactivate
                  </button>
                  <button
                    v-else
                    @click="activateUser(user.id)"
                    class="text-green-600 hover:text-green-800"
                  >
                    Activate
                  </button>
                </td>
              </tr>
              <tr v-if="sharedUsers.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No shared users yet</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile Card View -->
        <div class="md:hidden divide-y divide-gray-200">
          <div v-for="user in sharedUsers" :key="user.id" class="p-4 space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-gray-900">{{ user.full_name }}</p>
                <p class="text-xs text-gray-500">@{{ user.username }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ user.phone_number }}</p>
              </div>
              <span
                :class="user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="text-xs text-gray-500">
              Joined: {{ formatDate(user.created_at) }}
            </div>
            <div class="pt-2">
              <button
                v-if="user.is_active"
                @click="deactivateUser(user.id)"
                class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Deactivate
              </button>
              <button
                v-else
                @click="activateUser(user.id)"
                class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Activate
              </button>
            </div>
          </div>
          <div v-if="sharedUsers.length === 0" class="p-4 text-center text-sm text-gray-500">
            No shared users yet
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authService, userService, dataService } from '../services/localStorage.js';
import { useAuth } from '../store/auth.js';
import BackButton from '../components/BackButton.vue';
import notificationService from '../services/notifications.js';

const { user } = useAuth();
const sharedCodes = ref([]);
const sharedUsers = ref([]);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const loadData = async () => {
  try {
    sharedCodes.value = authService.getSharedCodes(user.value.id);
    sharedUsers.value = userService.getAllSharedUsers(user.value.id);
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

const generateCode = async () => {
  try {
    const response = authService.generateSharedCode(user.value.id);
    const codeToCopy = response.code;
    
    // Copy to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(codeToCopy);
      alert(`New shared code generated and copied to clipboard: ${codeToCopy}`);
    } else {
      alert(`New shared code generated: ${codeToCopy}\n\nPlease copy this code manually.`);
    }
    
    loadData();
  } catch (error) {
    alert(error.message || 'Error generating code');
  }
};

const copyCode = async (code) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(code);
      alert(`Code ${code} copied to clipboard!`);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`Code ${code} copied to clipboard!`);
    }
  } catch (error) {
    alert('Failed to copy code. Please copy manually: ' + code);
  }
};

const deleteCode = async (code) => {
  if (!confirm('Are you sure you want to delete this code?')) return;
  try {
    authService.deleteSharedCode(code);
    loadData();
  } catch (error) {
    alert(error.message || 'Error deleting code');
  }
};

const deactivateUser = async (id) => {
  if (!confirm('Are you sure you want to deactivate this user?')) return;
  try {
    userService.update(id, { is_active: false });
    loadData();
  } catch (error) {
    alert(error.message || 'Error deactivating user');
  }
};

const activateUser = async (id) => {
  try {
    userService.update(id, { is_active: true });
    loadData();
  } catch (error) {
    alert(error.message || 'Error activating user');
  }
};

const exportCodes = () => {
  try {
    const jsonData = dataService.exportCodes();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wattcount-codes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Codes exported successfully! You can now import this file in another browser.');
  } catch (error) {
    alert('Error exporting codes: ' + error.message);
  }
};

const importCodes = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const merge = confirm('Do you want to merge with existing codes? (Yes = merge, No = replace)');
      dataService.importCodes(text, merge);
      alert('Codes imported successfully!');
      loadData();
    } catch (error) {
      alert('Error importing codes: ' + error.message);
    }
  };
  input.click();
};

onMounted(() => {
  loadData();
});
</script>

