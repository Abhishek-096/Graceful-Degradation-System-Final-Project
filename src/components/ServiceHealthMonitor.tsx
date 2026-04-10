import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Database, Server, HardDrive, MessageSquare, Shield, Zap, AlertTriangle, XCircle } from 'lucide-react';
import { Service } from '@/lib/types';

const iconMap = {
  api: Server,
  database: Database,
  cache: Zap,
  messaging: MessageSquare,
  storage: HardDrive,
  auth: Shield,
};

const statusColors = {
  healthy: 'bg-success/20 border-success text-success glow-success',
  degraded: 'bg-warning/20 border-warning text-warning glow-warning',
  failed: 'bg-destructive/20 border-destructive text-destructive glow-destructive',
};

const circuitColors = {
  closed: 'text-success',
  'half-open': 'text-warning',
  open: 'text-destructive',
};

interface Props {
  services: Service[];
  onTriggerFailure: (id: string) => void;
  onRecover: (id: string) => void;
  activeFallbacks: Map<string, string>;
}

export default function ServiceHealthMonitor({ services, onTriggerFailure, onRecover, activeFallbacks }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Express Service Monitor</h2>
        <span className="text-xs font-mono text-muted-foreground ml-auto">
          {services.filter(s => s.status === 'healthy').length}/{services.length} healthy
        </span>
      </div>

      <AnimatePresence>
        {services.map((service, i) => {
          const Icon = iconMap[service.type];
          const hasFallback = activeFallbacks.has(service.id);

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative p-4 rounded-lg border ${statusColors[service.status]} transition-all duration-300`}
            >
              {service.status === 'failed' && (
                <div className="absolute inset-0 rounded-lg animate-pulse-glow bg-destructive/5" />
              )}

              <div className="relative flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{service.name}</span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      service.circuitState === 'closed' ? 'bg-success/20 text-success' :
                      service.circuitState === 'half-open' ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {service.circuitState}
                    </span>
                    {hasFallback && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary animate-pulse">
                        FALLBACK ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">
                    {service.endpoint}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs font-mono">
                    <span>Latency: <span className={service.latency > 1000 ? 'text-destructive' : service.latency > 200 ? 'text-warning' : 'text-success'}>{service.latency.toFixed(0)}ms</span></span>
                    <span>Errors: <span className={service.errorRate > 50 ? 'text-destructive' : service.errorRate > 10 ? 'text-warning' : 'text-success'}>{service.errorRate.toFixed(1)}%</span></span>
                    <span>Uptime: {service.uptime}%</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {service.status !== 'failed' ? (
                    <button
                      onClick={() => onTriggerFailure(service.id)}
                      className="p-1.5 rounded bg-destructive/20 hover:bg-destructive/40 text-destructive transition-colors"
                      title="Simulate failure"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onRecover(service.id)}
                      className="p-1.5 rounded bg-success/20 hover:bg-success/40 text-success transition-colors"
                      title="Recover service"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
