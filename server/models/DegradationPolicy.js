// Mongoose Model: DegradationPolicy
// Collection: degradation_policies in MongoDB
// Stores Git-tracked degradation policies with rules and fallback chains

const mongoose = require('mongoose');

const PolicyRuleSchema = new mongoose.Schema({
  condition: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  fallbackChain: [{
    type: String,
  }],
}, { _id: false });

const DegradationPolicySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  version: {
    type: String,
    required: true,
  },
  rules: [PolicyRuleSchema],
  gitCommit: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'degradation_policies',
});

DegradationPolicySchema.index({ active: 1 });
DegradationPolicySchema.index({ gitCommit: 1 });

const DegradationPolicy = mongoose.model('DegradationPolicy', DegradationPolicySchema);

module.exports = DegradationPolicy;
