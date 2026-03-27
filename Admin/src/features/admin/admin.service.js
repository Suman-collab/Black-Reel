import api from '../../lib/api';

export const getOverview = async () => {
  const response = await api.get('/admin/overview');
  return response.data.data.overview;
};

export const getSubscriptions = async () => {
  const response = await api.get('/admin/subscriptions');
  return response.data.data.subscriptions;
};

export const getReports = async () => {
  const response = await api.get('/admin/reports');
  return response.data.data.reports;
};

export const updateReportStatus = async (reportId, status) => {
  const response = await api.patch(`/admin/reports/${reportId}`, { status });
  return response.data.data.report;
};
