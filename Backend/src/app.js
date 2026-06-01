import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middlewares/error.middleware.js';
import AppError from './utils/AppError.js';
import routes from './routes/index.js';
import * as paymentController from './controllers/payment.controller.js';
import { passport } from './config/passport.js';
import { config } from './config/index.js';

const app = express();

const allowedOrigins = config.cors.allowedOrigins;
const isProduction = config.app.env === 'production';


app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...allowedOrigins],
        fontSrc: ["'self'", 'data:'],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  })
);


app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0 && !isProduction) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError('Origin is not allowed by CORS policy.', 403));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), paymentController.handleWebhook);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(passport.initialize());

if (config.app.env === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 15 minutes!',
});

app.use('/api', limiter);
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Black Reel API is healthy',
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Black Reel API',
  });
});

app.use('/api/v1', routes);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.status(200).json({ 
    message: 'Frontend route — handled by React Router' 
  });
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

export default app;
