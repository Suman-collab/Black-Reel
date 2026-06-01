import api from '../../lib/api';


export const getCurrentUser = async (firebaseToken = null) => {
  const response = await api.get('/auth/me', {
    headers: firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : undefined,
  });
  return response.data.data.user;
};

export const logoutCurrentSession = async () => {
  await api.post('/auth/logout');
};
