import './loadEnv.js';
import mongoose from 'mongoose';
import connectDB from './database.js';
import User from '../models/user.model.js';

const runMigration = async () => {
  await connectDB();

  const result = await User.updateMany(
    { avatar: { $exists: false } },
    { $set: { avatar: null } }
  );

  console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
};

runMigration()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
