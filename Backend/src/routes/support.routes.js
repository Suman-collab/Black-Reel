import express from 'express';
import * as supportController from '../controllers/support.controller.js';

const router = express.Router();

router.post('/contact', supportController.submitContact);

export default router;
