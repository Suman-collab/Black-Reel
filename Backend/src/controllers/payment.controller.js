import * as paymentService from '../services/payment.service.js';
import catchAsync from '../utils/catchAsync.js';

export const createCheckoutSession = catchAsync(async (req, res) => {
  const session = await paymentService.createCheckoutSession(req.user.id, req.body);
  res.status(201).json({ success: true, data: { session } });
});

export const createRazorpayOrder = catchAsync(async (req, res) => {
  const order = await paymentService.createRazorpayOrder(req.user.id, req.body);
  res.status(201).json({ success: true, data: { order } });
});

export const confirmCheckoutSession = catchAsync(async (req, res) => {
  const payment = await paymentService.confirmCheckoutSession(req.user.id, req.body);
  res.status(200).json({ success: true, data: { payment: paymentService.mapPayment(payment) } });
});

export const verifyRazorpayPayment = catchAsync(async (req, res) => {
  const payment = await paymentService.verifyRazorpayPayment(req.user.id, req.body);
  res.status(200).json({ success: true, data: { payment: paymentService.mapPayment(payment) } });
});

export const cancelCheckoutSession = catchAsync(async (req, res) => {
  const payment = await paymentService.cancelCheckoutSession(req.user.id, req.body);
  res.status(200).json({ success: true, data: { payment: paymentService.mapPayment(payment) } });
});

// Fixed: webhook signature is always verified; no bypass when secret is unset.
export const handleWebhook = catchAsync(async (req, res) => {
  paymentService.verifyWebhookSignature({
    payload: req.body,
    signature: req.headers['x-payment-webhook-signature'],
  });

  const payment = await paymentService.handlePaymentWebhook(req.body);
  res.status(200).json({ success: true, data: { payment: paymentService.mapPayment(payment) } });
});

// Backward-compatible alias for older clients.
export const subscribe = confirmCheckoutSession;

export const getHistory = catchAsync(async (req, res) => {
  const history = await paymentService.getUserPaymentHistory(req.user.id);
  res.status(200).json({
    success: true,
    count: history.length,
    data: { history: history.map(paymentService.mapPayment) }
  });
});

export const getAllSubscriptions = catchAsync(async (req, res) => {
  const subscriptions = await paymentService.getAllSubscriptions(req.query);
  res.status(200).json({
    success: true,
    count: subscriptions.length,
    data: { subscriptions: subscriptions.map(paymentService.mapPayment) }
  });
});
