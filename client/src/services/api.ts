import axios, { type AxiosRequestHeaders } from 'axios';

const API_URL = 'https://onlineexam-1-zhkf.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const cache = new Map<string, { data: any; expires: number }>();

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

export const getCached = async (url: string, ttl = 120000, config = {}) => {
  const now = Date.now();
  const cached = cache.get(url);

  if (cached && cached.expires > now) {
    return cached.data;
  }

  const response = await api.get(url, config);
  const data = response.data;
  cache.set(url, { data, expires: now + ttl });
  return data;
};

export const batchGet = async (urls: string[]) => {
  const responses = await Promise.all(urls.map((url) => api.get(url)));
  return responses.map((res) => res.data);
};

export default api;
