const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const InstalledSoftware = require('../models/InstalledSoftware');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { scanInstalledSoftware } = require('../services/softwareScanService');
const { devSoftwareList } = require('../config/software');
const fs = require('fs').promises;

// Package name mapping for Homebrew
const packageMapping = {
  'postman': 'postman-agent',
  'visual-studio-code': 'visual-studio-code',
  'pycharm-ce': 'pycharm-ce',
  'python': 'python@3.11',
  'anaconda': 'anaconda',
  'intellij-idea-ce': 'intellij-idea-ce',
  'git': 'git',
  'github': 'github-desktop',
  'jira': 'go-jira',
  'confluence': 'confluence',
  'java': 'openjdk@17',
  'power-bi': 'microsoft-power-bi',
  'snowflake-snowsql': 'snowflake-snowsql',
  'swagger-editor': 'swagger-editor',
  'spyder': 'spyder-ide',
  'eclipse-ide': 'eclipse-java',
  'figma': 'figma',
  'docker': 'docker',
  'node': 'node@18',
  'npm': 'npm',
  'nvm': 'nvm',
  'tomcat': 'tomcat@9',
  'awscli': 'awscli',
  'jenkins': 'jenkins-lts',
  'ansible': 'ansible',
  'grafana': 'grafana',
  'jupyter': 'jupyter',
  'r': 'r',
  'rstudio': 'rstudio',
  'mobaxterm': 'mobaxterm',
  'studio-3t': 'studio-3t',
  'visual-studio': 'visual-studio',
  'sublime-text': 'sublime-text',
  'webstorm': 'webstorm',
  'dbeaver-community': 'dbeaver-community'
};

// Get all available software
const getAvailableSoftware = async () => {
  try {
    // Return the predefined list of software
    return devSoftwareList.map(software => ({
      ...software,
      id: software.id, // Ensure id is explicitly set
      category: 'Development',
      isCask: software.isCask !== false, // Default to true unless explicitly set to false
      version: '1.0.0',
      isInstalled: false // Default to not installed
    }));
  } catch (error) {
    console.error('Error getting available software:', error);
    return [];
  }
};

// Get all software (both available and installed)
router.get('/', auth, async (req, res) => {
  try {
    // Get installed software
    const installedSoftware = await InstalledSoftware.find({ userId: req.user._id });
    const installedIds = installedSoftware.map(s => s.appId);

    // Get available software
    const availableSoftware = await getAvailableSoftware();

    // Combine the lists
    const software = availableSoftware.map(s => ({
      ...s,
      id: s.id, // Ensure id is set
      appId: s.id, // Set appId to match id
      isInstalled: installedIds.includes(s.id),
      version: installedSoftware.find(i => i.appId === s.id)?.version || '1.0.0',
      isCask: s.isCask !== false // Default to true unless explicitly false
    }));

    console.log('Sending software list:', software);
    res.json(software);
  } catch (error) {
    console.error('Error fetching software:', error);
    res.status(500).json({ message: 'Error fetching software' });
  }
});

// Installation progress endpoint (SSE)
router.get('/install-progress', async (req, res) => {
  let pingInterval;
  try {
    const token = req.query.token;
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    req.user = user;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('X-Accel-Buffering', 'no');
    res.status(200);

    // Initialize connection
    const userId = req.user._id.toString();

    console.log('Setting up SSE connection for user:', userId);
    
    // Send initial connection established message
    const initialMessage = JSON.stringify({ type: 'connected' });
    console.log('Sending initial SSE message:', initialMessage);
    res.write(`data: ${initialMessage}\n\n`);

    // Initialize or clear global streams map
    if (!global.installProgressStreams) {
      console.log('Initializing global SSE streams map');
      global.installProgressStreams = new Map();
    }

    // Clean up any existing connection
    if (global.installProgressStreams.has(userId)) {
      console.log('Cleaning up existing SSE connection for user:', userId);
      const oldConnection = global.installProgressStreams.get(userId);
      oldConnection.end();
      global.installProgressStreams.delete(userId);
    }

    console.log('Storing new SSE connection for user:', userId);
    global.installProgressStreams.set(userId, res);

    // Send ping every 30 seconds to keep connection alive
    pingInterval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(pingInterval);
        return;
      }
      res.write(': ping\n\n');
    }, 10000); // Send ping every 10 seconds to keep connection alive

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(pingInterval);
      global.installProgressStreams.delete(userId);
      res.end();
    });

    // Handle errors
    res.on('error', (error) => {
      console.error('SSE Response error:', error);
      clearInterval(pingInterval);
      global.installProgressStreams.delete(userId);
      res.end();
    });

  } catch (error) {
    console.error('Error setting up SSE:', error);
    if (pingInterval) {
      clearInterval(pingInterval);
    }
    if (global.installProgressStreams) {
      global.installProgressStreams.delete(req.user?._id.toString());
    }
    res.end();
  }
});

