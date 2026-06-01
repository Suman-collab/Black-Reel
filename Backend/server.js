import './src/config/loadEnv.js';
import mongoose from 'mongoose';
import { validateEnv } from './src/config/validateEnv.js';
import { config } from './src/config/index.js';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import seedDatabase from './src/config/seed.js';

validateEnv();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const startServer = async () => {
  
  await connectDB();

  
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. The API may serve degraded responses until reconnection succeeds.');
  });

  if (config.seed.enabled) {
    await seedDatabase();
  }

  const server = app.listen(config.app.port, () => {
    console.log(`Server running in ${config.app.env} mode on port ${config.app.port}`);
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
