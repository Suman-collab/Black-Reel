import axios from 'axios';
import { clearStoredAuth } from './storage';

let unauthorizedHandler = null;
let deviceLimitHandler  = null;
const TOKEN_STORAGE_KEYS = ['token', 'authToken', 'accessToken'];

export const isSuspensionMessage = (message = '') =>
  /suspend|banned|restricted|inactive|disabled|contact support/i.test(String(message || ''));

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const registerDeviceLimitHandler = (handler) => {
  deviceLimitHandler = handler;
};

const normalizeError = (error) => {
  const statusCode = error.response?.status;
  const resData    = error.response?.data || {};
  const errorCode  = resData.errorCode;
  const extraData  = resData.data;

  const message =
    resData.message ||
    error.message ||
    'Something went wrong while calling the API.';

  const normalizedError      = new Error(message);
  normalizedError.statusCode = statusCode;
  if (errorCode) normalizedError.errorCode = errorCode;
  if (extraData) normalizedError.data      = extraData;
  return normalizedError;
};


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = TOKEN_STORAGE_KEYS
    .map((key) => localStorage.getItem(key))
    .find(Boolean);

  console.log(`[API Request Interceptor] Outbound request: ${config.method?.toUpperCase()} ${config.url}`);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API Request Interceptor] Attached Authorization: Bearer <token>');
  } else {
    console.log('[API Request Interceptor] No token found in storage. Request sent without Authorization header.');
  }

  if (config.data) {
    console.log('[API Request Interceptor] Payload:', config.data);
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response Interceptor] Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log(`[API Response Interceptor] Status: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    const resData   = error.response?.data || {};
    const message   = resData.message || error.message || '';
    const errorCode = resData.errorCode;

    console.group(`[API Response Interceptor] Error: ${error.config?.method?.toUpperCase()} ${error.config?.url || 'Unknown'}`);
    console.error(`Status Code: ${error.response?.status || 'Network Error / Unknown'}`);
    console.error(`Message: ${message}`);
    if (errorCode) console.error(`Error Code: ${errorCode}`);
    if (resData.data) console.error(`Response Data:`, resData.data);
    console.groupEnd();

    if (errorCode === 'DEVICE_LIMIT_EXCEEDED') {
      deviceLimitHandler?.({ message, data: resData.data });
      return Promise.reject(normalizeError(error));
    }

    const shouldClearSession =
      error.response?.status === 401 ||
      (error.response?.status === 403 && isSuspensionMessage(message));

    if (shouldClearSession) {
      console.warn(`[API Response Interceptor] Unauthorized or suspended session (Status: ${error.response?.status}). Clearing tokens.`);
      TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      clearStoredAuth();
      unauthorizedHandler?.(error);

      if (error.response?.status === 401 && window.location.pathname !== '/login') {
        console.warn('[API Response Interceptor] Redirecting to /login');
        window.location.href = '/login';
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export default api;
