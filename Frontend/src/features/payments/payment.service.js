import api from '../../lib/api';

export const subscribeToPlan = async (planType) => {
  const response = await api.post('/payments/subscribe', { planType });
  return response.data.data.payment;
};

export const getPaymentHistory = async () => {
  const response = await api.get('/payments/history');
  return response.data.data.history;
};
