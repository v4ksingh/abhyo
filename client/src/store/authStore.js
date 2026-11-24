import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', credentials);
      const { token, refreshToken, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      set({ token, user, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  adminLogin: async (credentials) => {
    set({ isLoading: true });
    try {
      let res;
      try {
        res = await api.post('/auth/admin-login', credentials);
      } catch (adminErr) {
        if (adminErr.response?.status === 404) {
          res = await api.post('/auth/login', credentials);
        } else {
          throw adminErr;
        }
      }
      const { token, refreshToken, user, clearanceLevel, auditLogId } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      set({ token, user, isAuthenticated: true, isLoading: false });
      return { success: true, user, clearanceLevel, auditLogId };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data, autoLogin = false) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', data);
      
      if (res.data.pendingApproval) {
        set({ isLoading: false });
        return {
          success: true,
          pendingApproval: true,
          user: res.data.user || { name: data.name, email: data.email, role: 'institute', instituteName: data.instituteName },
          message: res.data.message,
        };
      }

      const { token, refreshToken, user, trialInfo } = res.data;
      if (autoLogin) {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        // Clear any previous token so user can land on login page after welcome
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
      return {
        success: true,
        user: user || { name: data.name, email: data.email, role: data.role || 'student' },
        trialInfo,
        token,
        refreshToken,
      };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  verifyOTP: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/verify-otp', data);
      const { token, refreshToken, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      set({ token, user, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true });
      return res.data.user;
    } catch {
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
  },
}));

export default useAuthStore;
