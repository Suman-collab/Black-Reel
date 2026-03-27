import Payment from '../models/payment.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { z } from 'zod';
import { validate } from '../utils/validate.js';

const subscriptionSchema = z.object({
  planType: z.enum(['basic', 'standard', 'premium']),
  paymentMethod: z.string().trim().optional(),
});

const planCatalog = {
  basic: {
    amount: 4.99,
    label: 'Basic',
  },
  standard: {
    amount: 7.99,
    label: 'Standard',
  },
  premium: {
    amount: 9.99,
    label: 'Premium',
  },
};

export const mapPayment = (payment) => ({
  id: payment._id,
  transactionId: payment.transactionId,
  planType: payment.planType,
  plan: planCatalog[payment.planType]?.label || payment.planType,
  amount: payment.amount,
  currency: payment.currency,
  formattedAmount: `${payment.currency} ${payment.amount.toFixed(2)}`,
  paymentMethod: payment.paymentMethod,
  nextBillingDate: payment.nextBillingDate,
  status: payment.status,
  createdAt: payment.createdAt,
  userEmail: payment.user?.email,
  userName: payment.user?.name,
});

export const processSubscription = async (userId, planData) => {
  const payload = validate(subscriptionSchema, planData);
  const selectedPlan = planCatalog[payload.planType];

  if (!selectedPlan) {
    throw new AppError('Invalid subscription plan selected', 400);
  }

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  const payment = await Payment.create({
    user: userId,
    planType: payload.planType,
    amount: selectedPlan.amount,
    status: 'completed',
    paymentMethod: payload.paymentMethod || 'Visa ending 4242',
    nextBillingDate,
    transactionId: `txn_${Date.now()}`
  });

  await User.findByIdAndUpdate(userId, {
    subscription: {
      planType: payload.planType,
      status: 'active',
      startedAt: new Date(),
      renewalDate: nextBillingDate,
    },
  });
  
  return payment;
};

export const getUserPaymentHistory = async (userId) => {
  return await Payment.find({ user: userId }).sort('-createdAt');
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
