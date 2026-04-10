export type ServiceStatus = 'healthy' | 'degraded' | 'failed';
export type CircuitState = 'closed' | 'half-open' | 'open';

export interface Service {
  id: string;
  name: string;
  type: 'api' | 'database' | 'cache' | 'messaging' | 'storage' | 'auth';
  status: ServiceStatus;
  latency: number;
  errorRate: number;
  circuitState: CircuitState;
  lastChecked: Date;
  uptime: number;
  endpoint: string;
}

export interface FallbackConfig {
  _id: string;
  serviceId: string;
  priority: number;
  strategy: 'cached-response' | 'mock-data' | 'default-value' | 'queue-retry' | 'alternate-service' | 'static-page';
  label: string;
  description: string;
  qualityScore: number; // 0-100
  ttl: number; // seconds
  enabled: boolean;
  lastUpdated: Date;
  mongoCollection: string;
}

export interface DegradationPolicy {
  id: string;
  name: string;
  version: string;
  rules: PolicyRule[];
  gitCommit: string;
  author: string;
  timestamp: Date;
  active: boolean;
}

export interface PolicyRule {
  condition: string;
  action: string;
  fallbackChain: string[];
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'failure-detected' | 'fallback-activated' | 'circuit-opened' | 'circuit-closed' | 'policy-updated' | 'service-recovered' | 'shell-script-run' | 'socket-event';
  message: string;
  serviceId?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface UnixSocketConnection {
  id: string;
  path: string;
  connectedService: string;
  status: 'connected' | 'disconnected' | 'error';
  lastHeartbeat: Date;
  failureCount: number;
}

export interface ShellScript {
  id: string;
  name: string;
  command: string;
  description: string;
  lastRun: Date | null;
  status: 'idle' | 'running' | 'success' | 'error';
  output: string;
}
