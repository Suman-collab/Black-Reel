import api from '../../lib/api';

const TOKEN_KEYS = ['token', 'authToken', 'accessToken'];
const getStoredToken = () => TOKEN_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) || null;

export const getCurrentUser = async (firebaseToken = null) => {
  const bearerToken = firebaseToken || getStoredToken();
  const response = await api.get('/auth/me', {
    headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : undefined,
  });
  return response.data.data.user;
};

export const logoutCurrentSession = async () => {
  await api.post('/auth/logout');
};
