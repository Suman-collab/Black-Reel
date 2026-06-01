import api from '../../lib/api';

export const getOverview = async () => {
  const response = await api.get('/admin/overview');
  return response.data.data.overview;
};

export const getSubscriptions = async (params = {}) => {
  const response = await api.get('/admin/subscriptions', { params });
  return response.data.data;
};

export const getReports = async (params = {}) => {
  const response = await api.get('/admin/reports', { params });
  return response.data.data;
};

export const updateReportStatus = async (reportId, status) => {
  const response = await api.patch(`/admin/reports/${reportId}`, { status });
  return response.data.data.report;
};
