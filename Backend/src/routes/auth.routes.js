import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.post('/admin-login', authController.adminLogin);
router.get('/google', authController.beginGoogleAuth);
router.get('/google/callback', authController.handleGoogleCallback);
router.get('/me', protect, authController.getMe);
router.post('/logout', authController.logout);

export default router;
