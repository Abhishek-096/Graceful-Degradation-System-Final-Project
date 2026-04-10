// Mongoose Model: ActivityLog
// Collection: activity_logs in MongoDB
// Stores all system events, failures, recoveries, and fallback activations

const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'failure-detected',
      'fallback-activated',
      'circuit-opened',
      'circuit-closed',
      'policy-updated',
      'service-recovered',
      'shell-script-run',
      'socket-event',
    ],
  },
  message: {
    type: String,
    required: true,
  },
  serviceId: {
    type: String,
    default: null,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },
}, {
  timestamps: true,
  collection: 'activity_logs',
});

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ serviceId: 1, createdAt: -1 });
ActivityLogSchema.index({ severity: 1 });

// Auto-expire old logs after 7 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

module.exports = ActivityLog;
