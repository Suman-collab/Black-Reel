import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  adminGetUserDevices,
  adminRemoveUserDevice,
  adminSignOutAll,
} from '../controllers/device.controller.js';

const router = express.Router();

router.use(protect, authorize('admin')); 


router.get('/stats',           adminController.getStats);
router.get('/overview',        adminController.getOverview);
router.get('/subscriptions',   adminController.getSubscriptions);
router.get('/reports',         adminController.getReports);
router.patch('/reports/:id',   adminController.updateReportStatus);


router.get('/users/stats',            adminController.getUserStats);
router.get('/users',                  adminController.getAllUsers);
router.get('/users/:id',              adminController.getUserById);
router.patch('/users/:id/status',     adminController.updateUserStatus);
router.patch('/users/:id/role',       adminController.updateUserRole);
router.delete('/users/:id',           adminController.deleteUser);
router.delete(
  '/users/:userId/devices/:deviceId', 
  adminController.adminRemoveDevice
);

router.get('/notifications/broadcasts', adminController.getAdminBroadcasts);
router.post('/notifications/broadcasts', adminController.createAdminBroadcast);

export default router;
