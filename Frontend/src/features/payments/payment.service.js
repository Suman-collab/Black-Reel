import api from '../../lib/api';

export const createCheckoutSession = async (payload) => {
  const response = await api.post('/payments/checkout-session', payload);
  return response.data.data.session;
};

export const createRazorpayOrder = async (payload) => {
  const response = await api.post('/payments/razorpay/create-order', payload);
  return response.data.data.order;
};

export const confirmCheckoutSession = async (payload) => {
  const response = await api.post('/payments/confirm', payload);
  return response.data.data.payment;
};

export const verifyRazorpayPayment = async (payload) => {
  const response = await api.post('/payments/razorpay/verify', payload);
  return response.data.data.payment;
};

export const cancelCheckoutSession = async (payload) => {
  const response = await api.post('/payments/cancel', payload);
  return response.data.data.payment;
};

export const getPaymentHistory = async () => {
  const response = await api.get('/payments/history');
  return response.data.data?.history || response.data.payments || [];
};

export const createDummyOrder = async (planId) => {
  const response = await api.post('/payments/create-order', { planId });
  return response.data.order;
};

export const processDummyPayment = async (payload) => {
  const response = await api.post('/payments/process', payload);
  return response.data;
};
