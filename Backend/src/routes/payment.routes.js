import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.get('/plans', paymentController.getPlans);


router.use(protect);


router.post('/checkout-session', paymentController.createCheckoutSession);
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);
router.post('/razorpay/verify', paymentController.verifyRazorpayPayment);
router.post('/confirm', paymentController.confirmCheckoutSession);
router.post('/cancel', paymentController.cancelCheckoutSession);
router.post('/subscribe', paymentController.subscribe);


router.post('/create-order', paymentController.createOrder);
router.post('/process', paymentController.processPayment);
router.get('/history', paymentController.getHistory);
router.get('/subscriptions', authorize('admin'), paymentController.getAllSubscriptions);

export default router;
