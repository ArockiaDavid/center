const mongoose = require('mongoose');

const installedSoftwareSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  appId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['installed', 'pending', 'failed'],
    default: 'installed'
  },
  installDate: {
    type: Date,
    default: Date.now
  },
  lastUpdateCheck: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound unique index on userId and appId
installedSoftwareSchema.index({ userId: 1, appId: 1 }, { unique: true });

const InstalledSoftware = mongoose.model('InstalledSoftware', installedSoftwareSchema);

module.exports = InstalledSoftware;
