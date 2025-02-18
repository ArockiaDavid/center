const { exec } = require('child_process');
const InstalledSoftware = require('../models/InstalledSoftware');
const User = require('../models/User');

const promiseExec = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

const appConfig = {
  'visual-studio-code': {
    brewName: 'visual-studio-code',
    appPath: '/Applications/Visual Studio Code.app'
  },
  'sublime-text': {
    brewName: 'sublime-text',
    appPath: '/Applications/Sublime Text.app'
  },
  'node': {
    brewName: 'node',
    appPath: '/usr/local/bin/node'
  },
  'firefox': {
    brewName: 'firefox',
    appPath: '/Applications/Firefox.app'
  },
  'google-chrome': {
    brewName: 'google-chrome',
    appPath: '/Applications/Google Chrome.app'
  },
  'spotify': {
    brewName: 'spotify',
    appPath: '/Applications/Spotify.app'
  },
  'slack': {
    brewName: 'slack',
    appPath: '/Applications/Slack.app'
  },
  'docker': {
    brewName: 'docker',
    appPath: '/Applications/Docker.app'
  },
  'postman': {
    brewName: 'postman',
    appPath: '/Applications/Postman.app'
  }
};

const checkAppInstalled = async (appId) => {
  const brewName = appConfig[appId]?.brewName;
  if (!brewName) {
    return false;
  }

  try {
    // First try checking with brew list
    const { stdout } = await promiseExec(`brew list ${brewName} 2>/dev/null`);
    if (stdout.trim()) {
      return true;
    }

    // If not found in brew list, check brew cask list
    const { stdout: caskStdout } = await promiseExec(`brew list --cask ${brewName} 2>/dev/null`);
    return Boolean(caskStdout.trim());
  } catch (error) {
    return false;
  }
};

const scanInstalledSoftware = async (userId) => {
  try {
    // Get user details first
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check each configured application
    const installedApps = [];
    for (const [appId, config] of Object.entries(appConfig)) {
      const isInstalled = await checkAppInstalled(appId);
      if (isInstalled) {
        installedApps.push({
          appId,
          brewName: config.brewName
        });
      }
    }

    // Get versions for installed apps
    for (const app of installedApps) {
      try {
        // Try getting version from brew cask first
        const { stdout: caskVersion } = await promiseExec(`brew list --cask --versions ${app.brewName} 2>/dev/null`).catch(() => ({ stdout: '' }));
        if (caskVersion.trim()) {
          app.version = caskVersion.split(' ')[1] || '1.0.0';
          continue;
        }

        // If not a cask, try regular brew
        const { stdout: brewVersion } = await promiseExec(`brew list --versions ${app.brewName} 2>/dev/null`).catch(() => ({ stdout: '' }));
        app.version = brewVersion.split(' ')[1] || '1.0.0';
      } catch (error) {
        console.error(`Error getting version for ${app.brewName}:`, error);
        app.version = '1.0.0';
      }
    }

    // Update database for each installed software
    for (const app of installedApps) {
      let software = await InstalledSoftware.findOne({
        userId: userId,
        appId: app.appId
      });

      if (software) {
        // Update existing record
        software.version = app.version;
        software.lastUpdateCheck = new Date();
        software.status = 'installed';
        software.userName = user.name;
        software.userEmail = user.email;
      } else {
        // Create new record
        software = new InstalledSoftware({
          userId: userId,
          userName: user.name,
          userEmail: user.email,
          appId: app.appId,
          name: app.brewName,
          version: app.version,
          status: 'installed',
          installDate: new Date(),
          lastUpdateCheck: new Date()
        });
      }

      await software.save();
      console.log(`Saved software record for ${app.brewName}`);
    }

    // Remove records for uninstalled software
    const installedAppIds = installedApps.map(app => app.appId);
    await InstalledSoftware.deleteMany({
      userId: userId,
      appId: { $nin: installedAppIds }
    });
    console.log('Cleaned up uninstalled software records');

    return true;
  } catch (error) {
    console.error('Error scanning installed software:', error);
    return false;
  }
};

module.exports = {
  scanInstalledSoftware
};
