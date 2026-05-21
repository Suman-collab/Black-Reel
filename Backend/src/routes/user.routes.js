import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes below
router.use(protect);

// Publicly logged-in routes
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.post('/profile/avatar', userController.uploadAvatar);
router.patch('/preferences', userController.updatePreferences);
router.get('/watchlist', userController.getWatchlist);
router.post('/watchlist/:contentId', userController.addToWatchlist);
router.delete('/watchlist/:contentId', userController.removeFromWatchlist);
router.get('/devices', userController.getDevices);
router.delete('/devices/:deviceId', userController.removeDevice);

// Admin-only routes
router.use(authorize('admin'));
router.get('/', userController.getUsers);
router.patch('/:id/role', userController.updateRole);
router.patch('/:id/status', userController.updateStatus);

export default router;
