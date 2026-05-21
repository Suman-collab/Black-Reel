import api from '../../lib/api';

export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/users/${userId}/role`, { role });
  return response.data.data.user;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.patch(`/users/${userId}/status`, { status });
  return response.data.data.user;
};
