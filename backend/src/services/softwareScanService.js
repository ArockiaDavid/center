const { exec } = require('child_process');
const InstalledSoftware = require('../models/InstalledSoftware');
const User = require('../models/User');
const { devSoftwareList } = require('../config/software');

// Package name mapping
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

const promiseExec = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Only reject if it's not a "not found" error
        if (error.code !== 1) {
          reject(error);
          return;
        }
        // For "not found" errors, return empty string
        resolve('');
        return;
      }
      resolve(stdout.trim());
    });
  });
};

// Get package info
const getPackageInfo = async (name, isCask) => {
  try {
    // For cask applications, first check if the app exists in Applications folder
    if (isCask) {
      let appName;
      // Handle special cases
      switch (name) {
        case 'visual-studio-code':
          appName = 'Visual Studio Code';
          break;
        case 'pycharm-ce':
          appName = 'PyCharm CE';
          break;
        case 'intellij-idea-ce':
          appName = 'IntelliJ IDEA CE';
          break;
        case 'github-desktop':
          appName = 'GitHub Desktop';
          break;
        case 'microsoft-power-bi':
          appName = 'Power BI';
          break;
        case 'snowflake-snowsql':
          appName = 'SnowSQL';
          break;
        case 'swagger-editor':
          appName = 'Swagger Editor';
          break;
        case 'spyder-ide':
          appName = 'Spyder';
          break;
        case 'eclipse-java':
          appName = 'Eclipse';
          break;
        case 'figma':
          appName = 'Figma';
          break;
        case 'studio-3t':
          appName = 'Studio 3T';
          break;
        case 'sublime-text':
          appName = 'Sublime Text';
          break;
        case 'dbeaver-community':
          appName = 'DBeaver';
          break;
        default:
          appName = name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }

      // Try different possible app names and locations
      const possibleNames = [
        appName,
        appName.replace(/\s+/g, ''),  // No spaces
        appName.split(' ')[0],        // First word only
        name                          // Original name
      ];

      let appExists = false;
      for (const possibleName of possibleNames) {
        try {
          const checkAppCommand = `ls "/Applications/${possibleName}.app" 2>/dev/null || ls "/Applications/${possibleName}.localized/${possibleName}.app" 2>/dev/null`;
          const result = await promiseExec(checkAppCommand);
          if (result) {
            appExists = true;
            break;
          }
        } catch (error) {
          // Continue checking other names
          continue;
        }
      }

      if (!appExists) {
        return null;
      }
    }

    // Then check if package exists in Homebrew
    const checkCommand = isCask ? `brew list --cask ${name} 2>/dev/null` : `brew list ${name} 2>/dev/null`;
    const exists = await promiseExec(checkCommand);
    if (!exists) {
      return null;
    }

    // Get version
    const versionCommand = isCask ? `brew list --cask --versions ${name}` : `brew list --versions ${name}`;
    const versionOutput = await promiseExec(versionCommand);
    const version = versionOutput ? versionOutput.split(' ')[1] || '1.0.0' : '1.0.0';

    return {
      name: name,
      version: version
    };
  } catch (error) {
    console.error(`Error getting info for ${name}:`, error);
    return null;
  }
};

const scanInstalledSoftware = async (userId) => {
  let scanError = null;
  try {
    // Get user details
    const user = await User.findById(userId).exec();
    if (!user) {
      console.error('User not found:', userId);
      return false;
    }

    console.log('Starting scan for user:', user.email);

    const installedApps = [];

    // Only check our predefined list of software
    for (const software of devSoftwareList) {
      try {
        const isCask = software.isCask !== false; // Default to true unless explicitly false
        const packageName = packageMapping[software.id] || software.id;
        const info = await getPackageInfo(packageName, isCask);
        if (info) {
          installedApps.push({
            appId: software.id,
            name: software.name,
            version: info.version,
            isCask: isCask
          });
          console.log(`Found installed software: ${software.name}`);
        }
      } catch (error) {
        console.error(`Error checking ${software.name}:`, error);
        scanError = error;
        // Continue scanning other software
        continue;
      }
    }

    // Update database
    for (const app of installedApps) {
      await InstalledSoftware.findOneAndUpdate(
        { userId, appId: app.appId },
        {
          userId,
          userName: user.name,
          userEmail: user.email,
          appId: app.appId,
          name: app.name,
          version: app.version,
          isCask: app.isCask,
          status: 'installed',
          lastUpdateCheck: new Date(),
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      ).exec();
      console.log(`Updated record for ${app.name}`);
    }

    // Remove records for uninstalled software
    const installedAppIds = installedApps.map(app => app.appId);
    const result = await InstalledSoftware.deleteMany({
      userId,
      appId: { $nin: installedAppIds }
    }).exec();
    
    if (result.deletedCount > 0) {
      console.log(`Removed ${result.deletedCount} uninstalled software records`);
    }

    if (scanError) {
      console.log('Scan completed with errors');
      return false;
    } else {
      console.log('Scan completed successfully');
      return true;
    }
  } catch (error) {
    console.error('Error during scan:', error);
    return false;
  }
};

module.exports = {
  scanInstalledSoftware
};
