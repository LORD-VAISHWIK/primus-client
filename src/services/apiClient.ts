import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config/api';

// Create axios instance with a placeholder baseURL
// The actual URL is set dynamically in the request interceptor
export const apiClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // IMPORTANT: Set baseURL dynamically on each request
    // This ensures the URL selected in the backend switcher is used
    const baseUrl = getApiUrl();
    config.baseURL = baseUrl + '/api';

    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const { useAuthStore } = await import('../stores/authStore');
        const refreshSuccess = await useAuthStore.getState().refreshToken();

        if (refreshSuccess) {
          // Retry the original request
          return apiClient(originalRequest);
        } else {
          // Refresh failed, logout user
          await useAuthStore.getState().logout();
          window.location.reload();
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        const { useAuthStore } = await import('../stores/authStore');
        await useAuthStore.getState().logout();
        window.location.reload();
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      toast.error('Network error. Please check your connection.');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data);
      toast.error('Server error. Please try again later.');
    }

    // Handle client errors (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const message = error.response.data?.detail || error.response.data?.message || 'Request failed';
      console.error('Client error:', error.response.status, message);

      // Don't show toast for 401 errors (handled above)
      if (error.response.status !== 401) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Authentication
  auth: {
    login: (email: string, password: string) => {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      return apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    },
    register: (userData: any) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    me: () => apiClient.get('/auth/me'),
    refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  },

  // PC Management
  pc: {
    register: (pcData: any) => apiClient.post('/clientpc/register', pcData),
    status: (pcId: number) => apiClient.get(`/clientpc/${pcId}/status`),
    updateStatus: (pcId: number, status: string) => apiClient.patch(`/clientpc/${pcId}/status`, { status }),
    list: () => apiClient.get('/clientpc'),
  },

  // Session Management
  session: {
    start: (sessionData: any) => apiClient.post('/session/start', sessionData),
    // Backend endpoint: POST /api/session/stop/{session_id}
    end: (sessionId: number) => apiClient.post(`/session/stop/${sessionId}`),
    current: () => apiClient.get('/session/current'),
    history: (userId?: number) =>
      apiClient.get('/session/history', { params: { user_id: userId } }),
  },

  // Wallet Management
  wallet: {
    balance: (userId: number) => apiClient.get(`/wallet/balance/${userId}`),
    topup: (userId: number, amount: number) => apiClient.post('/wallet/topup', { user_id: userId, amount }),
    transactions: (userId: number) => apiClient.get(`/wallet/transactions/${userId}`),
  },

  // Games
  games: {
    list: () => apiClient.get('/games'),
    popular: () => apiClient.get('/games/popular'),
    search: (query: string) => apiClient.get('/games/search', { params: { q: query } }),
  },

  // Bookings
  bookings: {
    create: (bookingData: any) => apiClient.post('/booking', bookingData),
    list: (userId?: number) => apiClient.get('/booking', { params: { user_id: userId } }),
    cancel: (bookingId: number) => apiClient.delete(`/booking/${bookingId}`),
  },

  // Support
  support: {
    createTicket: (ticketData: any) => apiClient.post('/support', ticketData),
    listTickets: (userId?: number) => apiClient.get('/support', { params: { user_id: userId } }),
    updateTicket: (ticketId: number, updates: any) => apiClient.patch(`/support/${ticketId}`, updates),
  },

  // Notifications
  notifications: {
    list: (userId?: number) => apiClient.get('/notification', { params: { user_id: userId } }),
    markRead: (notificationId: number) => apiClient.patch(`/notification/${notificationId}/read`),
  },

  // Admin APIs
  admin: {
    users: {
      list: () => apiClient.get('/user'),
      create: (userData: any) => apiClient.post('/user', userData),
      update: (userId: number, userData: any) => apiClient.patch(`/user/${userId}`, userData),
      delete: (userId: number) => apiClient.delete(`/user/${userId}`),
    },
    pcs: {
      list: () => apiClient.get('/pc'),
      create: (pcData: any) => apiClient.post('/pc', pcData),
      update: (pcId: number, pcData: any) => apiClient.patch(`/pc/${pcId}`, pcData),
      delete: (pcId: number) => apiClient.delete(`/pc/${pcId}`),
      command: (pcId: number, command: string, params?: any) =>
        apiClient.post('/command', { pc_id: pcId, command, params }),
    },
    stats: {
      dashboard: () => apiClient.get('/stats/dashboard'),
      revenue: (startDate?: string, endDate?: string) =>
        apiClient.get('/stats/revenue', { params: { start_date: startDate, end_date: endDate } }),
      usage: () => apiClient.get('/stats/usage'),
    },
    settings: {
      get: () => apiClient.get('/settings'),
      update: (settings: any) => apiClient.post('/settings', settings),
    },
  },

  // System
  system: {
    health: () => apiClient.get('/health'),
    version: () => apiClient.get('/version'),
  },
};

export default apiService;
