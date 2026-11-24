import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Do not intercept 401 for login or register endpoints
      if (error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/verify-otp')) {
        return Promise.reject(error);
      }

      // Try refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('token', res.data.token);
          error.config.headers.Authorization = `Bearer ${res.data.token}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        // Only redirect if not already on the login page to avoid infinite loops or wiping state
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
