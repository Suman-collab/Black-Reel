import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Fixed: added missing admin login route used by Admin frontend.
router.post('/admin-login', authController.adminLogin);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

export default router;
