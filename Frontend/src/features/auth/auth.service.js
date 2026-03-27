import api from '../../lib/api';

const unwrapAuthResponse = (response) => ({
  token: response.data.token,
  user: response.data.data.user,
});

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return unwrapAuthResponse(response);
};

export const register = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return unwrapAuthResponse(response);
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};
