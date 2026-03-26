import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI/MONGODB_URI not set in environment');
  process.exit(1);
}
await mongoose.connect(MONGO_URI);
console.log('MongoDB connected');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'prabhuchennimalaikd.23aim@kongu.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

let user = await User.findOne({ email: ADMIN_EMAIL });

if (user) {
  user.isAdmin = true;
  user.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await user.save();
  console.log('Updated existing user → isAdmin: true, password updated');
} else {
  await User.create({
    name: 'Admin',
    email: ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    isAdmin: true,
  });
  console.log('Created new admin user');
}

await mongoose.disconnect();
process.exit(0);