// Helper function to send progress updates
const sendProgress = (userId, data) => {
  try {
    console.log('Attempting to send progress update:', { userId, data });
    
    const res = global.installProgressStreams.get(userId);
    if (!res) {
      console.log('No SSE connection found for user:', userId);
      return;
    }
    
    if (!res.writableEnded) {
      console.log('Sending SSE message:', data);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } else {
      console.log('SSE connection ended for user:', userId);
      // Clean up dead connection
      global.installProgressStreams.delete(userId);
    }
  } catch (error) {
    console.error('Error sending progress update:', error);
    // Clean up on error
    if (global.installProgressStreams) {
      const res = global.installProgressStreams.get(userId);
      if (res) {
        console.log('Closing errored SSE connection for user:', userId);
        res.end();
      }
      global.installProgressStreams.delete(userId);
    }
  }
};

// Check if a command exists on the system
router.post('/check-command', auth, async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ message: 'Command is required' });
    }

    // Get actual package name
    const packageName = packageMapping[command] || command;

    // Find software in our list
    const software = devSoftwareList.find(s => s.id === command);
    if (!software) {
      return res.json({ exists: false, version: '1.0.0', isCask: true });
    }

    // Get package type
    const isCask = software.isCask !== false; // Default to true unless explicitly false

    try {
      // First check if package exists in Homebrew
      const searchCommand = isCask ? 
        `brew search --casks ${packageName}` : 
        `brew search ${packageName}`;
      
      console.log('Checking package existence:', searchCommand);
      const { stdout: searchOutput } = await execAsync(searchCommand);
      console.log('Search output:', searchOutput);

      // Get exact package name from search results
      const exactPackage = searchOutput.split('\n')
        .map(line => line.trim())
        .find(line => line === packageName);

      if (!exactPackage) {
        console.log('Package not found in search results');
        return res.json({ exists: false, version: '1.0.0', isCask });
      }
      console.log('Found package:', exactPackage);

      // Then check if it's installed
      const listCommand = isCask ?
        `brew list --cask --versions ${exactPackage}` :
        `brew list --versions ${exactPackage}`;
      
      try {
        console.log('Checking installation:', listCommand);
        const { stdout: versionOutput } = await execAsync(listCommand);
        console.log('Version output:', versionOutput);
        const version = versionOutput ? versionOutput.split(' ')[1] || '1.0.0' : '1.0.0';
        return res.json({ exists: true, version, isCask });
      } catch (error) {
        // Package exists but not installed
        console.log('Package exists but not installed');
        return res.json({ exists: true, version: '1.0.0', isCask });
      }
    } catch (error) {
      console.error('Error checking package:', error);
      return res.json({ exists: false, version: '1.0.0', isCask: true });
    }
  } catch (error) {
    console.error('Error checking command:', error);
    res.status(500).json({ message: 'Error checking command' });
  }
});

// Check for software updates
router.get('/:appId/updates', auth, async (req, res) => {
  try {
    const { appId } = req.params;

    // Find software in our list
    const software = devSoftwareList.find(s => s.id === appId);
    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }

    // Get actual package name
    const packageName = packageMapping[appId] || appId;

    // Get package type
    const isCask = software.isCask !== false;

    // Check current version
    const versionCommand = isCask ?
      `brew list --cask --versions ${packageName}` :
      `brew list --versions ${packageName}`;

    try {
      const { stdout: currentVersion } = await execAsync(versionCommand);
      if (!currentVersion) {
        return res.json({ hasUpdate: false });
      }

      // Check for updates
      const updateCommand = isCask ?
        `brew outdated --cask ${packageName}` :
        `brew outdated ${packageName}`;

      const { stdout: updateCheck } = await execAsync(updateCommand);
      const hasUpdate = updateCheck.includes(packageName);

      return res.json({ hasUpdate });
    } catch (error) {
      console.error('Error checking for updates:', error);
      return res.json({ hasUpdate: false });
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({ message: 'Error checking for updates' });
  }
});

