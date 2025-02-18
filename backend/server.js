require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');
const SystemConfig = require('./src/models/SystemConfig');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userSoftwareRoutes = require('./src/routes/userSoftwareRoutes');
const { updateUserSystemConfig } = require('./src/services/userSystemConfigService');
const { addDefaultSoftware } = require('./src/services/installedSoftwareService');
const { scanSystem } = require('./src/services/systemScanService');

const app = express();

// Application constants from environment
const APP_NAME = process.env.APP_NAME || 'Software Center';
const PORT = process.env.PORT || 3007;
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL_PROD 
  : process.env.FRONTEND_URL_DEV;
const MAX_UPLOAD_SIZE = process.env.MAX_UPLOAD_SIZE || '10mb';

console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL,
  PORT
});

// Serve static files from public directory
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// CORS configuration for development
const corsOptions = process.env.NODE_ENV === 'development' 
  ? {
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Type', 'Authorization']
    }
  : {
      origin: FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Type', 'Authorization']
    };

app.use(cors(corsOptions));

// Log CORS configuration
console.log('CORS configuration:', {
  environment: process.env.NODE_ENV,
  origin: corsOptions.origin,
  frontendUrl: FRONTEND_URL
});

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    body: req.body,
    headers: req.headers
  });
  next();
});

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Increase payload size limit for image uploads
app.use('/uploads', express.json({ limit: MAX_UPLOAD_SIZE }));
app.use('/uploads', express.urlencoded({ extended: true, limit: MAX_UPLOAD_SIZE }));

// Add routes
app.use('/auth', require('./src/routes/authRoutes'));
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/user-software', userSoftwareRoutes);

// Start HTTP server
console.log(`Starting ${APP_NAME} server...`);
app.listen(PORT, () => {
  console.log(`${APP_NAME} server running on port ${PORT}`);
});

// MongoDB connection
console.log('Connecting to MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
}).then(async () => {
  console.log('Successfully connected to MongoDB Atlas');
  
  // Create or update test user
  try {
    let testUser = await User.findOne({ email: 'dav@piramal.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test User',
        email: 'dav@piramal.com',
        password: '123456',
        role: 'user'
      });
      await testUser.save();
      console.log('Test user created successfully');
    } else {
      // Update existing user's password
      testUser.password = '123456';
      await testUser.save();
      console.log('Test user password updated');
    }
  } catch (err) {
    console.error('Error managing test user:', err);
  }
}).catch((error) => {
  console.error('MongoDB Atlas connection error:', error);
  process.exit(1);
});

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB Atlas');
});
