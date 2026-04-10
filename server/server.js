// Express Server - Graceful Degradation System
// Main entry point with MongoDB/Mongoose connection, Express routes, and middleware

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const fallbackRoutes = require('./routes/fallbackRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const policyRoutes = require('./routes/policyRoutes');
const logRoutes = require('./routes/logRoutes');

// Import Mongoose models
const FallbackConfig = require('./models/FallbackConfig');
const Service = require('./models/Service');
const DegradationPolicy = require('./models/DegradationPolicy');
const ActivityLog = require('./models/ActivityLog');
const UnixSocket = require('./models/UnixSocket');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// Express Middleware: Graceful Degradation Detection
// This middleware intercepts every request and checks downstream
// service health before processing
// ============================================================
app.use(async (req, res, next) => {
  try {
    // Check for any failed services in MongoDB
    const failedServices = await Service.find({ status: 'failed' });
    
    if (failedServices.length > 0) {
      req.degraded = true;
      req.failedServices = failedServices;
      
      // Attach best fallback for each failed service
      req.fallbacks = {};
      for (const service of failedServices) {
        const fallback = await FallbackConfig.findBestFallback(service.serviceId);
        if (fallback) {
          req.fallbacks[service.serviceId] = fallback;
        }
      }
    }
    
    next();
  } catch (error) {
    // If MongoDB itself is down, continue with default behavior
    console.error('Degradation check failed:', error.message);
    next();
  }
});

// API Routes
app.use('/api/fallbacks', fallbackRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/logs', logRoutes);

// Health endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoStatus = require('mongoose').connection.readyState;
    const statusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    res.json({
      status: 'running',
      mongodb: statusMap[mongoStatus] || 'unknown',
      degraded: req.degraded || false,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// MongoDB connection status endpoint
app.get('/api/mongodb/status', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const conn = mongoose.connection;
    
    res.json({
      status: conn.readyState === 1 ? 'connected' : 'disconnected',
      host: conn.host,
      port: conn.port,
      database: conn.name,
      collections: Object.keys(conn.collections),
      models: Object.keys(mongoose.models),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Seed MongoDB with initial data
const seedDatabase = async () => {
  try {
    const count = await FallbackConfig.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding MongoDB with initial fallback configurations...');
      
      // Seed services
      const services = [
        { serviceId: 'svc-001', name: 'User API', type: 'api', endpoint: 'https://api.internal/users', uptime: 99.97 },
        { serviceId: 'svc-002', name: 'MongoDB Primary', type: 'database', endpoint: 'mongodb://cluster0.internal:27017', uptime: 99.99 },
        { serviceId: 'svc-003', name: 'Redis Cache', type: 'cache', endpoint: 'redis://cache.internal:6379', uptime: 99.95 },
        { serviceId: 'svc-004', name: 'RabbitMQ', type: 'messaging', endpoint: 'amqp://mq.internal:5672', uptime: 99.90 },
        { serviceId: 'svc-005', name: 'S3 Storage', type: 'storage', endpoint: 's3://assets.internal', uptime: 99.99 },
        { serviceId: 'svc-006', name: 'Auth Service', type: 'auth', endpoint: 'https://auth.internal/v2', uptime: 99.85 },
      ];
      await Service.insertMany(services);

      // Seed fallback configs
      const fallbacks = [
        { serviceId: 'svc-001', priority: 1, strategy: 'cached-response', label: 'Serve Cached User Data', description: 'Return last known user profile from Redis cache', qualityScore: 85, ttl: 300, enabled: true },
        { serviceId: 'svc-001', priority: 2, strategy: 'mock-data', label: 'Mock User Profile', description: 'Return generic user template with limited functionality', qualityScore: 40, ttl: 60, enabled: true },
        { serviceId: 'svc-002', priority: 1, strategy: 'alternate-service', label: 'MongoDB Secondary Replica', description: 'Failover to read-only secondary MongoDB replica set', qualityScore: 90, ttl: 0, enabled: true },
        { serviceId: 'svc-002', priority: 2, strategy: 'cached-response', label: 'Local JSON Snapshot', description: 'Serve pre-cached JSON snapshot of critical collections', qualityScore: 60, ttl: 600, enabled: true },
        { serviceId: 'svc-003', priority: 1, strategy: 'alternate-service', label: 'In-Memory LRU Cache', description: 'Fall back to Node.js in-memory LRU cache', qualityScore: 70, ttl: 120, enabled: true },
        { serviceId: 'svc-004', priority: 1, strategy: 'queue-retry', label: 'Disk-Based Queue', description: 'Write messages to local disk queue for later processing', qualityScore: 75, ttl: 3600, enabled: true },
        { serviceId: 'svc-005', priority: 1, strategy: 'cached-response', label: 'CDN Edge Cache', description: 'Serve assets from CDN edge cache', qualityScore: 92, ttl: 86400, enabled: true },
        { serviceId: 'svc-006', priority: 1, strategy: 'cached-response', label: 'JWT Token Cache', description: 'Validate existing JWTs locally without auth service', qualityScore: 80, ttl: 900, enabled: true },
        { serviceId: 'svc-006', priority: 2, strategy: 'static-page', label: 'Maintenance Mode', description: 'Show static maintenance page with estimated recovery time', qualityScore: 20, ttl: 0, enabled: true },
      ];
      await FallbackConfig.insertMany(fallbacks);

      // Seed policies
      const policies = [
        {
          name: 'API Gateway Degradation', version: 'v2.4.1',
          rules: [
            { condition: 'errorRate > 50%', action: 'open-circuit', fallbackChain: ['cached-response', 'mock-data'] },
            { condition: 'latency > 2000ms', action: 'shed-load', fallbackChain: ['cached-response'] },
          ],
          gitCommit: 'a3f8b2c', author: 'ops-team', active: true,
        },
        {
          name: 'Database Failover Policy', version: 'v1.8.0',
          rules: [
            { condition: 'connection-timeout > 5s', action: 'failover-replica', fallbackChain: ['alternate-service', 'cached-response'] },
            { condition: 'write-failures > 10/min', action: 'queue-writes', fallbackChain: ['queue-retry'] },
          ],
          gitCommit: 'e7d1f4a', author: 'dba-team', active: true,
        },
      ];
      await DegradationPolicy.insertMany(policies);

      // Seed Unix sockets
      const sockets = [
        { path: '/var/run/degradation/user-api.sock', connectedService: 'svc-001' },
        { path: '/var/run/degradation/mongodb.sock', connectedService: 'svc-002' },
        { path: '/var/run/degradation/redis.sock', connectedService: 'svc-003' },
        { path: '/var/run/degradation/rabbitmq.sock', connectedService: 'svc-004' },
        { path: '/var/run/degradation/s3.sock', connectedService: 'svc-005' },
        { path: '/var/run/degradation/auth.sock', connectedService: 'svc-006' },
      ];
      await UnixSocket.insertMany(sockets);

      console.log('✅ MongoDB seeded successfully with all initial data');
    } else {
      console.log(`📦 MongoDB already has ${count} fallback configs`);
    }
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  await seedDatabase();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Graceful Degradation Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`💾 MongoDB: Connected`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET    /api/health`);
    console.log(`  GET    /api/mongodb/status`);
    console.log(`  GET    /api/fallbacks`);
    console.log(`  GET    /api/fallbacks/service/:serviceId`);
    console.log(`  GET    /api/fallbacks/best/:serviceId`);
    console.log(`  POST   /api/fallbacks`);
    console.log(`  PUT    /api/fallbacks/:id`);
    console.log(`  PATCH  /api/fallbacks/:id/toggle`);
    console.log(`  DELETE /api/fallbacks/:id`);
    console.log(`  GET    /api/services`);
    console.log(`  POST   /api/services/:serviceId/fail`);
    console.log(`  POST   /api/services/:serviceId/recover`);
    console.log(`  GET    /api/policies`);
    console.log(`  GET    /api/logs`);
  });
};

startServer();
