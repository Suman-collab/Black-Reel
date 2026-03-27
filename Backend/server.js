import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import seedDatabase from './src/config/seed.js';

const PORT = process.env.PORT || 5000;
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
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
  await connectDB();

  const shouldSeed =
    process.env.SEED_DEMO_DATA === 'true' ||
    (!process.env.SEED_DEMO_DATA && process.env.NODE_ENV !== 'production');

  if (shouldSeed) {
    await seedDatabase();
  }

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

startServer();
