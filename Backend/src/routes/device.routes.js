import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getMyDevices,
  removeMyDevice,
  signOutAllDevices,
} from '../controllers/device.controller.js';

const router = express.Router();


router.use(protect);

router.get('/',                  getMyDevices);
router.delete('/',               signOutAllDevices);
router.delete('/:deviceId',      removeMyDevice);

export default router;
