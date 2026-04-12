// Mongoose Model: FallbackConfig
// Collection: fallback_configs in MongoDB
// Stores fallback configurations prioritized by quality score

const mongoose = require('mongoose');

const FallbackConfigSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: [true, 'Service ID is required'],
    index: true,
  },
  priority: {
    type: Number,
    required: [true, 'Priority is required'],
    min: 1,
    max: 10,
  },
  strategy: {
    type: String,
    required: true,
    enum: ['cached-response', 'mock-data', 'default-value', 'queue-retry', 'alternate-service', 'static-page'],
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  qualityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  ttl: {
    type: Number,
    default: 0,
    min: 0,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  mongoCollection: {
    type: String,
    default: 'fallback_configs',
  },
}, {
  timestamps: true,
  collection: 'fallback_configs',
});

// Compound indexes for efficient querying
FallbackConfigSchema.index({ serviceId: 1, priority: 1 });
FallbackConfigSchema.index({ serviceId: 1, qualityScore: -1 });
FallbackConfigSchema.index({ serviceId: 1, enabled: 1, priority: 1 });

// Static method: Find best available fallback for a service
FallbackConfigSchema.statics.findBestFallback = async function(serviceId) {
  return this.findOne({ serviceId, enabled: true })
    .sort({ priority: 1, qualityScore: -1 })
    .exec();
};

// Static method: Get all fallbacks for a service ranked by quality
FallbackConfigSchema.statics.getRankedFallbacks = async function(serviceId) {
  return this.find({ serviceId, enabled: true })
    .sort({ priority: 1, qualityScore: -1 })
    .exec();
};

// Static method: Get all fallback configs grouped by service
FallbackConfigSchema.statics.getAllGroupedByService = async function() {
  return this.aggregate([
    { $sort: { priority: 1, qualityScore: -1 } },
    {
      $group: {
        _id: '$serviceId',
        configs: { $push: '$$ROOT' },
        count: { $sum: 1 },
        avgQuality: { $avg: '$qualityScore' },
      }
    }
  ]);
};

const FallbackConfig = mongoose.model('FallbackConfig', FallbackConfigSchema);

module.exports = FallbackConfig;
