import axios from 'axios';
import Cookies from 'js-cookie';

// Use the environment variable for API URL - changed to use port 5001
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from cookies for every request
    const token = Cookies.get('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      // Make sure config.headers exists
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors globally
    if (error.response && error.response.status === 401) {
      // Clear auth token
      Cookies.remove('token', { path: '/' });
      
      // Redirect to login if not already on login or register page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        console.log('Authentication error. Redirecting to login page...');
        
        // Add a small delay to allow for current operations to complete
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints

// Category endpoints
export const categoryApi = {
  getAll: () => api.get('/categories'),
  get: (id: number) => api.get(`/categories/${id}`),
  create: (data: { name: string }) => api.post('/categories', data),
  update: (id: number, data: { name: string }) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`)
};

// Medication endpoints
export const medicationApi = {
  getAll: () => api.get('/medications'),
  get: (id: number) => api.get(`/medications/${id}`),
  create: (data: {
    name: string;
    dose: string;
    frequency: number;
    times: string[];
    startDate: string;
    endDate?: string;
    categoryId?: number;
  }) => api.post('/medications', data),
  update: (id: number, data: {
    name: string;
    dose: string;
    frequency: number;
    times: string[];
    startDate: string;
    endDate?: string;
    categoryId?: number;
  }) => api.put(`/medications/${id}`, data),
  delete: (id: number) => api.delete(`/medications/${id}`)
};

// Dose log endpoints
export const doseLogApi = {
  getAll: (params?: { startDate?: string, endDate?: string }) => 
    api.get('/dose-logs', { params }),
  getTodaySchedule: () => api.get('/dose-logs/schedule'),
  getWeeklySchedule: (params?: { startDate?: string, endDate?: string }) =>
    api.get('/dose-logs/weekly-schedule', { params }),
  logDose: (data: {
    medicationId: number;
    scheduledTime: string;
    status?: 'taken' | 'missed' | 'skipped';
  }) => api.post('/dose-logs', data),
  getStats: (params?: { startDate?: string, endDate?: string }) => 
    api.get('/dose-logs/stats', { params }),
  generatePdfReport: (params?: { startDate?: string, endDate?: string }) => 
    api.get('/dose-logs/export/pdf', { 
      params,
      responseType: 'blob'
    }),
  generateCsvExport: (params?: { startDate?: string, endDate?: string }) => 
    api.get('/dose-logs/export/csv', { 
      params,
      responseType: 'blob'
    })
};

// Google Calendar endpoints
export const googleApi = {
  getAuthUrl: () => api.get('/google/auth-url'),
  syncCalendar: () => api.post('/google/sync-calendar')
};

export default api;
