import express from 'express';
import * as contentController from '../controllers/content.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Publicly accessible content routes
router.get('/', contentController.getAllContent);
router.get('/:id', contentController.getContent);

// Admin-only routes
router.use(protect, authorize('admin'));
router.post('/', contentController.createContent);
router.put('/:id', contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

export default router;
