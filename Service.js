// Mongoose Model: Service
// Collection: services in MongoDB
// Stores monitored downstream service information

const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['api', 'database', 'cache', 'messaging', 'storage', 'auth'],
  },
  status: {
    type: String,
    enum: ['healthy', 'degraded', 'failed'],
    default: 'healthy',
  },
  latency: {
    type: Number,
    default: 0,
  },
  errorRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  circuitState: {
    type: String,
    enum: ['closed', 'half-open', 'open'],
    default: 'closed',
  },
  uptime: {
    type: Number,
    default: 99.99,
  },
  endpoint: {
    type: String,
    required: true,
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  collection: 'services',
});

ServiceSchema.index({ status: 1 });
ServiceSchema.index({ circuitState: 1 });

const Service = mongoose.model('Service', ServiceSchema);

module.exports = Service;
