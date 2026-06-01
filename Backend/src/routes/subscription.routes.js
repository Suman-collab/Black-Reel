import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/user.model.js';

const router = express.Router();

// All subscription routes require authentication
router.use(protect);

// POST /subscription/create-order — Create a Razorpay order
router.post('/create-order', paymentController.createRazorpayOrder);

// POST /subscription/verify — Verify Razorpay payment & activate subscription
router.post('/verify', paymentController.verifyRazorpayPayment);

// GET /subscription/status — Get current subscription status
router.get('/status', catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('subscription');

  const sub = user?.subscription || {};

  res.status(200).json({
    success: true,
    data: {
      planType: sub.planType || 'none',
      status: sub.status || 'inactive',
      startedAt: sub.startedAt || null,
      renewalDate: sub.renewalDate || null,
      isActive: sub.status === 'active' && sub.planType !== 'none',
    },
  });
}));

export default router;
