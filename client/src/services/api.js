import { notifyDataChanged } from './liveData.js';
import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept request to attach auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('re_token') || localStorage.getItem('rit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for central error handling
api.interceptors.response.use(
  (response) => {
    if (!['get', 'head'].includes(response.config.method) && response.data?.success && !response.config.url?.startsWith('/auth/')) notifyDataChanged();
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    apiError.errors = error.response?.data?.errors;
    return Promise.reject(apiError);
  }
);

// Coalesce identical reads, but never retain private responses between requests.
const pendingReads = new Map();
const get = api.get.bind(api);
api.get = (url, config = {}) => {
  if (config.signal) return get(url, config);
  const key = `${localStorage.getItem('re_token') || localStorage.getItem('rit_token') || ''}:${url}:${JSON.stringify(config.params || {})}`;
  if (pendingReads.has(key)) return pendingReads.get(key);
  const task = get(url, config).finally(() => pendingReads.delete(key));
  pendingReads.set(key, task);
  return task;
};
export default api;
