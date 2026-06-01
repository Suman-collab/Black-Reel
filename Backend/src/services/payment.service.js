import crypto from 'crypto';
import Payment from '../models/payment.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { z } from 'zod';
import { validate } from '../utils/validate.js';
import { config } from '../config/index.js';

const checkoutSessionSchema = z.object({
  planType: z.enum(['basic', 'standard', 'premium']),
  billingEmail: z.string().trim().email('Please provide a valid billing email').optional(),
});

const confirmPaymentSchema = z.object({
  checkoutSessionId: z.string().trim().min(6, 'Checkout session is required'),
  paymentMethod: z.string().trim().min(4, 'Payment method is required'),
});

const razorpayVerifySchema = z.object({
  checkoutSessionId: z.string().trim().min(6, 'Checkout session is required'),
  razorpay_order_id: z.string().trim().min(6, 'Razorpay order id is required'),
  razorpay_payment_id: z.string().trim().min(6, 'Razorpay payment id is required'),
  razorpay_signature: z.string().trim().min(6, 'Razorpay signature is required'),
  paymentMethod: z.string().trim().min(4).optional(),
});

const cancelPaymentSchema = z.object({
  checkoutSessionId: z.string().trim().min(6, 'Checkout session is required'),
  reason: z.string().trim().min(3).max(160).optional(),
});

const webhookSchema = z.object({
  checkoutSessionId: z.string().trim().min(6, 'Checkout session is required'),
  eventType: z.enum(['payment_succeeded', 'payment_failed', 'payment_cancelled']),
  paymentMethod: z.string().trim().min(4).optional(),
  failureReason: z.string().trim().min(3).max(160).optional(),
});

const planCatalog = {
  basic: {
    amount: 99,
    label: 'Basic',
  },
  standard: {
    amount: 199,
    label: 'Standard',
  },
  premium: {
    amount: 299,
    label: 'Premium',
  },
};

export const mapPayment = (payment) => ({
  id: payment._id,
  checkoutSessionId: payment.checkoutSessionId || null,
  transactionId: payment.transactionId,
  planType: payment.planType,
  plan: planCatalog[payment.planType]?.label || payment.planType,
  amount: payment.amount,
  currency: payment.currency,
  formattedAmount: `${payment.currency} ${payment.amount.toFixed(2)}`,
  billingEmail: payment.billingEmail,
  paymentMethod: payment.paymentMethod,
  nextBillingDate: payment.nextBillingDate,
  status: payment.status,
  createdAt: payment.createdAt,
  completedAt: payment.completedAt || null,
  failedAt: payment.failedAt || null,
  userEmail: payment.user?.email,
  userName: payment.user?.name,
});

const buildCheckoutSessionId = () => `cs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const buildTransactionId = () => `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const activateSubscriptionForPayment = async (payment) => {
  if (!payment) {
    throw new AppError('Payment record not found', 404);
  }
  if (payment.status !== 'completed' && payment.status !== 'success') {
    throw new AppError('Subscription cannot be activated because payment is not completed', 400);
  }
  await User.findByIdAndUpdate(payment.user, {
    subscription: {
      planType: payment.planType,
      status: 'active',
      startedAt: new Date(),
      renewalDate: payment.nextBillingDate,
    },
  });
};

const findCheckoutPayment = async (checkoutSessionId) => {
  const payment = await Payment.findOne({ checkoutSessionId });

  if (!payment) {
    throw new AppError('Checkout session not found', 404);
  }

  return payment;
};


const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const secret = config.razorpay.keySecret;
  const mockAllowed = config.app.env !== 'production' && config.razorpay.allowMockPayments;

  if (!secret && !mockAllowed) {
    throw new AppError('Payment verification is unavailable. Please try again later.', 503);
  }

  if (mockAllowed && razorpay_signature.startsWith('mocksig_')) {
    return true;
  }

  if (!secret) {
    throw new AppError('Payment verification failed for this transaction.', 400);
  }

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const provided = Buffer.from(String(razorpay_signature), 'utf8');
  const expected = Buffer.from(String(expectedSignature), 'utf8');

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new AppError('Payment verification failed for this transaction.', 400);
  }

  return true;
};


