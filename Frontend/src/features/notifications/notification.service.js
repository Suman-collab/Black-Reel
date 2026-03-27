import api from '../../lib/api';

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data.data.notifications;
};

export const updateNotificationPreferences = async (notificationsEnabled) => {
  const response = await api.patch('/notifications/preferences', { notificationsEnabled });
  return response.data.data.preferences;
};
