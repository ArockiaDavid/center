const { exec } = require('child_process');
const SystemConfig = require('../models/SystemConfig');

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

const getOSVersion = async () => {
  try {
    const version = await promiseExec('sw_vers -productVersion');
    return version;
  } catch (error) {
    console.error('Error getting OS version:', error);
    return null;
  }
};

const getAppInfo = async (appPath, brewName) => {
  try {
    let version = null;
    let installedViaBrew = false;

    // Check if installed via brew
    try {
      if (brewName) {
        const brewOutput = await promiseExec(`brew list --cask ${brewName} --versions`);
        if (brewOutput) {
          version = brewOutput.split(' ').pop();
          installedViaBrew = true;
        }
      }
    } catch (brewError) {
      // If brew check fails, try formula
      try {
        const formulaOutput = await promiseExec(`brew list ${brewName} --versions`);
        if (formulaOutput) {
          version = formulaOutput.split(' ').pop();
          installedViaBrew = true;
        }
      } catch (formulaError) {
        // Not installed via brew, try to get version from app bundle
        if (appPath.includes('.app')) {
          try {
            const plistCmd = `/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "${appPath}/Contents/Info.plist"`;
            version = await promiseExec(plistCmd);
          } catch (plistError) {
            console.error(`Error getting version from plist for ${appPath}:`, plistError);
          }
        }
      }
    }

    return {
      path: appPath,
      version,
      installedViaBrew,
      brewName,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`Error getting app info for ${appPath}:`, error);
    return {
      path: appPath,
      version: null,
      installedViaBrew: false,
      brewName,
      lastUpdated: new Date()
    };
  }
};

const updateSystemConfig = async (userId) => {
  try {
    const osVersion = await getOSVersion();
    
    // Define apps to check
    const apps = [
      { name: 'Visual Studio Code', path: '/Applications/Visual Studio Code.app', brewName: 'visual-studio-code' },
      { name: 'Sublime Text', path: '/Applications/Sublime Text.app', brewName: 'sublime-text' },
      { name: 'Node.js', path: '/usr/local/bin/node', brewName: 'node' },
      { name: 'Google Chrome', path: '/Applications/Google Chrome.app', brewName: 'google-chrome' },
      { name: 'Docker', path: '/Applications/Docker.app', brewName: 'docker' },
      { name: 'Postman', path: '/Applications/Postman.app', brewName: 'postman' }
    ];

    const installedApps = [];

    // Check each app
    for (const app of apps) {
      try {
        const exists = await promiseExec(`test -e "${app.path}" && echo "exists"`);
        if (exists === 'exists') {
          const appInfo = await getAppInfo(app.path, app.brewName);
          installedApps.push({
            name: app.name,
            ...appInfo
          });
        }
      } catch (error) {
        console.error(`Error checking ${app.name}:`, error);
      }
    }

    // Update or create system config
    const systemConfig = await SystemConfig.findOneAndUpdate(
      { userId },
      {
        osVersion,
        installedApps,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    return systemConfig;
  } catch (error) {
    console.error('Error updating system config:', error);
    throw error;
  }
};

module.exports = {
  updateSystemConfig
};
