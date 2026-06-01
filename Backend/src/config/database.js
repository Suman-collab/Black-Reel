import mongoose from 'mongoose';
import { config } from './index.js';
import logger from './logger.js';

let connectionPromise = null;

const connectWithUri = async (uri, label) => {
  const instance = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  const { connection } = instance;
  const hostLabel = connection.host || label;
  logger.info(`MongoDB Connected: ${hostLabel}`);
  return connection;
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = Promise.resolve()
    .then(() => connectWithUri(config.db.url, 'replica-set'))
    .catch((error) => {
      logger.error(`Error connecting to MongoDB: ${error.message}`);

      const fallbackUri = config.db.fallbackUrl;
      const shouldTryFallback =
        config.app.env !== 'production' &&
        fallbackUri &&
        fallbackUri !== config.db.url;

      if (!shouldTryFallback) {
        throw error;
      }

      logger.warn('Retrying MongoDB connection with development fallback URI.');
      return connectWithUri(fallbackUri, 'development-fallback');
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

export default connectDB;