// Scan for installed software
router.post('/scan', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get installed software from database
    const installedSoftware = await InstalledSoftware.find({ userId });
    const installedIds = installedSoftware.map(s => s.appId);

    // Get actual package names
    const installedPackages = installedIds.map(id => ({
      id,
      packageName: packageMapping[id] || id,
      isCask: devSoftwareList.find(s => s.id === id)?.isCask !== false
    }));

    // Check each installed package
    const results = await Promise.all(installedPackages.map(async ({ id, packageName, isCask }) => {
      try {
        const versionCommand = isCask ?
          `brew list --cask --versions ${packageName}` :
          `brew list --versions ${packageName}`;
        
        const { stdout } = await execAsync(versionCommand);
        const version = stdout.split(' ')[1] || '1.0.0';

        // Update version in database
        await InstalledSoftware.findOneAndUpdate(
          { userId, appId: id },
          { 
            version,
            lastUpdateCheck: new Date()
          }
        );

        return {
          appId: id,
          version,
          isInstalled: true
        };
      } catch (error) {
        console.log(`Error checking ${packageName}:`, error.message);
        return {
          appId: id,
          isInstalled: false
        };
      }
    }));

    res.json({ results });
  } catch (error) {
    console.error('Error scanning software:', error);
    res.status(500).json({ message: 'Error scanning software' });
  }
});

