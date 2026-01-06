<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">WattCount</h1>
        <p class="text-gray-600">Quick Login (Development Mode)</p>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ error }}
      </div>

      <div v-if="loading" class="mb-4 text-center">
        <p class="text-gray-600">Loading test users...</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="user in testUsers" :key="user.username" class="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer" @click="quickLogin(user.username)">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold text-gray-900">{{ user.full_name }}</p>
              <p class="text-sm text-gray-500">@{{ user.username }} • {{ user.phone_number }} • {{ user.role === 'main_user' ? 'Main User' : 'Shared User' }}</p>
            </div>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
              Login
            </button>
          </div>
        </div>

        <div class="pt-4 border-t">
          <router-link to="/login" class="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
            Use regular login instead
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth.js';
import { userService } from '../services/localStorage.js';

const router = useRouter();
const { autoLogin } = useAuth();

const loading = ref(true);
const testUsers = ref([]);
const error = ref('');

const loadTestUsers = async () => {
  try {
    // Get all users for dev login
    const allUsers = userService.getAll();
    testUsers.value = allUsers;
    if (allUsers.length === 0) {
      error.value = 'No users found. Please register first.';
    }
  } catch (err) {
    error.value = 'Development mode not available. Use regular login.';
    console.error('Error loading test users:', err);
  } finally {
    loading.value = false;
  }
};

const quickLogin = async (username) => {
  try {
    error.value = '';
    await autoLogin(username);
    router.push('/dashboard');
  } catch (err) {
    error.value = err.message || 'Auto-login failed';
  }
};

onMounted(() => {
  loadTestUsers();
});
</script>

