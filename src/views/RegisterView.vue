  <template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <img src="/wattcount_logo.png" alt="WattCount Logo" class="w-30 h-30" />
          </div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Register</h1>
          <p class="text-gray-600">Create a Main User account</p>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ error }}
        </div>

        <div v-if="success" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {{ success }}
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
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
            {{ loading ? 'Registering...' : 'Register' }}
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
  const { register } = useAuth();

  const formData = ref({
    full_name: '',
    username: '',
    phone_number: '',
    password: '',
    role: 'main_user'
  });

  const loading = ref(false);
  const error = ref('');
  const success = ref('');

  const handleRegister = async () => {
    error.value = '';
    success.value = '';
    loading.value = true;

    try {
      const response = await register(formData.value);
      success.value = `Registration successful! Your shared code is: ${response.user.shared_code}`;
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      error.value = err.message || 'Registration failed. Please try again.';
    } finally {
      loading.value = false;
    }
  };
  </script>