// Install new software
router.post('/', auth, async (req, res) => {
  try {
    console.log('Installation request received:', req.body);
    const { appId, name, isCask } = req.body;
    console.log('Installing software:', { appId, name, isCask });

    // Verify Homebrew is installed
    try {
      await execAsync('which brew');
    } catch (error) {
      console.error('Homebrew not installed:', error);
      sendProgress(req.user._id.toString(), {
        type: 'error',
        message: 'Homebrew is not installed. Please install Homebrew first.'
      });
      return res.status(500).json({ 
        message: 'Homebrew is not installed. Please install Homebrew first.'
      });
    }

    // For cask applications, verify Applications folder
    if (isCask) {
      try {
        await fs.access('/Applications', fs.constants.W_OK);
      } catch (error) {
        console.error('Applications folder not writable:', error);
        sendProgress(req.user._id.toString(), {
          type: 'error',
          message: 'Insufficient permissions for /Applications folder. Please ensure you have write access.'
        });
        return res.status(500).json({ 
          message: 'Insufficient permissions for /Applications folder. Please ensure you have write access.'
        });
      }
    }

    // Find software in our list
    const software = devSoftwareList.find(s => s.id === appId);
    if (!software) {
      sendProgress(req.user._id.toString(), {
        type: 'error',
        message: 'Software not found in catalog'
      });
      return res.status(404).json({ message: 'Software not found in catalog' });
    }

    // Get package type and name
    const actualIsCask = software.isCask !== false; // Default to true unless explicitly false
    if (actualIsCask !== isCask) {
      sendProgress(req.user._id.toString(), {
        type: 'error',
        message: 'Invalid package type'
      });
      return res.status(400).json({ message: 'Invalid package type' });
    }

    // Get actual package name
    const packageName = packageMapping[appId] || appId;

    // Send initial progress
    sendProgress(req.user._id.toString(), {
      type: 'progress',
      progress: 10,
      status: 'Checking package...',
      details: 'Verifying package in Homebrew'
    });

    // First verify package exists in Homebrew
    try {
      const searchCommand = isCask ? 
        `brew search --casks ${packageName}` : 
        `brew search ${packageName}`;
      
      console.log('Checking package in Homebrew:', searchCommand);
      const { stdout: searchOutput } = await execAsync(searchCommand);
      
      if (!searchOutput.includes(packageName)) {
        sendProgress(req.user._id.toString(), {
          type: 'error',
          message: 'Software not found in Homebrew'
        });
        return res.status(404).json({ message: 'Software not found in Homebrew' });
      }

      // Send download progress
      sendProgress(req.user._id.toString(), {
        type: 'progress',
        progress: 30,
        status: 'Downloading...',
        details: `Downloading ${name}`
      });

      // For Figma, try upgrading first
      if (isCask && appId === 'figma') {
        try {
          // Try to upgrade first
          await execAsync(`brew upgrade --cask ${packageName}`);
          console.log('Figma upgrade completed');
        } catch (error) {
          console.log('Figma upgrade error (expected):', error.message);
          // If upgrade fails, do a fresh install
          try {
            await execAsync(`brew uninstall --cask ${packageName}`);
          } catch (error) {
            console.log('Uninstall error (expected):', error.message);
          }
        }
      } else if (isCask) {
        try {
          await execAsync(`brew uninstall --cask ${packageName}`);
        } catch (error) {
          console.log('Uninstall error (expected):', error.message);
        }
      }

      // Install package
      const installCommand = isCask ? 
        `brew install --cask ${packageName}` : 
        `brew install ${packageName}`;
      
      console.log('Installing package:', installCommand);
      const { stdout, stderr } = await execAsync(installCommand);
      console.log('Installation output:', stdout);

      if (stderr) {
        if (stderr.toLowerCase().includes('already installed') || stderr.toLowerCase().includes('not upgrading')) {
          // Get installed version
          const versionCommand = isCask ?
            `brew list --cask --versions ${packageName}` :
            `brew list --versions ${packageName}`;
          
          const { stdout: versionOutput } = await execAsync(versionCommand);
          const version = versionOutput.split(' ')[1] || '1.0.0';

          // Save to database as installed
          const installedSoftware = new InstalledSoftware({
            userId: req.user._id,
            userEmail: req.user.email,
            userName: req.user.name,
            appId,
            name,
            version,
            isCask,
            status: 'installed',
            installDate: new Date(),
            lastUpdateCheck: new Date()
          });

          await installedSoftware.save();

          // Send completion progress
          sendProgress(req.user._id.toString(), {
            type: 'progress',
            progress: 100,
            status: 'Complete',
            details: 'Software is already installed'
          });

          // Send completion message
          sendProgress(req.user._id.toString(), {
            type: 'complete'
          });

          return res.status(201).json(installedSoftware);
        } else if (!stderr.includes('It is not recommended')) {
          throw new Error(stderr);
        }
      }

      // Send installation progress
      sendProgress(req.user._id.toString(), {
        type: 'progress',
        progress: 70,
        status: 'Installing...',
        details: `Installing ${name}`
      });

      // For cask apps, verify installation
      if (isCask) {
        // Wait for app to be copied
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
          // For Figma, check in both Applications and user's Applications folder
          const appName = name.replace(/\s+/g, '');
          try {
            const { stdout: appCheck } = await execAsync(`ls -l "/Applications/${appName}.app" 2>/dev/null || ls -l "/Applications/${name}.app" 2>/dev/null || ls -l "$HOME/Applications/${appName}.app" 2>/dev/null || ls -l "$HOME/Applications/${name}.app" 2>/dev/null`);
            if (!appCheck) {
              throw new Error('Application not found in Applications folder');
            }
          } catch (error) {
            // If app is not found, but brew says it's installed, we'll trust brew
            const { stdout: brewCheck } = await execAsync(`brew list --cask ${packageName}`);
            if (!brewCheck) {
              throw new Error('Application not found in Applications folder');
            }
          }
        } catch (error) {
          sendProgress(req.user._id.toString(), {
            type: 'error',
            message: 'Installation failed: Application not found in Applications folder'
          });
          throw new Error('Application not found in Applications folder');
        }
      }

      // Get installed version
      const versionCommand = isCask ?
        `brew list --cask --versions ${packageName}` :
        `brew list --versions ${packageName}`;
      
      const { stdout: versionOutput } = await execAsync(versionCommand);
      const version = versionOutput.split(' ')[1] || '1.0.0';

      // Save to database
      const installedSoftware = new InstalledSoftware({
        userId: req.user._id,
        userEmail: req.user.email,
        userName: req.user.name,
        appId,
        name,
        version,
        isCask,
        status: 'installed',
        installDate: new Date(),
        lastUpdateCheck: new Date()
      });

      await installedSoftware.save();

      // Send completion progress and close SSE connection
      const userId = req.user._id.toString();
      sendProgress(userId, {
        type: 'progress',
        progress: 100,
        status: 'Complete',
        details: 'Installation completed successfully'
      });

      // Wait a moment for the progress update to be sent
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send completion message and close connection
      const sseConnection = global.installProgressStreams.get(userId);
      if (sseConnection && !sseConnection.writableEnded) {
        sendProgress(userId, {
          type: 'complete'
        });
        sseConnection.end();
        global.installProgressStreams.delete(userId);
      }

      // Send response
      res.status(201).json(installedSoftware);
    } catch (error) {
      console.error('Installation error:', error);
      sendProgress(req.user._id.toString(), {
        type: 'error',
        message: `Installation failed: ${error.message}`
      });
      res.status(500).json({ message: `Installation failed: ${error.message}` });
    }
  } catch (error) {
    console.error('Error installing software:', error);
    sendProgress(req.user._id.toString(), {
      type: 'error',
      message: `Error installing software: ${error.message}`
    });
    res.status(500).json({ message: 'Error installing software' });
  }
});

module.exports = router;
