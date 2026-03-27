import api from '../../lib/api';

export const getContent = async () => {
  const response = await api.get('/content', { params: { limit: 100 } });
  return response.data.data.content;
};

export const createContent = async (payload) => {
  const response = await api.post('/content', payload);
  return response.data.data.content;
};

export const updateContent = async (contentId, payload) => {
  const response = await api.put(`/content/${contentId}`, payload);
  return response.data.data.content;
};

export const deleteContent = async (contentId) => {
  await api.delete(`/content/${contentId}`);
};
