import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './src/models/user.model.js';
import db from './src/config/database.js';

async function run() {
  try {
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/blackreel';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    
    const email = 'sumanpanda10380@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User Profile found:', { name: user.name, email: user.email });
    console.log('User Subscription:', user.subscription);
    console.log('Devices registered count:', user.devices.length);
    console.log('Devices detail:');
    user.devices.forEach((d, idx) => {
      console.log(`\nDevice [${idx + 1}]:`);
      console.log('  ID:          ', d._id);
      console.log('  Name:        ', d.name);
      console.log('  Browser:     ', d.browser);
      console.log('  OS:          ', d.os);
      console.log('  Type:        ', d.type);
      console.log('  Fingerprint: ', d.deviceFingerprint);
      console.log('  Location/IP: ', d.location);
      console.log('  Last IP:     ', d.lastIP);
      console.log('  UserAgent:   ', d.userAgent);
      console.log('  Current:     ', d.current);
      console.log('  LastActiveAt:', d.lastActiveAt);
      console.log('  LastActive:  ', d.lastActive);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
