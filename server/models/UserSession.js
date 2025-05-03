import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: String,
  resource: String,
  path: String
});

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deviceInfo: {
    ipAddress: String,
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    device: String,
    screenResolution: String,
    userAgent: String
  },
  geoLocation: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  connectionInfo: {
    connectionType: String,
    networkIdentifier: String,
    isp: String
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  lastActiveTime: {
    type: Date,
    default: Date.now
  },
  forcedLogout: {
    type: Boolean,
    default: false
  },
  activityLog: [activityLogSchema],
  pageViews: {
    type: Number,
    default: 0
  },
  apiCalls: {
    type: Number,
    default: 0
  },
  idleTime: {
    type: Number, // in seconds
    default: 0
  },
  securityFlags: {
    unusualLocation: Boolean,
    multipleDeviceLogin: Boolean,
    rapidGeoChange: Boolean
  }
}, {
  timestamps: true
});

// Indexes for faster queries
userSessionSchema.index({ userId: 1, isActive: 1 });
userSessionSchema.index({ loginTime: -1 });
userSessionSchema.index({ 'deviceInfo.ipAddress': 1 });
userSessionSchema.index({ 'deviceInfo.device': 1 });
// Note: sessionId already has an index because of 'unique: true' in its schema definition

const UserSession = mongoose.model("UserSession", userSessionSchema);

export default UserSession;
