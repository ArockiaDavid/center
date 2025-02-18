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
    const software = await InstalledSoftware.find({ userId: req.user._id });
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

    // Check if package exists in brew
    try {
      // First try regular brew
      const { stdout: brewStdout } = await execAsync(`brew list ${command} 2>/dev/null`);
      if (brewStdout.trim()) {
        const { stdout: versionOutput } = await execAsync(`brew list --versions ${command}`);
        const version = versionOutput.split(' ')[1] || '1.0.0';
        return res.json({ exists: true, version });
      }

      // Then try brew cask
      const { stdout: caskStdout } = await execAsync(`brew list --cask ${command} 2>/dev/null`);
      if (caskStdout.trim()) {
        const { stdout: versionOutput } = await execAsync(`brew list --cask --versions ${command}`);
        const version = versionOutput.split(' ')[1] || '1.0.0';
        return res.json({ exists: true, version });
      }

      // Not found in brew
      return res.json({ exists: false, version: '1.0.0' });
    } catch (error) {
      console.error('Error checking brew:', error);
      return res.json({ exists: false, version: '1.0.0' });
    }
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
      userId: req.user._id,
      appId
    });

    if (existingSoftware) {
      return res.status(400).json({ message: 'Software already installed' });
    }

    // Check if package exists in brew
    try {
      // First try regular brew
      const { stdout: brewStdout } = await execAsync(`brew list ${appId} 2>/dev/null`);
      if (!brewStdout.trim()) {
        // Then try brew cask
        const { stdout: caskStdout } = await execAsync(`brew list --cask ${appId} 2>/dev/null`);
        if (!caskStdout.trim()) {
          return res.status(404).json({ message: 'Software not found in Homebrew' });
        }
      }
    } catch (error) {
      console.error('Error checking brew:', error);
      return res.status(404).json({ message: 'Error checking Homebrew' });
    }

    const software = new InstalledSoftware({
      userId: req.user._id,
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
    
    try {
      // First check if it's a regular brew package
      const { stdout: brewList } = await execAsync(`brew list ${appId} 2>/dev/null`).catch(() => ({ stdout: '' }));
      if (brewList.trim()) {
        // Get current version
        const { stdout: currentVersionOutput } = await execAsync(`brew list --versions ${appId}`);
        const currentVersion = currentVersionOutput.split(' ')[1] || '1.0.0';

        // Get latest version and check if outdated
        const { stdout: infoOutput } = await execAsync(`brew info ${appId} --json=v2`);
        const info = JSON.parse(infoOutput);
        const latestVersion = info.formulae[0].versions.stable;

        // Check if outdated
        const { stdout: outdatedOutput } = await execAsync(`brew outdated ${appId} 2>/dev/null`).catch(() => ({ stdout: '' }));
        const hasUpdate = Boolean(outdatedOutput.trim());
        
        return res.json({
          hasUpdate,
          currentVersion: currentVersion,
          latestVersion: latestVersion,
          isUpdated: true
        });
      }

      // Then check if it's a cask package
      const { stdout: caskList } = await execAsync(`brew list --cask ${appId} 2>/dev/null`).catch(() => ({ stdout: '' }));
      if (caskList.trim()) {
        // Get current version
        const { stdout: currentVersionOutput } = await execAsync(`brew list --cask --versions ${appId}`);
        const currentVersion = currentVersionOutput.split(' ')[1] || '1.0.0';

        // Get latest version and check if outdated
        const { stdout: infoOutput } = await execAsync(`brew info --cask ${appId} --json=v2`);
        const info = JSON.parse(infoOutput);
        const latestVersion = info.casks[0].version;

        // Check if outdated
        const { stdout: outdatedOutput } = await execAsync(`brew outdated --cask ${appId} 2>/dev/null`).catch(() => ({ stdout: '' }));
        const hasUpdate = Boolean(outdatedOutput.trim());
        
        return res.json({
          hasUpdate,
          currentVersion: currentVersion,
          latestVersion: latestVersion,
          isUpdated: true
        });
      }

      return res.status(404).json({ message: 'Software not found in Homebrew', isUpdated: false });
    } catch (error) {
      console.error('Error checking brew version:', error);
      return res.status(500).json({ message: 'Error checking for updates', error: error.message });
    }
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
      userId: req.user._id,
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

    const software = await InstalledSoftware.find({ userId });
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
      userId: req.user._id,
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
