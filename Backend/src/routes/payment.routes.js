import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // Ensure user is logged in for all payment endpoints
router.post('/subscribe', paymentController.subscribe);
router.get('/history', paymentController.getHistory);
router.get('/subscriptions', authorize('admin'), paymentController.getAllSubscriptions);

export default router;
