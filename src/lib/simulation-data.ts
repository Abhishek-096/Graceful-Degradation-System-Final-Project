import { Service, FallbackConfig, DegradationPolicy, UnixSocketConnection, ShellScript, ActivityLog } from './types';

export const initialServices: Service[] = [
  {
    id: 'svc-001', name: 'User API', type: 'api', status: 'healthy',
    latency: 45, errorRate: 0.1, circuitState: 'closed',
    lastChecked: new Date(), uptime: 99.97, endpoint: 'https://api.internal/users'
  },
  {
    id: 'svc-002', name: 'MongoDB Primary', type: 'database', status: 'healthy',
    latency: 12, errorRate: 0, circuitState: 'closed',
    lastChecked: new Date(), uptime: 99.99, endpoint: 'mongodb://cluster0.internal:27017'
  },
  {
    id: 'svc-003', name: 'Redis Cache', type: 'cache', status: 'healthy',
    latency: 3, errorRate: 0, circuitState: 'closed',
    lastChecked: new Date(), uptime: 99.95, endpoint: 'redis://cache.internal:6379'
  },
  {
    id: 'svc-004', name: 'RabbitMQ', type: 'messaging', status: 'healthy',
    latency: 8, errorRate: 0.2, circuitState: 'closed',
    lastChecked: new Date(), uptime: 99.90, endpoint: 'amqp://mq.internal:5672'
  },
  {
    id: 'svc-005', name: 'S3 Storage', type: 'storage', status: 'healthy',
    latency: 120, errorRate: 0.05, circuitState: 'closed',
    lastChecked: new Date(), uptime: 99.99, endpoint: 's3://assets.internal'
  },
  {
    id: 'svc-006', name: 'Auth Service', type: 'auth', status: 'healthy',
    latency: 65, errorRate: 0.3, circuitState: 'closed',
    lastChecked: new Date(), uptime: 99.85, endpoint: 'https://auth.internal/v2'
  },
];

