<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Connect</h1>
        <p class="text-gray-600">Join using a shared code from Main User</p>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ error }}
      </div>

      <form @submit.prevent="handleConnect" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Shared Code</label>
          <input
            v-model="formData.shared_code"
            type="text"
            required
            maxlength="8"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono text-lg tracking-wider"
            placeholder="Enter 8-character code"
            @input="formData.shared_code = formData.shared_code.toUpperCase().replace(/[^A-Z0-9]/g, '')"
            @paste="handlePaste"
          />
          <p class="mt-1 text-xs text-gray-500">Get this code from the Main User</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            v-model="formData.full_name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input
            v-model="formData.username"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Choose a username"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            v-model="formData.phone_number"
            type="tel"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., +639123456789"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            v-model="formData.password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Create a password (min. 6 characters)"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {{ loading ? 'Connecting...' : 'Connect' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="text-blue-600 hover:text-blue-800 font-medium">
            Login
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth.js';

const router = useRouter();
const { connectWithCode } = useAuth();

const formData = ref({
  shared_code: '',
  full_name: '',
  username: '',
  phone_number: '',
  password: ''
});

const loading = ref(false);
const error = ref('');

const handlePaste = (event) => {
  // Normalize pasted text
  const pastedText = (event.clipboardData || window.clipboardData).getData('text');
  formData.value.shared_code = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
  event.preventDefault();
};

const handleConnect = async () => {
  error.value = '';
  loading.value = true;

  try {
    // Normalize the code before sending
    const normalizedData = {
      ...formData.value,
      shared_code: formData.value.shared_code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '')
    };
    
    await connectWithCode(normalizedData);
    router.push('/dashboard');
  } catch (err) {
    error.value = err.message || 'Connection failed. Please check your shared code.';
    console.error('Connection error:', err);
  } finally {
    loading.value = false;
  }
};
</script>

