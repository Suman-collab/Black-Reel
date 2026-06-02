import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getMyDevices,
  removeMyDevice,
  signOutAllDevices,
  swapMyDevice,
} from '../controllers/device.controller.js';

const router = express.Router();


router.use(protect);

router.get('/',                  getMyDevices);
router.delete('/',               signOutAllDevices);
router.delete('/:deviceId',      removeMyDevice);
router.post('/swap',             swapMyDevice);

export default router;
