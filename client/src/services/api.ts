import axios from 'axios';

const API_URL = 'https://onlineexam-1-zhkf.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage');
  if (token) {
    const parsed = JSON.parse(token);
    if (parsed.state.token) {
      config.headers.Authorization = `Bearer ${parsed.state.token}`;
    }
  }
  return config;
});

export default api;
