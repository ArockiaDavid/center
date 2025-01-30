const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const InstalledSoftware = require('../models/InstalledSoftware');

// Update user profile (no admin check required)
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Profile update request:', req.body);
    const { name, email, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (avatar) {
      user.avatar = `data:image/jpeg;base64,${avatar}`;
    }

    await user.save();
    console.log('Profile updated successfully:', user.email);

    // Return user without sensitive data
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;

    // Format the response to match the frontend expectations
    res.json({
      ...userObject,
      avatar: userObject.avatar || null
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find({}, '-password -resetPasswordToken -resetPasswordExpires');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id, '-password -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get system config
    console.log('Fetching system config for user:', user._id);
    const systemConfig = await SystemConfig.findOne({ userId: user._id });
    console.log('Found system config:', systemConfig);

    // If no system config found by userId, try by email
    let finalSystemConfig = systemConfig;
    if (!systemConfig) {
      console.log('Trying to find system config by email:', user.email);
      finalSystemConfig = await SystemConfig.findOne({ userEmail: user.email });
      console.log('Found system config by email:', finalSystemConfig);

      // If found by email, update the userId
      if (finalSystemConfig && !finalSystemConfig.userId) {
        finalSystemConfig.userId = user._id;
        await finalSystemConfig.save();
      }
    }

    // Get installed software
    console.log('Fetching installed software for user:', user._id);
    let installedSoftware = await InstalledSoftware.find({ userId: user._id });
    console.log('Found installed software by userId:', installedSoftware);

    // If no installed software found by userId, try by email
    if (!installedSoftware || installedSoftware.length === 0) {
      console.log('Trying to find installed software by email:', user.email);
      installedSoftware = await InstalledSoftware.find({ userEmail: user.email });
      console.log('Found installed software by email:', installedSoftware);

      // Update userId for found software
      if (installedSoftware && installedSoftware.length > 0) {
        await Promise.all(installedSoftware.map(async (software) => {
          if (!software.userId) {
            software.userId = user._id;
            await software.save();
          }
        }));
      }
    }

    // Combine the data
    const userObject = user.toObject();
    res.json({
      ...userObject,
      systemConfig: finalSystemConfig || null,
      installedSoftware: installedSoftware || []
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    await user.save();

    // Return user without sensitive data
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;

    res.json(userObject);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;
