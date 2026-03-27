import mongoose from 'mongoose';

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((instance) => {
      const { connection } = instance;
      const hostLabel = connection.host || 'replica-set';
      console.log(`MongoDB Connected: ${hostLabel}`);
      return connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error(`Error connecting to MongoDB: ${error.message}`);
      throw error;
    });

  return connectionPromise;
};

export default connectDB;
