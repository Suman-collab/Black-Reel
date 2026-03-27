import api from '../../lib/api';

export const getBroadcasts = async () => {
  const response = await api.get('/notifications/broadcasts');
  return response.data.data.broadcasts;
};

export const createBroadcast = async (payload) => {
  const response = await api.post('/notifications/broadcasts', payload);
  return response.data.data.notification;
};
