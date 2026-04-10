import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Shield, Database, GitBranch, Terminal as TerminalIcon, Radio, Trophy, Activity, Layers, HardDrive } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import ServiceHealthMonitor from '@/components/ServiceHealthMonitor';
import FallbackConfigPanel from '@/components/FallbackConfigPanel';
import CircuitBreakerViz from '@/components/CircuitBreakerViz';
import ActivityFeed from '@/components/ActivityFeed';
import UnixSocketPanel from '@/components/UnixSocketPanel';
import ShellScriptRunner from '@/components/ShellScriptRunner';
import DegradationPolicies from '@/components/DegradationPolicies';
import RankedFallbackStrategies from '@/components/RankedFallbackStrategies';
import SystemArchDiagram from '@/components/SystemArchDiagram';
import MongoDBIntegration from '@/components/MongoDBIntegration';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'mongodb', label: 'MongoDB + Mongoose', icon: HardDrive },
  { id: 'fallbacks', label: 'Fallback Configs', icon: Database },
  { id: 'strategies', label: 'Ranked Fallbacks', icon: Trophy },
  { id: 'policies', label: 'Git Policies', icon: GitBranch },
  { id: 'scripts', label: 'Shell Scripts', icon: TerminalIcon },
  { id: 'sockets', label: 'Unix Sockets', icon: Radio },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState('overview');
  const sim = useSimulation();

  const healthyCount = sim.services.filter(s => s.status === 'healthy').length;
  const degradedCount = sim.services.filter(s => s.status === 'degraded').length;
  const failedCount = sim.services.filter(s => s.status === 'failed').length;

  return (
    <div className="min-h-screen bg-background grid-pattern scanline">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary text-glow-primary" />
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Graceful Degradation System</h1>
              <p className="text-[10px] font-mono text-muted-foreground">Express · MongoDB · Mongoose · Node.js · Unix Sockets · Git</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> {healthyCount} Healthy
              </span>
              {degradedCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" /> {degradedCount} Degraded
                </span>
              )}
              {failedCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> {failedCount} Failed
                </span>
              )}
            </div>

            <button
              onClick={sim.toggleSimulation}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                sim.isSimulating
                  ? 'bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30'
                  : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 glow-primary'
              }`}
            >
              {sim.isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {sim.isSimulating ? 'Stop Simulation' : 'Start Simulation'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SystemArchDiagram services={sim.services} activeFallbacks={sim.activeFallbacks} />
                <CircuitBreakerViz services={sim.services} />
                <RankedFallbackStrategies fallbacks={sim.fallbacks} services={sim.services} activeFallbacks={sim.activeFallbacks} />
              </div>
              <div className="space-y-6">
                <ServiceHealthMonitor
                  services={sim.services}
                  onTriggerFailure={sim.triggerServiceFailure}
                  onRecover={sim.recoverService}
                  activeFallbacks={sim.activeFallbacks}
                />
                <ActivityFeed logs={sim.logs} />
              </div>
            </div>
          )}

          {activeTab === 'mongodb' && (
            <MongoDBIntegration />
          )}

          {activeTab === 'fallbacks' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FallbackConfigPanel
                fallbacks={sim.fallbacks}
                services={sim.services}
                activeFallbacks={sim.activeFallbacks}
                onToggle={(id) => {
                  sim.setFallbacks(prev => prev.map(f =>
                    f._id === id ? { ...f, enabled: !f.enabled } : f
                  ));
                }}
              />
              <div className="space-y-6">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    MongoDB Query Examples
                  </h3>
                  <pre className="text-[10px] font-mono text-muted-foreground bg-muted/50 p-3 rounded overflow-x-auto">{`// Mongoose: Find best fallback for a failed service
const bestFallback = await FallbackConfig
  .findOne({ serviceId: 'svc-001', enabled: true })
  .sort({ priority: 1, qualityScore: -1 })
  .exec();

// Mongoose: Get all fallbacks grouped by service
const grouped = await FallbackConfig.aggregate([
  { $sort: { priority: 1, qualityScore: -1 } },
  { $group: {
      _id: '$serviceId',
      configs: { $push: '$$ROOT' },
      count: { $sum: 1 },
      avgQuality: { $avg: '$qualityScore' },
  }}
]);

// Mongoose: Toggle a fallback config
const config = await FallbackConfig.findById(configId);
config.enabled = !config.enabled;
config.lastUpdated = new Date();
await config.save();

// Mongoose: Create new fallback
const newFallback = new FallbackConfig({
  serviceId: 'svc-001',
  priority: 3,
  strategy: 'mock-data',
  label: 'Emergency Mock',
  qualityScore: 30,
  ttl: 120,
  enabled: true,
});
await newFallback.save();`}</pre>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Node.js Fallback Selection Logic
                  </h3>
                  <pre className="text-[10px] font-mono text-muted-foreground bg-muted/50 p-3 rounded overflow-x-auto">{`// Node.js: Ranked fallback selection algorithm
// Retrieves from MongoDB, selects best available option

async function selectFallback(serviceId) {
  // Query MongoDB via Mongoose
  const configs = await FallbackConfig
    .find({ serviceId, enabled: true })
    .sort({ priority: 1, qualityScore: -1 })
    .exec();

  // Try each fallback in priority order
  for (const config of configs) {
    const available = await checkFallbackHealth(config);
    if (available) {
      // Log selection to MongoDB
      await ActivityLog.create({
        type: 'fallback-activated',
        message: \`Selected: "\${config.label}" (quality: \${config.qualityScore}%)\`,
        serviceId,
        severity: 'warning',
      });
      return config;
    }
  }

  return getDefaultFallback(serviceId);
}

// Express middleware integration
app.use(async (req, res, next) => {
  const health = await checkDownstream(req);
  if (!health.ok) {
    const fallback = await selectFallback(health.serviceId);
    req.fallbackConfig = fallback;
    req.degraded = true;
  }
  next();
});`}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ServiceHealthMonitor
                  services={sim.services}
                  onTriggerFailure={sim.triggerServiceFailure}
                  onRecover={sim.recoverService}
                  activeFallbacks={sim.activeFallbacks}
                />
              </div>
              <div>
                <RankedFallbackStrategies fallbacks={sim.fallbacks} services={sim.services} activeFallbacks={sim.activeFallbacks} />
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="max-w-3xl">
              <DegradationPolicies policies={sim.policies} />
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="max-w-2xl">
              <ShellScriptRunner scripts={sim.scripts} onRun={sim.runShellScript} />
            </div>
          )}

          {activeTab === 'sockets' && (
            <div className="max-w-2xl">
              <UnixSocketPanel sockets={sim.sockets} services={sim.services} />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
