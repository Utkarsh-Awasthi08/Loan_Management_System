import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

const SEED_USERS = [
  { name: 'Admin User',        email: 'admin@lms.com',        password: 'Admin@123',        role: 'ADMIN' },
  { name: 'Sales Executive',   email: 'sales@lms.com',        password: 'Sales@123',        role: 'SALES' },
  { name: 'Sanction Officer',  email: 'sanction@lms.com',     password: 'Sanction@123',     role: 'SANCTION' },
  { name: 'Disburse Agent',    email: 'disbursement@lms.com', password: 'Disburse@123',     role: 'DISBURSEMENT' },
  { name: 'Collection Agent',  email: 'collection@lms.com',   password: 'Collect@123',      role: 'COLLECTION' },
  { name: 'Demo Borrower',     email: 'borrower@lms.com',     password: 'Borrower@123',     role: 'BORROWER' },
] as const;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  for (const userData of SEED_USERS) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⚠️  Skipping ${userData.email} — already exists`);
      continue;
    }
    await User.create(userData);
    console.log(`✅ Created ${userData.role}: ${userData.email} / ${userData.password}`);
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('━'.repeat(55));
  console.log(' ROLE          | EMAIL                  | PASSWORD');
  console.log('━'.repeat(55));
  SEED_USERS.forEach(u => {
    console.log(` ${u.role.padEnd(14)}| ${u.email.padEnd(23)}| ${u.password}`);
  });
  console.log('━'.repeat(55));

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