export const initialFallbacks: FallbackConfig[] = [
  {
    _id: 'fb-001', serviceId: 'svc-001', priority: 1,
    strategy: 'cached-response', label: 'Serve Cached User Data',
    description: 'Return last known user profile from Redis cache',
    qualityScore: 85, ttl: 300, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
  {
    _id: 'fb-002', serviceId: 'svc-001', priority: 2,
    strategy: 'mock-data', label: 'Mock User Profile',
    description: 'Return generic user template with limited functionality',
    qualityScore: 40, ttl: 60, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
  {
    _id: 'fb-003', serviceId: 'svc-002', priority: 1,
    strategy: 'alternate-service', label: 'MongoDB Secondary Replica',
    description: 'Failover to read-only secondary MongoDB replica set',
    qualityScore: 90, ttl: 0, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
  {
    _id: 'fb-004', serviceId: 'svc-002', priority: 2,
    strategy: 'cached-response', label: 'Local JSON Snapshot',
    description: 'Serve pre-cached JSON snapshot of critical collections',
    qualityScore: 60, ttl: 600, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
  {
    _id: 'fb-005', serviceId: 'svc-003', priority: 1,
    strategy: 'alternate-service', label: 'In-Memory LRU Cache',
    description: 'Fall back to Node.js in-memory LRU cache (limited capacity)',
    qualityScore: 70, ttl: 120, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
  {
    _id: 'fb-006', serviceId: 'svc-004', priority: 1,
    strategy: 'queue-retry', label: 'Disk-Based Queue',
    description: 'Write messages to local disk queue for later processing',
    qualityScore: 75, ttl: 3600, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
  {
    _id: 'fb-007', serviceId: 'svc-005', priority: 1,
    strategy: 'cached-response', label: 'CDN Edge Cache',
    description: 'Serve assets from CDN edge cache with stale-while-revalidate',
    qualityScore: 92, ttl: 86400, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
  {
    _id: 'fb-008', serviceId: 'svc-006', priority: 1,
    strategy: 'cached-response', label: 'JWT Token Cache',
    description: 'Validate existing JWTs locally without auth service',
    qualityScore: 80, ttl: 900, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
  {
    _id: 'fb-009', serviceId: 'svc-006', priority: 2,
    strategy: 'static-page', label: 'Maintenance Mode',
    description: 'Show static maintenance page with estimated recovery time',
    qualityScore: 20, ttl: 0, enabled: true, lastUpdated: new Date(),
    mongoCollection: 'fallback_configs'
  },
];

export const initialPolicies: DegradationPolicy[] = [
  {
    id: 'pol-001', name: 'API Gateway Degradation',
    version: 'v2.4.1',
    rules: [
      { condition: 'errorRate > 50%', action: 'open-circuit', fallbackChain: ['cached-response', 'mock-data'] },
      { condition: 'latency > 2000ms', action: 'shed-load', fallbackChain: ['cached-response'] },
    ],
    gitCommit: 'a3f8b2c', author: 'ops-team', timestamp: new Date(Date.now() - 86400000), active: true
  },
  {
    id: 'pol-002', name: 'Database Failover Policy',
    version: 'v1.8.0',
    rules: [
      { condition: 'connection-timeout > 5s', action: 'failover-replica', fallbackChain: ['alternate-service', 'cached-response'] },
      { condition: 'write-failures > 10/min', action: 'queue-writes', fallbackChain: ['queue-retry'] },
    ],
    gitCommit: 'e7d1f4a', author: 'dba-team', timestamp: new Date(Date.now() - 172800000), active: true
  },
  {
    id: 'pol-003', name: 'Cache Layer Recovery',
    version: 'v3.1.0',
    rules: [
      { condition: 'cache-miss-rate > 80%', action: 'warm-cache', fallbackChain: ['alternate-service'] },
    ],
    gitCommit: 'b9c3e5f', author: 'platform-team', timestamp: new Date(Date.now() - 259200000), active: true
  },
];

export const initialSockets: UnixSocketConnection[] = [
  { id: 'sock-001', path: '/var/run/degradation/user-api.sock', connectedService: 'svc-001', status: 'connected', lastHeartbeat: new Date(), failureCount: 0 },
  { id: 'sock-002', path: '/var/run/degradation/mongodb.sock', connectedService: 'svc-002', status: 'connected', lastHeartbeat: new Date(), failureCount: 0 },
  { id: 'sock-003', path: '/var/run/degradation/redis.sock', connectedService: 'svc-003', status: 'connected', lastHeartbeat: new Date(), failureCount: 0 },
  { id: 'sock-004', path: '/var/run/degradation/rabbitmq.sock', connectedService: 'svc-004', status: 'connected', lastHeartbeat: new Date(), failureCount: 0 },
  { id: 'sock-005', path: '/var/run/degradation/s3.sock', connectedService: 'svc-005', status: 'connected', lastHeartbeat: new Date(), failureCount: 0 },
  { id: 'sock-006', path: '/var/run/degradation/auth.sock', connectedService: 'svc-006', status: 'connected', lastHeartbeat: new Date(), failureCount: 0 },
];

export const shellScripts: ShellScript[] = [
  { id: 'sh-001', name: 'update-cache-fallbacks.sh', command: '#!/bin/bash\ncurl -s $API_URL/users | mongoimport --db fallbacks --collection cached_users --drop', description: 'Refresh cached user data in MongoDB fallback collection', lastRun: null, status: 'idle', output: '' },
  { id: 'sh-002', name: 'generate-mock-data.sh', command: '#!/bin/bash\nnode scripts/generate-mocks.js | mongoimport --db fallbacks --collection mock_data', description: 'Generate and store mock data for service fallbacks', lastRun: null, status: 'idle', output: '' },
  { id: 'sh-003', name: 'sync-degradation-policies.sh', command: '#!/bin/bash\ngit pull origin main -- policies/\nmongoimport --db config --collection policies --file policies/*.json', description: 'Sync latest degradation policies from Git to MongoDB', lastRun: null, status: 'idle', output: '' },
  { id: 'sh-004', name: 'health-check-all.sh', command: '#!/bin/bash\nfor sock in /var/run/degradation/*.sock; do\n  echo "CHECK" | socat - UNIX-CONNECT:$sock\ndone', description: 'Ping all Unix socket connections for health status', lastRun: null, status: 'idle', output: '' },
];

export const generateLog = (type: ActivityLog['type'], message: string, serviceId?: string, severity: ActivityLog['severity'] = 'info'): ActivityLog => ({
  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  timestamp: new Date(),
  type, message, serviceId, severity,
});
