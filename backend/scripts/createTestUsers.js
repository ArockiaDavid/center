const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const createTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create test admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'adm@piramal.com',
      password: '123456',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Admin user created:', adminUser.email);

    // Create test regular user
    const regularUser = new User({
      name: 'Test User',
      email: 'test@piramal.com',
      password: '123456',
      role: 'user'
    });
    await regularUser.save();
    console.log('Regular user created:', regularUser.email);

    console.log('Test users created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers();
