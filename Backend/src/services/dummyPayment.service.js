import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/payment.model.js';
import User from '../models/user.model.js';
import { config } from '../config/index.js';


export const TEST_CARDS = {
  '4242424242424242': { result: 'success', brand: 'Visa' },
  '5555555555554444': { result: 'success', brand: 'Mastercard' },
  '4000000000000002': { result: 'declined', brand: 'Visa' },
  '4000000000009995': { result: 'insufficient_funds', brand: 'Visa' },
  '4000000000000069': { result: 'expired_card', brand: 'Visa' },
  '4000000000000127': { result: 'incorrect_cvc', brand: 'Visa' },
};


export const PLANS = {
  basic: {
    name: 'Basic',
    price: 99,
    currency: 'INR',
    durationDays: 30,
    maxDevices: 1,
    maxStreams: 1,
    quality: 'HD',
    features: ['HD Streaming', '1 Screen', '1 Device', 'Mobile & Tablet'],
  },
  standard: {
    name: 'Standard',
    price: 199,
    currency: 'INR',
    durationDays: 30,
    maxDevices: 2,
    maxStreams: 2,
    quality: 'Full HD',
    features: ['Full HD Streaming', '2 Screens', '2 Devices', 'All Devices', 'Downloads'],
  },
  premium: {
    name: 'Premium',
    price: 299,
    currency: 'INR',
    durationDays: 30,
    maxDevices: 4,
    maxStreams: 4,
    quality: '4K',
    features: ['4K + HDR', '4 Screens', '4 Devices', 'All Devices', 'Downloads', 'Dolby Audio'],
  },
};


export const createDummyOrder = async (userId, planId) => {
  const plan = PLANS[planId];
  if (!plan) throw new Error('Invalid plan selected');

  const orderId = `dummy_order_${uuidv4()}`;
  
  return {
    orderId,
    planId,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency,
    features: plan.features,
    durationDays: plan.durationDays,
    testCards: TEST_CARDS,
    mode: 'dummy',
  };
};


export const processDummyPayment = async (userId, { orderId, planId, cardNumber, expiryMonth, expiryYear, cvv, cardholderName }) => {
  const plan = PLANS[planId];
  if (!plan) throw new Error('Invalid plan');

  
  await new Promise(resolve => setTimeout(resolve, 1500));

  
  const cleanCard = String(cardNumber || '').replace(/\s/g, '');
  const cardBehavior = TEST_CARDS[cleanCard];
  
  let paymentResult;
  if (cardBehavior) {
    
    paymentResult = cardBehavior.result;
  } else {
    
    const successRate = config.payment.dummySuccessRate;
    paymentResult = Math.random() * 100 < successRate ? 'success' : 'declined';
  }

  const transactionId = `dummy_txn_${uuidv4()}`;
  const now = new Date();

  
  const user = await User.findById(userId);
  const userEmail = user?.email || 'unknown@blackreel.com';

  if (paymentResult === 'success') {
    const subscriptionEnd = new Date(now);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + plan.durationDays);

    
    await Payment.create({
      user: userId,
      planType: planId,
      planId,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      status: 'success',
      paymentMode: 'dummy',
      cardLast4: cleanCard.slice(-4) || '4242',
      cardBrand: cardBehavior?.brand || 'Visa',
      checkoutSessionId: orderId,
      transactionId,
      orderId,
      billingEmail: userEmail,
      paymentMethod: `${cardBehavior?.brand || 'Visa'} ending in ${cleanCard.slice(-4) || '4242'}`,
      nextBillingDate: subscriptionEnd,
      completedAt: now,
      paidAt: now,
    });

    
    await User.findByIdAndUpdate(userId, {
      subscription: {
        planType: planId,
        status: 'active',
        startedAt: now,
        renewalDate: subscriptionEnd,
      },
    });

    return {
      success: true,
      transactionId,
      orderId,
      plan: plan.name,
      amount: plan.price,
      currency: plan.currency,
      subscriptionEnd,
      message: 'Payment successful! Your subscription is now active.',
    };
  } else {
    
    await Payment.create({
      user: userId,
      planType: planId,
      planId,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      status: 'failed',
      paymentMode: 'dummy',
      cardLast4: cleanCard.slice(-4) || '0000',
      cardBrand: 'Unknown',
      checkoutSessionId: orderId,
      transactionId,
      orderId,
      billingEmail: userEmail,
      paymentMethod: 'Dummy Card Declined',
      failureReason: paymentResult,
      failedAt: now,
      paidAt: now,
    });

    const errorMessages = {
      declined: 'Your card was declined. Please try a different card.',
      insufficient_funds: 'Insufficient funds. Please use a different card.',
      expired_card: 'Your card has expired. Please use a valid card.',
      incorrect_cvc: 'Incorrect CVC code. Please check and try again.',
    };

    return {
      success: false,
      transactionId,
      failureReason: paymentResult,
      message: errorMessages[paymentResult] || 'Payment failed. Please try again.',
    };
  }
};


export const getPlans = () => {
  return Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan }));
};
