import express from 'express';
import * as contentController from '../controllers/content.controller.js';
import { protect, optionalProtect, authorize } from '../middlewares/auth.middleware.js';
import { uploadContentFiles, validateUploadSizes, handleMulterError } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public / optional auth routes
router.get('/', optionalProtect, contentController.getAllContent);
router.get('/:id', optionalProtect, contentController.getContent);
router.get('/:id/episodes', optionalProtect, contentController.getEpisodes);
router.get('/:id/stream', protect, contentController.streamVideo);
router.post('/:id/watch', protect, contentController.watchContent);

// Admin-only routes with file upload support
router.use(protect, authorize('admin'));
router.post('/', uploadContentFiles, handleMulterError, validateUploadSizes, contentController.createContent);
router.put('/:id', uploadContentFiles, handleMulterError, validateUploadSizes, contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

export default router;
