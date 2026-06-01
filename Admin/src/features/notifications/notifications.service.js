import api from '../../lib/api';

export const getBroadcasts = async () => {
  const response = await api.get('/admin/notifications/broadcasts');
  return response.data.data.broadcasts;
};

export const createBroadcast = async (payload) => {
  const response = await api.post('/admin/notifications/broadcasts', payload);
  return response.data.data.notification;
};
