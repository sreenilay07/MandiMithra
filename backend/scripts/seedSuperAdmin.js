const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const seedSuperAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mandimithra';
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    // Check if any SUPER_ADMIN already exists
    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      console.log(`[SEED] Super Admin already exists: ${existingSuperAdmin.fullName} (${existingSuperAdmin.email || existingSuperAdmin.phoneNumber}). Skipping creation.`);
      await mongoose.connection.close();
      process.exit(0);
    }

    const name = process.env.SUPER_ADMIN_NAME || 'Super Administrator';
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@mandimithra.gov.in';
    const phone = process.env.SUPER_ADMIN_PHONE || '9999900000';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123456';

    console.log(`[SEED] Seeding Super Admin account for '${name}' (${email})...`);

    const superAdminUser = new User({
      fullName: name,
      email: email.toLowerCase(),
      phoneNumber: phone,
      password: password, // Pre-save hook in User model will hash password securely
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      isPhoneVerified: true
    });

    await superAdminUser.save();

    console.log('[SEED] Super Admin account created successfully with status APPROVED.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[SEED ERROR] Failed to seed Super Admin: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedSuperAdmin();
