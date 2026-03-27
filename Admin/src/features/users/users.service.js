import api from '../../lib/api';

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data.data.users;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/users/${userId}/role`, { role });
  return response.data.data.user;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.patch(`/users/${userId}/status`, { status });
  return response.data.data.user;
};
