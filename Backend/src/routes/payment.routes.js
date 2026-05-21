import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/webhook', paymentController.handleWebhook);

router.use(protect); // Ensure user is logged in for all payment endpoints
router.post('/checkout-session', paymentController.createCheckoutSession);
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);
router.post('/razorpay/verify', paymentController.verifyRazorpayPayment);
router.post('/confirm', paymentController.confirmCheckoutSession);
router.post('/cancel', paymentController.cancelCheckoutSession);
router.post('/subscribe', paymentController.subscribe);
router.get('/history', paymentController.getHistory);
router.get('/subscriptions', authorize('admin'), paymentController.getAllSubscriptions);

export default router;
