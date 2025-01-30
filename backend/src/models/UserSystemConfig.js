const mongoose = require('mongoose');

const userSystemConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  osVersion: {
    type: String,
    default: 'Unknown'
  },
  osName: {
    type: String,
    default: 'macOS'
  },
  architecture: {
    type: String,
    default: 'Unknown'
  },
  kernelVersion: {
    type: String,
    default: 'Unknown'
  },
  hostname: {
    type: String,
    default: 'Unknown'
  },
  platform: {
    type: String,
    default: 'darwin'
  },
  cpuModel: {
    type: String,
    default: 'Unknown'
  },
  cpuCores: {
    type: Number,
    default: 8
  },
  totalMemory: {
    type: Number,  // in GB
    required: true,
    default: 16
  },
  freeMemory: {
    type: Number,  // in GB
    required: true,
    default: 8
  },
  totalDiskSpace: {
    type: Number,  // in GB
    required: true,
    default: 460
  },
  freeDiskSpace: {
    type: Number,  // in GB
    required: true,
    default: 230
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Add unique compound index
userSystemConfigSchema.index({ userId: 1 }, { unique: true });

const UserSystemConfig = mongoose.model('UserSystemConfig', userSystemConfigSchema);

module.exports = UserSystemConfig;
