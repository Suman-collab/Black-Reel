import api from '../../lib/api';

const unwrapAuthResponse = (response) => {
  const token = response.data.token || null;
  const user = response.data.data?.user || null;
  return {
    token,
    user,
    requiresEmailVerification: Boolean(response.data.data?.requiresEmailVerification),
  };
};

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

export const verifyEmail = async (token) => {
  const response = await api.post('/auth/verify-email', { token });
  return unwrapAuthResponse(response);
};

export const resendVerification = async (email) => {
  const response = await api.post('/auth/resend-verification', email ? { email } : {});
  return response.data.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post('/auth/reset-password', { token, password });
  return unwrapAuthResponse(response);
};

export const socialLogin = async (payload) => {
  const response = await api.post('/auth/social-login', payload);
  return unwrapAuthResponse(response);
};
