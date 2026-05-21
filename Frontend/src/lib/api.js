import axios from 'axios';
import { clearStoredAuth } from './storage';

let unauthorizedHandler = null;

export const isSuspensionMessage = (message = '') =>
  /suspend|banned|restricted|inactive|disabled|contact support/i.test(String(message || ''));

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const normalizeError = (error) => {
  const statusCode = error.response?.status;

  if (error.response?.data?.message) {
    const normalizedError = new Error(error.response.data.message);
    normalizedError.statusCode = statusCode;
    return normalizedError;
  }

  if (error.message) {
    const normalizedError = new Error(error.message);
    normalizedError.statusCode = statusCode;
    return normalizedError;
  }

  const normalizedError = new Error('Something went wrong while calling the API.');
  normalizedError.statusCode = statusCode;
  return normalizedError;
};

// Fixed: all requests now rely on secure HttpOnly cookies via credentials include.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '';
    const shouldClearSession =
      error.response?.status === 401 ||
      (error.response?.status === 403 && isSuspensionMessage(message));

    if (shouldClearSession) {
      clearStoredAuth();
      unauthorizedHandler?.(error);
    }

    return Promise.reject(normalizeError(error));
  }
);

export default api;
