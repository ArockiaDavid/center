const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', { 
      email: req.body?.email,
      role: req.body?.role,
      hasPassword: !!req.body?.password,
      body: req.body,
      headers: req.headers
    });

    if (!req.body?.email || !req.body?.password) {
      console.log('Missing credentials');
      return res.status(400).json({ 
        message: 'Email and password are required',
        details: {
          email: !req.body?.email ? 'Email is required' : null,
          password: !req.body?.password ? 'Password is required' : null
        }
      });
    }

    const { email, password, role } = req.body;
    console.log('Finding user with:', { email, role });

    // Validate email format
    if (!email.endsWith('@piramal.com')) {
      return res.status(400).json({
        message: 'Invalid email format',
        details: {
          email: 'Only @piramal.com email addresses are allowed'
        }
      });
    }
    
    console.log('Attempting to find user in database with:', { email, role });
    let user;
    
    try {
      // For user login, allow both 'user' and undefined roles for backward compatibility
      if (role === 'user') {
        user = await User.findOne({ 
          email, 
          $or: [{ role: 'user' }, { role: { $exists: false } }]
        });
        console.log('User search result:', user ? 'Found user' : 'No user found');
      } else {
        user = await User.findOne({ email, role });
        console.log('Admin search result:', user ? 'Found admin' : 'No admin found');
      }
    } catch (dbError) {
      console.error('Database error while finding user:', dbError);
      throw dbError;
    }
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ 
        message: `No ${role} account found with this email`,
        details: {
          email: `No ${role} account exists with email ${email}`
        }
      });
    }

    console.log('User found, comparing password');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        details: {
          password: 'The provided password is incorrect'
        }
      });
    }

    console.log('Generating JWT token for user:', { userId: user._id });
    // Generate JWT token with complete user info
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role || 'user',
      name: user.name,
      createdAt: user.createdAt,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'software-center-jwt-secret-key-2024',
      { 
        expiresIn: process.env.JWT_EXPIRY || '1h',
        algorithm: 'HS256'
      }
    );

    console.log('Generated token with payload:', {
      ...tokenPayload,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
    });
    console.log('JWT token generated successfully');

    // Get full user data
    console.log('Fetching full user data for ID:', user._id);
    let userData;
    try {
      userData = await User.findById(user._id)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .lean();
      console.log('Full user data fetched:', {
        id: userData._id,
        email: userData.email,
        role: userData.role
      });
    } catch (dbError) {
      console.error('Database error while fetching user data:', dbError);
      throw dbError;
    }
    
    // Ensure user has a role
    if (!userData.role) {
      userData.role = 'user';
      await User.findByIdAndUpdate(user._id, { role: 'user' });
    }
    
    console.log('User data fetched:', userData);
      
    const BASE_URL = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_API_URL_PROD 
      : process.env.REACT_APP_API_URL_DEV;

    // Prepare response with full user data
    const responseData = {
      token,
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar ? `${BASE_URL}${userData.avatar}` : null,
        role: userData.role,
        createdAt: userData.createdAt
      }
    };
    
    console.log('Sending login response:', {
      ...responseData,
      token: `${responseData.token.substring(0, 20)}...`
    });
    res.json(responseData);
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ message: `No ${role} account found with this email` });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

module.exports = router;