export const verifyWebhookSignature = ({ payload, rawBody, signature }) => {
  const secret = config.stripe.webhookSecret || process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError('Webhook configuration is incomplete.', 500);
  }

  if (!signature || typeof signature !== 'string') {
    throw new AppError('Invalid webhook signature', 401);
  }

  const bodyPayload =
    Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(JSON.stringify(payload || {}), 'utf8');
  const expected = crypto.createHmac('sha256', secret).update(bodyPayload).digest('hex');
  const providedBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new AppError('Invalid webhook signature', 401);
  }

  return true;
};

export const createCheckoutSession = async (userId, planData) => {
  const payload = validate(checkoutSessionSchema, planData);
  const selectedPlan = planCatalog[payload.planType];

  if (!selectedPlan) {
    throw new AppError('Invalid subscription plan selected', 400);
  }

  const user = await User.findById(userId).select('email subscription emailVerified status');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.status === 'suspended') {
    throw new AppError('Your account is currently suspended and cannot purchase or renew subscriptions.', 403);
  }

  if (!user.emailVerified) {
    throw new AppError('Please verify your email before subscribing.', 403);
  }

  const accountEmail = String(user.email || '').trim().toLowerCase();
  const requestedBillingEmail = payload.billingEmail
    ? payload.billingEmail.trim().toLowerCase()
    : accountEmail;

  if (requestedBillingEmail !== accountEmail) {
    throw new AppError(
      'Billing email must match the logged-in account. Log out and switch accounts to continue.',
      403
    );
  }

  if (user.subscription?.status !== 'active') {
    await User.findByIdAndUpdate(userId, {
      subscription: {
        planType: payload.planType,
        status: 'pending',
        startedAt: undefined,
        renewalDate: undefined,
      },
    });
  }

  await Payment.updateMany(
    { user: userId, status: 'pending' },
    {
      $set: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: 'Replaced by a newer checkout session',
      },
    }
  );

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  const payment = await Payment.create({
    user: userId,
    planType: payload.planType,
    amount: selectedPlan.amount,
    status: 'pending',
    checkoutSessionId: buildCheckoutSessionId(),
    billingEmail: accountEmail,
    paymentMethod: 'Pending confirmation',
    nextBillingDate,
    transactionId: buildTransactionId(),
  });

  return {
    ...mapPayment(payment),
    checkoutUrl: `/checkout?plan=${payload.planType}&session=${payment.checkoutSessionId}`,
  };
};

export const createRazorpayOrder = async (userId, planData) => {
  const session = await createCheckoutSession(userId, planData);
  const isProduction = config.app.env === 'production';
  const keyId = config.razorpay.keyId || '';
  const hasSecret = Boolean(config.razorpay.keySecret);

  if (isProduction && (!keyId || !hasSecret)) {
    throw new AppError('Payment gateway configuration is incomplete. Please contact support.', 503);
  }

  const amountInSubunits = Math.round(session.amount * 100);

  return {
    provider: 'razorpay',
    key: isProduction ? keyId : (keyId || 'rzp_test_mock_key'),
    orderId: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount: amountInSubunits,
    currency: session.currency,
    checkoutSessionId: session.checkoutSessionId,
    planType: session.planType,
    billingEmail: session.billingEmail,
    name: 'Black Shortz',
    description: `${session.plan} Membership`,
  };
};

export const confirmCheckoutSession = async (userId, confirmationPayload) => {
  const payload = validate(confirmPaymentSchema, confirmationPayload);
  const payment = await findCheckoutPayment(payload.checkoutSessionId);

  if (String(payment.user) !== String(userId)) {
    throw new AppError('You are not authorized to confirm this checkout session', 403);
  }

  if (payment.status === 'completed') {
    return payment;
  }

  if (payment.status === 'failed') {
    throw new AppError('This checkout session is no longer valid. Start a new payment.', 409);
  }

  payment.status = 'completed';
  payment.paymentMethod = payload.paymentMethod;
  payment.completedAt = new Date();
  payment.failedAt = undefined;
  payment.failureReason = undefined;
  await payment.save();

  await activateSubscriptionForPayment(payment);

  return payment;
};

