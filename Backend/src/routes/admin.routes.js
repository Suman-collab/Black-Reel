import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin')); // Secure entire admin pipeline
router.get('/stats', adminController.getStats);
router.get('/overview', adminController.getOverview);
router.get('/subscriptions', adminController.getSubscriptions);
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.updateReportStatus);

export default router;
