import axios, { type AxiosRequestHeaders } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const cache = new Map<string, { data: unknown; expires: number }>();

const getAuthToken = () => {
  const token = localStorage.getItem('auth-storage');
  if (!token) return null;

  try {
    const parsed = JSON.parse(token);
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getAuthToken();
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
  (error) => {
    return Promise.reject(error);
  }
);

export const getCached = async (url: string, ttl = 30000, config = {}) => {
  const now = Date.now();
  const token = getAuthToken();
  const cacheKey = token ? `${url}_${token.slice(-10)}` : url;
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

export const batchGet = async (urls: string[]) => {
  const responses = await Promise.all(urls.map((url) => api.get(url)));
  return responses.map((res) => res.data);
};

export default api;
