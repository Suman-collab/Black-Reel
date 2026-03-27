import axios from 'axios';
import { clearStoredAuth, getStoredAuth } from './storage';

let unauthorizedHandler = null;

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const normalizeError = (error) => {
  if (error.response?.data?.message) {
    return new Error(error.response.data.message);
  }

  if (error.message) {
    return new Error(error.message);
  }

  return new Error('Something went wrong while calling the API.');
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const session = getStoredAuth();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      unauthorizedHandler?.(error);
    }

    return Promise.reject(normalizeError(error));
  }
);

export default api;
