import axios from 'axios';
import { clearStoredAuth } from './storage';

let unauthorizedHandler = null;
let deviceLimitHandler  = null;

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const resData   = error.response?.data || {};
    const message   = resData.message || error.message || '';
    const errorCode = resData.errorCode;

    
    if (errorCode === 'DEVICE_LIMIT_EXCEEDED') {
      deviceLimitHandler?.({ message, data: resData.data });
      return Promise.reject(normalizeError(error));
    }

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
