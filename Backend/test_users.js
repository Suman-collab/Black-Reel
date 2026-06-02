import mongoose from 'mongoose';
import User from './src/models/user.model.js';
import { config } from './src/config/index.js';

async function checkUser() {
  await mongoose.connect(config.db.uri);
  const users = await User.find({}, { name: 1, email: 1, 'subscription.planType': 1, 'subscription.status': 1 });
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}
checkUser();
