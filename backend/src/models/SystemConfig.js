const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  osName: String,
  osVersion: String,
  architecture: String,
  cpuModel: String,
  cpuCores: Number,
  totalMemory: Number,
  freeMemory: Number,
  totalDiskSpace: Number,
  freeDiskSpace: Number,
  hostname: String,
  platform: String,
  kernelVersion: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

module.exports = SystemConfig;
