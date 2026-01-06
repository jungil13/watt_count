const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to get headers
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Generic fetch wrapper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(options.includeAuth !== false),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
    includeAuth: false,
  }),
  
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    includeAuth: false,
  }),
  
  connectWithCode: (data) => apiRequest('/auth/connect', {
    method: 'POST',
    body: JSON.stringify(data),
    includeAuth: false,
  }),
  
  generateSharedCode: () => apiRequest('/auth/generate-code', {
    method: 'POST',
  }),
  
  getSharedCodes: () => apiRequest('/auth/shared-codes'),
  deleteSharedCode: (code) => apiRequest(`/auth/shared-codes/${code}`, {
    method: 'DELETE',
  }),
  
  getProfile: () => apiRequest('/auth/profile'),
};

// User API
export const userAPI = {
  getAllSharedUsers: () => apiRequest('/users/shared'),
  getUserById: (id) => apiRequest(`/users/${id}`),
  updateUser: (id, data) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deactivateUser: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Consumption API
export const consumptionAPI = {
  create: (data) => apiRequest('/consumption', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMy: (limit, userId = null) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (userId) params.append('user_id', userId);
    return apiRequest(`/consumption/my${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getAll: () => apiRequest('/consumption/all'),
  getById: (id) => apiRequest(`/consumption/${id}`),
  update: (id, data) => apiRequest(`/consumption/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/consumption/${id}`, {
    method: 'DELETE',
  }),
  getSummary: (userId, startDate, endDate) => 
    apiRequest(`/consumption/summary?user_id=${userId}&startDate=${startDate}&endDate=${endDate}`),
};

// Bill API
export const billAPI = {
  create: (data) => apiRequest('/bills', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMy: (limit) => apiRequest(`/bills/my${limit ? `?limit=${limit}` : ''}`),
  getAll: () => apiRequest('/bills/all'),
  getById: (id) => apiRequest(`/bills/${id}`),
  update: (id, data) => apiRequest(`/bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/bills/${id}`, {
    method: 'DELETE',
  }),
  getByCycle: (cycle) => apiRequest(`/bills/cycle?billing_cycle=${cycle}`),
};

// Payment API
export const paymentAPI = {
  create: (data) => apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMy: () => apiRequest('/payments/my'),
  getByBill: (billId) => apiRequest(`/payments/bill/${billId}`),
  getById: (id) => apiRequest(`/payments/${id}`),
};

// Rate API
export const rateAPI = {
  set: (data) => apiRequest('/rates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCurrent: () => apiRequest('/rates/current'),
  getAll: () => apiRequest('/rates/all'),
};

// Dev API (Development only)
export const devAPI = {
  autoLogin: (username) => apiRequest('/dev/auto-login', {
    method: 'POST',
    body: JSON.stringify({ username }),
    includeAuth: false,
  }),
  getTestUsers: () => apiRequest('/dev/test-users', {
    includeAuth: false,
  }),
};

