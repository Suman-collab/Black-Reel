import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import contentRoutes from './content.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';
import notificationRoutes from './notification.routes.js';
import configRoutes from './config.routes.js';
import deviceRoutes from './device.routes.js';
import supportRoutes from './support.routes.js';
import subscriptionRoutes from './subscription.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/content', contentRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/config', configRoutes);
router.use('/devices', deviceRoutes);
router.use('/support', supportRoutes);
router.use('/subscription', subscriptionRoutes);

export default router;
