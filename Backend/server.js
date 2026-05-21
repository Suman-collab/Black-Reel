import 'dotenv/config';
import mongoose from 'mongoose';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import seedDatabase from './src/config/seed.js';

const PORT = process.env.PORT || 5000;

// Fixed: startup validation now includes webhook secret in production.
const requiredEnv = ['MONGO_URI', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
if (process.env.NODE_ENV === 'production') {
  requiredEnv.push('PAYMENT_WEBHOOK_SECRET', 'JWT_SECRET');
}

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const startServer = async () => {
  // Fixed: connect to Mongo once at startup before accepting traffic.
  await connectDB();

  // Fixed: observe DB disconnect events to surface runtime connectivity risks.
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. The API may serve degraded responses until reconnection succeeds.');
  });

  await seedDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer().catch((err) => {
  console.error('FAILED TO START SERVER! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
