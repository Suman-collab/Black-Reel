import * as dummyPaymentService from '../services/dummyPayment.service.js';
import * as realPaymentService from '../services/payment.service.js';
import { config } from '../config/index.js';
import catchAsync from '../utils/catchAsync.js';
import Payment from '../models/payment.model.js';

const getService = () => {
  return config.payment.mode === 'dummy' 
    ? dummyPaymentService 
    : realPaymentService;
};


export const getPlans = catchAsync(async (req, res) => {
  const plans = dummyPaymentService.getPlans();
  res.status(200).json({ success: true, plans });
});


export const createOrder = catchAsync(async (req, res) => {
  const { planId } = req.body;
  if (config.payment.mode === 'dummy') {
    const order = await dummyPaymentService.createDummyOrder(req.user.id, planId);
    res.status(200).json({ success: true, order });
  } else {
    const order = await realPaymentService.createRazorpayOrder(req.user.id, { planType: planId });
    res.status(200).json({ success: true, order });
  }
});


export const processPayment = catchAsync(async (req, res) => {
  if (config.payment.mode === 'dummy') {
    const result = await dummyPaymentService.processDummyPayment(req.user.id, req.body);
    const statusCode = result.success ? 200 : 402;
    res.status(statusCode).json(result);
  } else {
    const payment = await realPaymentService.confirmCheckoutSession(req.user.id, req.body);
    res.status(200).json({ success: true, data: { payment: realPaymentService.mapPayment(payment) } });
  }
});


export const getPaymentHistory = catchAsync(async (req, res) => {
  const payments = await Payment.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.status(200).json({ success: true, payments });
});


export const createCheckoutSession = catchAsync(async (req, res) => {
  const session = await realPaymentService.createCheckoutSession(req.user.id, req.body);
  res.status(201).json({ success: true, data: { session } });
});

export const createRazorpayOrder = catchAsync(async (req, res) => {
  const order = await realPaymentService.createRazorpayOrder(req.user.id, req.body);
  res.status(201).json({ success: true, data: { order } });
});

export const confirmCheckoutSession = catchAsync(async (req, res) => {
  const payment = await realPaymentService.confirmCheckoutSession(req.user.id, req.body);
  res.status(200).json({ success: true, data: { payment: realPaymentService.mapPayment(payment) } });
});

export const verifyRazorpayPayment = catchAsync(async (req, res) => {
  const payment = await realPaymentService.verifyRazorpayPayment(req.user.id, req.body);
  res.status(200).json({ success: true, data: { payment: realPaymentService.mapPayment(payment) } });
});

export const cancelCheckoutSession = catchAsync(async (req, res) => {
  const payment = await realPaymentService.cancelCheckoutSession(req.user.id, req.body);
  res.status(200).json({ success: true, data: { payment: realPaymentService.mapPayment(payment) } });
});

export const handleWebhook = catchAsync(async (req, res) => {
  const rawPayload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}), 'utf8');
  let parsedPayload = req.body;

  if (Buffer.isBuffer(req.body)) {
    try {
      parsedPayload = JSON.parse(req.body.toString('utf8'));
    } catch {
      throw new Error('Invalid webhook payload JSON.');
    }
  }

  realPaymentService.verifyWebhookSignature({
    payload: parsedPayload,
    rawBody: rawPayload,
    signature: req.headers['x-payment-webhook-signature'] || req.headers['x-razorpay-signature'],
  });

  const payment = await realPaymentService.handlePaymentWebhook(parsedPayload);
  res.status(200).json({ success: true, data: { payment: realPaymentService.mapPayment(payment) } });
});

export const subscribe = confirmCheckoutSession;

export const getHistory = getPaymentHistory;

export const getAllSubscriptions = catchAsync(async (req, res) => {
  const subscriptions = await realPaymentService.getAllSubscriptions(req.query);
  res.status(200).json({
    success: true,
    count: subscriptions.length,
    data: { subscriptions: subscriptions.map(realPaymentService.mapPayment) }
  });
});
