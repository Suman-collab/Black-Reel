import * as paymentService from '../services/payment.service.js';
import catchAsync from '../utils/catchAsync.js';

export const subscribe = catchAsync(async (req, res, next) => {
  const payment = await paymentService.processSubscription(req.user.id, req.body);
  res.status(200).json({ success: true, data: { payment: paymentService.mapPayment(payment) } });
});

export const getHistory = catchAsync(async (req, res, next) => {
  const history = await paymentService.getUserPaymentHistory(req.user.id);
  res.status(200).json({
    success: true,
    count: history.length,
    data: { history: history.map(paymentService.mapPayment) }
  });
});

export const getAllSubscriptions = catchAsync(async (req, res, next) => {
  const subscriptions = await paymentService.getAllSubscriptions(req.query);
  res.status(200).json({
    success: true,
    count: subscriptions.length,
    data: { subscriptions: subscriptions.map(paymentService.mapPayment) }
  });
});
