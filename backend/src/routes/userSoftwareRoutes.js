const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const InstalledSoftware = require('../models/InstalledSoftware');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { scanInstalledSoftware } = require('../services/softwareScanService');

// Get installed software for current user
router.get('/', auth, async (req, res) => {
  try {
    const software = await InstalledSoftware.find({ user: req.user._id });
    res.json(software);
  } catch (error) {
    console.error('Error fetching installed software:', error);
    res.status(500).json({ message: 'Error fetching installed software' });
  }
});

// Trigger software scan for current user
router.post('/scan', auth, async (req, res) => {
  try {
    const success = await scanInstalledSoftware(req.user._id);
    if (success) {
      res.json({ message: 'Software scan completed successfully' });
    } else {
      res.status(500).json({ message: 'Software scan failed' });
    }
  } catch (error) {
    console.error('Error during software scan:', error);
    res.status(500).json({ message: 'Error during software scan' });
  }
});

// Check if a command exists on the system
router.post('/check-command', auth, async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ message: 'Command is required' });
    }

    // Use 'which' command to check if the command exists
    const { stdout } = await execAsync(`which ${command}`).catch(() => ({ stdout: '' }));
    const exists = Boolean(stdout.trim());

    // If command exists, try to get its version
    let version = '1.0.0';
    if (exists) {
      try {
        const { stdout: versionOutput } = await execAsync(`${command} --version`);
        const versionMatch = versionOutput.match(/\d+\.\d+\.\d+/);
        if (versionMatch) {
          version = versionMatch[0];
        }
      } catch (error) {
        console.error('Error getting version:', error);
      }
    }

    res.json({ exists, version });
  } catch (error) {
    console.error('Error checking command:', error);
    res.status(500).json({ message: 'Error checking command' });
  }
});

// Install new software
router.post('/', auth, async (req, res) => {
  try {
    const { appId, name, version } = req.body;

    // Check if software is already installed
    const existingSoftware = await InstalledSoftware.findOne({
      user: req.user._id,
      appId
    });

    if (existingSoftware) {
      return res.status(400).json({ message: 'Software already installed' });
    }

    // Check if the command exists on the system
    const { stdout } = await execAsync(`which ${appId}`).catch(() => ({ stdout: '' }));
    const isInstalled = Boolean(stdout.trim());

    if (!isInstalled) {
      return res.status(404).json({ message: 'Software not found on system' });
    }

    const software = new InstalledSoftware({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      appId,
      name,
      version,
      status: 'installed',
      installDate: new Date(),
      lastUpdateCheck: new Date()
    });

    await software.save();
    res.status(201).json(software);
  } catch (error) {
    console.error('Error installing software:', error);
    res.status(500).json({ message: 'Error installing software' });
  }
});

// Check for updates
router.get('/:appId/updates', auth, async (req, res) => {
  try {
    const { appId } = req.params;
    const software = await InstalledSoftware.findOne({
      user: req.user._id,
      appId
    });

    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }

    // Check if the command exists and get its version
    const { stdout } = await execAsync(`which ${appId}`).catch(() => ({ stdout: '' }));
    if (!stdout.trim()) {
      return res.status(404).json({ message: 'Software not found on system' });
    }

    // Get current version from system
    const { stdout: versionOutput } = await execAsync(`${appId} --version`).catch(() => ({ stdout: '1.0.0' }));
    const versionMatch = versionOutput.match(/\d+\.\d+\.\d+/);
    const currentVersion = versionMatch ? versionMatch[0] : '1.0.0';

    // Update last check time
    software.lastUpdateCheck = new Date();
    await software.save();

    res.json({
      hasUpdate: currentVersion !== software.version,
      currentVersion: software.version,
      latestVersion: currentVersion
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({ message: 'Error checking for updates' });
  }
});

// Update software
router.put('/:appId', auth, async (req, res) => {
  try {
    const { appId } = req.params;
    const { version } = req.body;

    const software = await InstalledSoftware.findOne({
      user: req.user._id,
      appId
    });

    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }

    software.version = version;
    software.lastUpdateCheck = new Date();
    await software.save();

    res.json(software);
  } catch (error) {
    console.error('Error updating software:', error);
    res.status(500).json({ message: 'Error updating software' });
  }
});

// Get installed software for specific user (admin only)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const software = await InstalledSoftware.find({ user: userId });
    res.json(software);
  } catch (error) {
    console.error('Error fetching installed software:', error);
    res.status(500).json({ message: 'Error fetching installed software' });
  }
});

// Delete installed software
router.delete('/:appId', auth, async (req, res) => {
  try {
    const { appId } = req.params;
    const software = await InstalledSoftware.findOne({
      user: req.user._id,
      appId
    });

    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }

    await InstalledSoftware.findByIdAndDelete(software._id);
    res.json({ message: 'Software uninstalled successfully' });
  } catch (error) {
    console.error('Error uninstalling software:', error);
    res.status(500).json({ message: 'Error uninstalling software' });
  }
});

module.exports = router;
