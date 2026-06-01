import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import AppError from '../utils/AppError.js';
import { config } from '../config/index.js';
import { requireAdminConfigSecret, requireConfigClient } from '../middlewares/configAuth.js';
import { getAdminConfig, getPublicConfig } from '../controllers/config.controller.js';

const router = express.Router();

const allowedOrigins = config.cors.allowedOrigins;

router.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0 && config.app.env !== 'production') {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError('Origin not allowed for config endpoint', 403));
    },
    credentials: false,
    methods: ['GET', 'OPTIONS'],
  })
);

router.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many config requests. Please try again later.',
  })
);

router.get('/public', requireConfigClient, (req, res, next) => {
  if (req.configClient !== 'frontend') {
    res.status(403).json({ success: false, message: 'Forbidden: frontend client header required.' });
    return;
  }
  next();
}, getPublicConfig);

router.get('/admin', requireConfigClient, (req, res, next) => {
  if (req.configClient !== 'admin') {
    res.status(403).json({ success: false, message: 'Forbidden: admin client header required.' });
    return;
  }
  next();
}, requireAdminConfigSecret, getAdminConfig);

export default router;

