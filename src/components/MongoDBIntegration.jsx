import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Server, Code, CheckCircle, Copy, ChevronDown, ChevronRight } from 'lucide-react';

const mongooseModels = [
  {
    name: 'FallbackConfig',
    file: 'server/models/FallbackConfig.js',
    collection: 'fallback_configs',
    code: `const mongoose = require('mongoose');

const FallbackConfigSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: [true, 'Service ID is required'],
    index: true,
  },
  priority: {
    type: Number,
    required: [true, 'Priority is required'],
    min: 1, max: 10,
  },
  strategy: {
    type: String,
    required: true,
    enum: ['cached-response', 'mock-data', 'default-value',
           'queue-retry', 'alternate-service', 'static-page'],
  },
  label: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  qualityScore: { type: Number, required: true, min: 0, max: 100 },
  ttl: { type: Number, default: 0, min: 0 },
  enabled: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'fallback_configs',
});

// Indexes for efficient querying
FallbackConfigSchema.index({ serviceId: 1, priority: 1 });
FallbackConfigSchema.index({ serviceId: 1, qualityScore: -1 });

// Static: Find best available fallback
FallbackConfigSchema.statics.findBestFallback = async function(serviceId) {
  return this.findOne({ serviceId, enabled: true })
    .sort({ priority: 1, qualityScore: -1 })
    .exec();
};

module.exports = mongoose.model('FallbackConfig', FallbackConfigSchema);`,
  },
  {
    name: 'Service',
    file: 'server/models/Service.js',
    collection: 'services',
    code: `const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['api', 'database', 'cache', 'messaging', 'storage', 'auth'],
  },
  status: {
    type: String,
    enum: ['healthy', 'degraded', 'failed'],
    default: 'healthy',
  },
  latency: { type: Number, default: 0 },
  errorRate: { type: Number, default: 0, min: 0, max: 100 },
  circuitState: {
    type: String,
    enum: ['closed', 'half-open', 'open'],
    default: 'closed',
  },
  endpoint: { type: String, required: true },
  lastChecked: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'services' });

module.exports = mongoose.model('Service', ServiceSchema);`,
  },
  {
    name: 'DegradationPolicy',
    file: 'server/models/DegradationPolicy.js',
    collection: 'degradation_policies',
    code: `const mongoose = require('mongoose');

const PolicyRuleSchema = new mongoose.Schema({
  condition: { type: String, required: true },
  action: { type: String, required: true },
  fallbackChain: [{ type: String }],
}, { _id: false });

const DegradationPolicySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  version: { type: String, required: true },
  rules: [PolicyRuleSchema],
  gitCommit: { type: String, required: true },
  author: { type: String, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true, collection: 'degradation_policies' });

module.exports = mongoose.model('DegradationPolicy', DegradationPolicySchema);`,
  },
  {
    name: 'ActivityLog',
    file: 'server/models/ActivityLog.js',
    collection: 'activity_logs',
    code: `const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  type: {
    type: String, required: true,
    enum: ['failure-detected', 'fallback-activated', 'circuit-opened',
           'circuit-closed', 'policy-updated', 'service-recovered',
           'shell-script-run', 'socket-event'],
  },
  message: { type: String, required: true },
  serviceId: { type: String, default: null },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
}, { timestamps: true, collection: 'activity_logs' });

// Auto-expire old logs after 7 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);`,
  },
];

const expressRoutes = [
  { method: 'GET', path: '/api/fallbacks', desc: 'Retrieve all fallback configs from MongoDB' },
  { method: 'GET', path: '/api/fallbacks/service/:serviceId', desc: 'Get fallbacks for specific service' },
  { method: 'GET', path: '/api/fallbacks/best/:serviceId', desc: 'Node.js selects best available fallback' },
  { method: 'POST', path: '/api/fallbacks', desc: 'Create new fallback config in MongoDB' },
  { method: 'PUT', path: '/api/fallbacks/:id', desc: 'Update fallback config' },
  { method: 'PATCH', path: '/api/fallbacks/:id/toggle', desc: 'Toggle enable/disable' },
  { method: 'DELETE', path: '/api/fallbacks/:id', desc: 'Remove fallback config' },
  { method: 'GET', path: '/api/services', desc: 'Get all monitored services' },
  { method: 'POST', path: '/api/services/:serviceId/fail', desc: 'Trigger service failure' },
  { method: 'POST', path: '/api/services/:serviceId/recover', desc: 'Recover failed service' },
  { method: 'GET', path: '/api/policies', desc: 'Get Git-tracked degradation policies' },
  { method: 'GET', path: '/api/logs', desc: 'Retrieve activity logs from MongoDB' },
  { method: 'GET', path: '/api/health', desc: 'System health + MongoDB status' },
  { method: 'GET', path: '/api/mongodb/status', desc: 'MongoDB connection details' },
];

const methodColors = {
  GET: 'bg-success/20 text-success',
  POST: 'bg-primary/20 text-primary',
  PUT: 'bg-warning/20 text-warning',
  PATCH: 'bg-accent/20 text-accent',
  DELETE: 'bg-destructive/20 text-destructive',
};

