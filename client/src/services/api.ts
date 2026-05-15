import axios, { type AxiosRequestHeaders } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

if (import.meta.env.PROD) {
  console.log('🌐 App running in PRODUCTION mode');
  console.log('📡 API Base URL:', API_URL);
  if (API_URL.includes('localhost')) {
    console.warn('⚠️ WARNING: API_URL is still pointing to localhost in production! Please set VITE_API_URL in your deployment platform.');
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

const cache = new Map<string, { data: unknown; expires: number }>();
let warmUpPromise: Promise<void> | null = null;

const getAuthToken = async () => {
  try {
    const { useAuthStore } = await import('../store/authStore');
    return useAuthStore.getState().token;
  } catch {
    // Fallback to localStorage if store import fails or isn't ready
    const token = localStorage.getItem('auth-storage');
    if (!token) return null;
    const parsed = JSON.parse(token);
    return parsed.state?.token ?? null;
  }
};

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers = {
      ...(config.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Auto-retry for login or initial requests if they fail due to network/cold-start
    if (!error.response && !originalRequest._retry && originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;
      console.warn('Login failed (Network), retrying once...');
      return api(originalRequest);
    }

    if (error.response && error.response.status === 401 && !originalRequest.url.includes('/auth/login')) {
      // If we get a 401, the token is likely expired or invalid
      // Only logout if it's NOT a login attempt
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getCached = async (url: string, ttl = 30000, config = {}) => {
  const now = Date.now();
  const token = await getAuthToken();
  const cacheKey = token ? `${url}_${String(token).slice(-10)}` : url;
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > now) {
    return cached.data;
  }

  const response = await api.get(url, config);
  const data = response.data;
  cache.set(cacheKey, { data, expires: now + ttl });
  return data;
};

export const clearApiCache = () => cache.clear();

export const warmUpApi = () => {
  if (!warmUpPromise) {
    warmUpPromise = api.get('/health', { timeout: 15000 })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        warmUpPromise = null;
      });
  }

  return warmUpPromise;
};

export const batchGet = async (urls: string[]) => {
  const responses = await Promise.all(urls.map((url) => api.get(url)));
  return responses.map((res) => res.data);
};

export default api;
