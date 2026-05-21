import api from '../../lib/api';

// Fixed: allow first-call Firebase bearer token exchange while transitioning to cookie sessions.
export const getCurrentUser = async (firebaseToken = null) => {
  const response = await api.get('/auth/me', {
    headers: firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : undefined,
  });
  return response.data.data.user;
};
