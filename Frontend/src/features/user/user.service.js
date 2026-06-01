import api from '../../lib/api';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data.data.user;
};

export const updateProfile = async (payload) => {
  const response = await api.patch('/users/profile', payload);
  return response.data.data.user;
};

export const updatePreferences = async (payload) => {
  const response = await api.patch('/users/preferences', payload);
  return response.data.data.user;
};

export const uploadAvatar = async (avatarDataUrl) => {
  const response = await api.post('/users/profile/avatar', { avatarDataUrl });
  return response.data.data.user;
};

export const getWatchlist = async () => {
  const response = await api.get('/users/watchlist');
  return response.data.data.watchlist;
};

export const addToWatchlist = async (contentId) => {
  const response = await api.post(`/users/watchlist/${contentId}`);
  return response.data.data.watchlist;
};

export const removeFromWatchlist = async (contentId) => {
  const response = await api.delete(`/users/watchlist/${contentId}`);
  return response.data.data.watchlist;
};

export const getDevices = async () => {
  const response = await api.get('/devices');
  return response.data.data;
};

export const removeDevice = async (deviceId) => {
  const response = await api.delete(`/devices/${deviceId}`);
  return response.data;
};

export const signOutAllDevices = async () => {
  const response = await api.delete('/devices');
  return response.data;
};
