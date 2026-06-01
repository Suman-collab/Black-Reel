import api from '../../lib/api';

const unwrapAuthResponse = (response) => ({
  token: response.data.token || null,
  user: response.data.data.user,
});

export const login = async (credentials) => {
  const response = await api.post('/auth/admin-login', credentials);
  return unwrapAuthResponse(response);
};

export const getCurrentAdmin = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};

export const logoutCurrentAdminSession = async () => {
  await api.post('/auth/logout');
};
