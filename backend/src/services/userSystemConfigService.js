const os = require('os');
const SystemConfig = require('../models/SystemConfig');
const User = require('../models/User');

const getSystemInfo = () => {
  const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const freeMemoryGB = Math.round(os.freemem() / (1024 * 1024 * 1024));

  // Get disk info
  const diskInfo = os.cpus()[0].model;
  const totalDiskSpaceGB = 460; // Example value, replace with actual disk space calculation
  const freeDiskSpaceGB = 201; // Example value, replace with actual free space calculation

  return {
    osVersion: os.release(),
    osName: process.platform === 'darwin' ? 'macOS' : os.type(),
    architecture: os.arch(),
    kernelVersion: os.release(),
    hostname: os.hostname(),
    platform: os.platform(),
    cpuModel: os.cpus()[0].model,
    cpuCores: os.cpus().length,
    totalMemory: totalMemoryGB,
    freeMemory: freeMemoryGB,
    totalDiskSpace: totalDiskSpaceGB,
    freeDiskSpace: freeDiskSpaceGB,
    lastUpdated: new Date()
  };
};

const updateUserSystemConfig = async (userId, userEmail) => {
  try {
    console.log('Getting system info for user:', userEmail);
    const systemInfo = getSystemInfo();
    console.log('Raw system info:', {
      osVersion: systemInfo.osVersion,
      kernelVersion: systemInfo.kernelVersion,
      diskInfo: `${systemInfo.totalDiskSpace} ${systemInfo.freeDiskSpace}`
    });

    const processedInfo = {
      userEmail,
      ...systemInfo
    };
    console.log('Processed system info:', processedInfo);

    // Find existing config or create new one
    let config = await SystemConfig.findOne({ userId });
    if (!config) {
      config = new SystemConfig({
        userId,
        userEmail,
        ...systemInfo
      });
    } else {
      Object.assign(config, systemInfo);
    }

    const updatedConfig = await config.save();
    console.log('Updated config with real values:', updatedConfig);
    return updatedConfig;
  } catch (error) {
    console.error('Error updating system config:', error);
    throw error;
  }
};

const getUserSystemConfig = async (userId) => {
  try {
    const config = await SystemConfig.findOne({ userId });
    if (!config) {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return updateUserSystemConfig(userId, user.email);
    }
    return config;
  } catch (error) {
    console.error('Error getting system config:', error);
    throw error;
  }
};

module.exports = {
  updateUserSystemConfig,
  getUserSystemConfig
};
