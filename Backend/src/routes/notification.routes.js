import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authorize, protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/', notificationController.getNotifications);
router.patch('/preferences', notificationController.updatePreferences);
router.get('/broadcasts', authorize('admin'), notificationController.getBroadcasts);
router.post('/broadcasts', authorize('admin'), notificationController.createBroadcast);

export default router;
