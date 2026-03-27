import api from '../../lib/api';

export const getContentList = async (params = {}) => {
  const response = await api.get('/content', { params });
  return response.data.data.content;
};

export const getContentById = async (id) => {
  const response = await api.get(`/content/${id}`);
  return response.data.data.content;
};
