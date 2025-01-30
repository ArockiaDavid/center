const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    if (!req.body?.email || !req.body?.password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role }); // Check both email and role

    if (!user) {
      return res.status(404).json({ message: `No ${role} account found with this email` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.SESSION_TIMEOUT || '24h' }
    );

    // Get full user data
    const userData = await User.findById(user._id).select('-password -resetPasswordToken -resetPasswordExpires');
      
    res.json({
      token,
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar ? `http://localhost:3007${userData.avatar}` : null,
        role: userData.role
      }
    });
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
