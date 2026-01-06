import { ref, computed } from 'vue';
import { authService, userService, initializeStorage } from '../services/localStorage.js';

// Initialize storage on module load
initializeStorage();

const user = ref(null);
const token = ref(localStorage.getItem('token') || null);

// Load user from token on init
if (token.value) {
  try {
    const tokenData = JSON.parse(token.value);
    const userId = tokenData.userId;
    if (userId) {
      const profile = authService.getProfile(userId);
      user.value = profile;
    }
  } catch (error) {
    // Try old format for backward compatibility
    try {
      const userId = token.value.split('_')[1];
      if (userId) {
        const profile = authService.getProfile(userId);
        user.value = profile;
      }
    } catch (e) {
      localStorage.removeItem('token');
      token.value = null;
    }
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isMainUser = computed(() => user.value?.role === 'main_user');
  const isSharedUser = computed(() => user.value?.role === 'shared_user');

  const login = async (username, password) => {
    try {
      const response = authService.login(username, password);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  const connectWithCode = async (data) => {
    try {
      const response = await authService.connectWithCode(data);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  };

  const autoLogin = async (username) => {
    try {
      // For dev mode, find user and login
      const foundUser = userService.findByUsername(username);
      if (!foundUser) {
        throw new Error('User not found');
      }
      const response = authService.login(username, foundUser.password);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const loadProfile = async () => {
    try {
      if (!token.value) return;
      let userId;
      try {
        const tokenData = JSON.parse(token.value);
        userId = tokenData.userId;
      } catch (e) {
        // Try old format
        userId = token.value.split('_')[1];
      }
      if (!userId) {
        logout();
        return;
      }
      const profile = authService.getProfile(userId);
      user.value = profile;
      return profile;
    } catch (error) {
      logout();
      throw error;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isMainUser,
    isSharedUser,
    login,
    register,
    connectWithCode,
    autoLogin,
    logout,
    loadProfile,
  };
}

