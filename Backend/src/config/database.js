import mongoose from 'mongoose';

let connectionPromise = null;

const connectWithUri = async (uri, label) => {
  const instance = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  const { connection } = instance;
  const hostLabel = connection.host || label;
  console.log(`MongoDB Connected: ${hostLabel}`);
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
    .then(() => connectWithUri(process.env.MONGO_URI, 'replica-set'))
    .catch((error) => {
      console.error(`Error connecting to MongoDB: ${error.message}`);

      const fallbackUri = process.env.MONGO_FALLBACK_URI;
      const shouldTryFallback =
        process.env.NODE_ENV !== 'production' &&
        fallbackUri &&
        fallbackUri !== process.env.MONGO_URI;

      if (!shouldTryFallback) {
        throw error;
      }

      console.warn('Retrying MongoDB connection with development fallback URI.');
      return connectWithUri(fallbackUri, 'development-fallback');
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

export default connectDB;
