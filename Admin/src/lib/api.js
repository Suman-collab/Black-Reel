import axios from 'axios';
import { clearStoredAdminAuth } from './storage';

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
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAdminAuth();
      unauthorizedHandler?.(error);
    }

    return Promise.reject(normalizeError(error));
  }
);

// Get paginated users with filters
export const getUsers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/admin/users?${query}`);
  return res.data;
};

// Get single user full profile
export const getUserById = async (id) => {
  const res = await api.get(`/admin/users/${id}`);
  return res.data;
};

// Get dashboard stats
export const getUserStats = async () => {
  const res = await api.get('/admin/users/stats');
  return res.data;
};

// Update user status
export const updateUserStatus = async (id, status) => {
  const res = await api.patch(`/admin/users/${id}/status`, { status });
  return res.data;
};

// Update user role
export const updateUserRole = async (id, role) => {
  const res = await api.patch(`/admin/users/${id}/role`, { role });
  return res.data;
};

// Delete user
export const deleteUser = async (id) => {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
};

// Force remove device
export const adminRemoveDevice = async (userId, deviceId) => {
  const res = await api.delete(
    `/admin/users/${userId}/devices/${deviceId}`
  );
  return res.data;
};

export default api;
