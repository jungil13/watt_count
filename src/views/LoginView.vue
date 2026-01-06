<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <img src="/wattcount_logo.png" alt="WattCount Logo" class="w-30 h-30" />
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">WattCount</h1>
        <p class="text-gray-600">Electricity Billing & Consumption Management</p>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input
            v-model="username"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div class="mt-6 text-center space-y-2">
        <p class="text-sm text-gray-600">Don't have an account?</p>
        <div class="flex gap-4 justify-center">
          <router-link to="/register" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Register as Main User
          </router-link>
          <span class="text-gray-400">|</span>
          <router-link to="/connect" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Connect with Shared Code
          </router-link>
        </div>
        <div class="mt-4 pt-4 border-t">
          <router-link to="/dev-login" class="text-xs text-gray-500 hover:text-gray-700">
            🚀 Quick Login (Dev Mode)
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth.js';

const router = useRouter();
const { login } = useAuth();

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    await login(username.value, password.value);
    router.push('/dashboard');
  } catch (err) {
    error.value = err.message || 'Login failed. Please check your credentials.';
  } finally {
    loading.value = false;
  }
};
</script>

