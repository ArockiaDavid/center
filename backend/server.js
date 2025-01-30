require('dotenv').config();
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
const PORT = process.env.BACKEND_PORT || 3007;
const FRONTEND_URL = `http://localhost:${process.env.FRONTEND_PORT || 3004}`;
const MAX_UPLOAD_SIZE = process.env.MAX_UPLOAD_SIZE || '10mb';

// Serve static files from public directory
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// CORS configuration
app.use(cors({
  origin: [
    FRONTEND_URL, 
    'http://localhost:3000', 
    'http://localhost:3002', 
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3008',
    'http://localhost:3009'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload size limit for image uploads
app.use(express.json({ limit: MAX_UPLOAD_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_UPLOAD_SIZE }));

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
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
}).then(() => {
  console.log('Successfully connected to MongoDB Atlas');
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
