import { config } from '../config/index.js';

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err.name,
    message: err.message,
    ...(err.errorCode ? { errorCode: err.errorCode } : {}),
    ...(err.data      ? { data: err.data }           : {}),
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      ...(err.errorCode ? { errorCode: err.errorCode } : {}),
      ...(err.data      ? { data: err.data }           : {}),
    });
  } else {
    console.error('ERROR', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const normalizeOperationalError = (err) => {
  let error = { ...err, message: err.message };

  if (error.name === 'CastError') {
    error = {
      ...error,
      message: `Invalid ${err.path}: ${err.value}`,
      statusCode: 400,
      status: 'fail',
      isOperational: true,
    };
  }

  if (error.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0];
    error = {
      ...error,
      message: `${duplicateField || 'Record'} already exists`,
      statusCode: 400,
      status: 'fail',
      isOperational: true,
    };
  }

  if (error.name === 'ValidationError') {
    error = {
      ...error,
      message: Object.values(err.errors || {})
        .map((item) => item.message)
        .join(', '),
      statusCode: 400,
      status: 'fail',
      isOperational: true,
    };
  }

  if (error.name === 'JsonWebTokenError') {
    error = {
      ...error,
      message: 'Invalid token. Please log in again.',
      statusCode: 401,
      status: 'fail',
      isOperational: true,
    };
  }

  if (error.name === 'TokenExpiredError') {
    error = {
      ...error,
      message: 'Your session has expired. Please log in again.',
      statusCode: 401,
      status: 'fail',
      isOperational: true,
    };
  }

  if (error.name === 'MongooseServerSelectionError') {
    error = {
      ...error,
      message: 'Database connection failed. Please verify MongoDB Atlas network access and environment variables.',
      statusCode: 503,
      status: 'error',
      isOperational: true,
    };
  }

  return error;
};

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.app.env === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(normalizeOperationalError(err), res);
  }
};
