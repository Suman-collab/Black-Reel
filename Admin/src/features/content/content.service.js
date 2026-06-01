import api from '../../lib/api';

export const getContent = async () => {
  const response = await api.get('/content', { params: { limit: 100 } });
  return response.data.data.content;
};

export const createContent = async (payload) => {
  // If payload is FormData (multipart upload), use special config
  if (payload instanceof FormData) {
    const response = await api.post('/content', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 min timeout for large uploads
    });
    return response.data.data.content;
  }

  const response = await api.post('/content', payload);
  return response.data.data.content;
};

export const updateContent = async (contentId, payload) => {
  if (payload instanceof FormData) {
    const response = await api.put(`/content/${contentId}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    });
    return response.data.data.content;
  }

  const response = await api.put(`/content/${contentId}`, payload);
  return response.data.data.content;
};

export const deleteContent = async (contentId) => {
  await api.delete(`/content/${contentId}`);
};

export const getEpisodes = async (seriesId) => {
  const response = await api.get(`/content/${seriesId}/episodes`);
  return response.data.data.episodes;
};
