require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
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

// Find an available port starting from 3007
const getAvailablePort = async (startPort) => {
  const net = require('net');
  const server = net.createServer();
  
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
      
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      
      server.listen(port);
    };
    
    tryPort(startPort);
  });
};

// Initialize port
let PORT;
(async () => {
  PORT = process.env.PORT || await getAvailablePort(3007);
})();

const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL_PROD 
  : process.env.FRONTEND_URL_DEV;
const MAX_UPLOAD_SIZE = process.env.MAX_UPLOAD_SIZE || '10mb';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Log static file access
app.use((req, res, next) => {
  if (req.url.startsWith('/uploads')) {
    console.log('Static file request:', {
      url: req.url,
      path: path.join(__dirname, 'public', req.url)
    });
  }
  next();
});

// Log static file directories
console.log('Static file directories:', {
  public: path.join(__dirname, 'public'),
  uploads: path.join(__dirname, 'public', 'uploads')
});

// CORS configuration for development
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? '*' : FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Additional CORS headers for SSE
app.use((req, res, next) => {
  if (req.url.includes('/user-software/install-progress')) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
  }
  next();
});

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Handle other errors
  if (err.message.includes('Unexpected token')) {
    return res.status(400).json({ message: 'Invalid request format' });
  }

  res.status(500).json({ message: 'Internal server error' });
});

// Start server and connect to MongoDB
const startServer = async () => {
  try {
    // Get available port
    const port = process.env.PORT || await getAvailablePort(3007);
    
    // Start HTTP server
    console.log(`Starting ${APP_NAME} server...`);
    app.listen(port, () => {
      console.log(`${APP_NAME} server running on port ${port}`);
    });

    // Set up MongoDB event handlers
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB Atlas');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB Atlas');
    });

    // Connect to MongoDB
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