export const verifyRazorpayPayment = async (userId, verificationPayload) => {
  const payload = validate(razorpayVerifySchema, verificationPayload);
  const payment = await findCheckoutPayment(payload.checkoutSessionId);

  if (String(payment.user) !== String(userId)) {
    throw new AppError('You are not authorized to verify this checkout session', 403);
  }

  if (payment.status === 'completed') {
    return payment;
  }

  if (payment.status === 'failed') {
    throw new AppError('This checkout session is no longer valid. Start a new payment.', 409);
  }

  verifyRazorpaySignature(payload);

  payment.status = 'completed';
  payment.paymentMethod = payload.paymentMethod || 'Razorpay';
  payment.completedAt = new Date();
  payment.failedAt = undefined;
  payment.failureReason = undefined;
  payment.transactionId = payload.razorpay_payment_id;
  await payment.save();

  await activateSubscriptionForPayment(payment);

  return payment;
};

export const cancelCheckoutSession = async (userId, cancellationPayload) => {
  const payload = validate(cancelPaymentSchema, cancellationPayload);
  const payment = await findCheckoutPayment(payload.checkoutSessionId);

  if (String(payment.user) !== String(userId)) {
    throw new AppError('You are not authorized to cancel this checkout session', 403);
  }

  if (payment.status === 'completed') {
    throw new AppError('Completed payments cannot be cancelled', 409);
  }

  if (payment.status === 'failed') {
    return payment;
  }

  payment.status = 'failed';
  payment.failedAt = new Date();
  payment.failureReason = payload.reason || 'Checkout cancelled by user';
  await payment.save();

  await User.updateOne(
    {
      _id: userId,
      'subscription.status': 'pending',
      'subscription.planType': payment.planType,
    },
    {
      $set: {
        'subscription.status': 'inactive',
        'subscription.planType': 'none',
      },
      $unset: {
        'subscription.startedAt': '',
        'subscription.renewalDate': '',
      },
    }
  );

  return payment;
};

export const handlePaymentWebhook = async (webhookPayload) => {
  const payload = validate(webhookSchema, webhookPayload);
  const payment = await findCheckoutPayment(payload.checkoutSessionId);

  if (payload.eventType === 'payment_succeeded') {
    if (payment.status !== 'completed') {
      payment.status = 'completed';
      payment.paymentMethod = payload.paymentMethod || payment.paymentMethod || 'Gateway card payment';
      payment.completedAt = new Date();
      payment.failedAt = undefined;
      payment.failureReason = undefined;
      await payment.save();
      await activateSubscriptionForPayment(payment);
    }

    return payment;
  }

  if (payment.status === 'completed') {
    return payment;
  }

  payment.status = 'failed';
  payment.failedAt = new Date();
  payment.failureReason =
    payload.failureReason ||
    (payload.eventType === 'payment_cancelled'
      ? 'Payment cancelled by customer'
      : 'Payment failed at gateway');
  await payment.save();

  await User.updateOne(
    {
      _id: payment.user,
      'subscription.status': 'pending',
      'subscription.planType': payment.planType,
    },
    {
      $set: {
        'subscription.status': 'inactive',
        'subscription.planType': 'none',
      },
      $unset: {
        'subscription.startedAt': '',
        'subscription.renewalDate': '',
      },
    }
  );

  return payment;
};

export const getUserPaymentHistory = async (userId) => {
  return await Payment.find({ user: userId, status: 'completed' }).sort('-createdAt');
};

export const getAllSubscriptions = async ({ plan, status }) => {
  const filters = {};

  if (plan && plan !== 'all') {
    filters.planType = plan;
  }

  if (status && status !== 'all') {
    filters.status = status;
  }

  return await Payment.find(filters)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
};