export default function MongoDBIntegration() {
  const [expandedModel, setExpandedModel] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
    <div className="space-y-6">
      {/* MongoDB Connection Status */}
      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 glow-primary">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">MongoDB + Mongoose Integration</h2>
            <p className="text-xs text-muted-foreground font-mono">mongoose.connect('mongodb://localhost:27017/graceful_degradation')</p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-xs text-success font-mono bg-success/10 px-2 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Connected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="p-2 rounded bg-card border border-border">
            <div className="text-[10px] text-muted-foreground">Database</div>
            <div className="text-xs font-mono text-foreground">graceful_degradation</div>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <div className="text-[10px] text-muted-foreground">Collections</div>
            <div className="text-xs font-mono text-foreground">5 active</div>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <div className="text-[10px] text-muted-foreground">Mongoose Models</div>
            <div className="text-xs font-mono text-foreground">5 registered</div>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <div className="text-[10px] text-muted-foreground">Write Concern</div>
            <div className="text-xs font-mono text-foreground">majority</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mongoose Models */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            Mongoose Schema Models
          </h3>

          {mongooseModels.map((model, i) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedModel(expandedModel === model.name ? null : model.name)}
                className="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors"
              >
                {expandedModel === model.name ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <Database className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">{model.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded ml-auto">
                  {model.collection}
                </span>
              </button>

              {expandedModel === model.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-border"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30">
                    <span className="text-[10px] font-mono text-muted-foreground">{model.file}</span>
                    <button
                      onClick={() => copyToClipboard(model.code, model.name)}
                      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
                    >
                      {copiedText === model.name ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedText === model.name ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-[300px] overflow-y-auto leading-relaxed">
                    {model.code}
                  </pre>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Express API Routes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            Express API Routes (MongoDB CRUD)
          </h3>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-3 border-b border-border bg-muted/30">
              <span className="text-[10px] font-mono text-muted-foreground">server/server.js · Express + Mongoose</span>
            </div>
            <div className="divide-y divide-border">
              {expressRoutes.map((route, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors"
                >
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded w-14 text-center ${methodColors[route.method]}`}>
                    {route.method}
                  </span>
                  <span className="text-[10px] font-mono text-foreground flex-1 truncate">{route.path}</span>
                  <span className="text-[9px] text-muted-foreground hidden sm:block">{route.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Express Middleware Code */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-3 border-b border-border bg-muted/30">
              <span className="text-[10px] font-mono text-muted-foreground">Express Degradation Middleware</span>
            </div>
            <pre className="p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto leading-relaxed">{`// Express middleware - detects downstream failures
// Queries MongoDB for fallback configs in real-time

app.use(async (req, res, next) => {
  try {
    // Check MongoDB for any failed services
    const failedServices = await Service.find({ status: 'failed' });
    
    if (failedServices.length > 0) {
      req.degraded = true;
      req.failedServices = failedServices;
      
      // Mongoose: Find best fallback for each failed service
      req.fallbacks = {};
      for (const service of failedServices) {
        const fallback = await FallbackConfig
          .findOne({ serviceId: service.serviceId, enabled: true })
          .sort({ priority: 1, qualityScore: -1 })
          .exec();
        
        if (fallback) {
          req.fallbacks[service.serviceId] = fallback;
        }
      }
    }
    next();
  } catch (error) {
    console.error('Degradation check failed:', error.message);
    next(); // Continue even if MongoDB is down
  }
});`}</pre>
          </div>

          {/* MongoDB Connection Code */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-3 border-b border-border bg-muted/30">
              <span className="text-[10px] font-mono text-muted-foreground">server/config/db.js · Mongoose Connection</span>
            </div>
            <pre className="p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto leading-relaxed">{`const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI 
  || 'mongodb://localhost:27017/graceful_degradation';

const connectDB = async () => {
  const conn = await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 2000,
  });

  console.log(\`✅ MongoDB Connected: \${conn.connection.host}\`);

  mongoose.connection.on('error', (err) => {
    console.error(\`❌ MongoDB error: \${err.message}\`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Reconnecting...');
  });

  return conn;
};

module.exports = connectDB;`}</pre>
          </div>
        </div>
      </div>

      {/* Seed Script */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">MongoDB Seed Data (server.js)</span>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">Auto-seeds on first run</span>
        </div>
        <pre className="p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-[200px] overflow-y-auto leading-relaxed">{`// Seed MongoDB with initial data on first run
const seedDatabase = async () => {
  const count = await FallbackConfig.countDocuments();
  if (count === 0) {
    console.log('🌱 Seeding MongoDB...');
    
    await Service.insertMany([
      { serviceId: 'svc-001', name: 'User API', type: 'api', endpoint: 'https://api.internal/users' },
      { serviceId: 'svc-002', name: 'MongoDB Primary', type: 'database', endpoint: 'mongodb://cluster0:27017' },
      { serviceId: 'svc-003', name: 'Redis Cache', type: 'cache', endpoint: 'redis://cache:6379' },
      // ... more services
    ]);

    await FallbackConfig.insertMany([
      { serviceId: 'svc-001', priority: 1, strategy: 'cached-response',
        label: 'Serve Cached User Data', qualityScore: 85, ttl: 300 },
      { serviceId: 'svc-002', priority: 1, strategy: 'alternate-service',
        label: 'MongoDB Secondary Replica', qualityScore: 90, ttl: 0 },
      // ... more fallback configs
    ]);

    await DegradationPolicy.insertMany([
      { name: 'API Gateway Degradation', version: 'v2.4.1',
        gitCommit: 'a3f8b2c', author: 'ops-team', active: true,
        rules: [{ condition: 'errorRate > 50%', action: 'open-circuit',
                  fallbackChain: ['cached-response', 'mock-data'] }] },
    ]);

    console.log('✅ MongoDB seeded successfully');
  }
};`}</pre>
      </div>
    </div>
  );
}
