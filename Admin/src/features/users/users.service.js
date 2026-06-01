import api from '../../lib/api';

export const getUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/users/${userId}/role`, { role });
  return response.data.data.user;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.patch(`/admin/users/${userId}/status`, { status });
  return response.data.data.user;
};


export const getUserDevices = async (userId) => {
  const response = await api.get(`/admin/users/${userId}/devices`);
  return response.data.data;
};

export const removeUserDevice = async (userId, deviceId) => {
  const response = await api.delete(`/admin/users/${userId}/devices/${deviceId}`);
  return response.data;
};

export const signOutAllUserDevices = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}/devices`);
  return response.data;
};
