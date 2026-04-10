import { motion } from 'framer-motion';
import { Database, ArrowDown, Star, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { FallbackConfig, Service } from '@/lib/types';

const strategyIcons: Record<string, string> = {
  'cached-response': '📦',
  'mock-data': '🎭',
  'default-value': '⚡',
  'queue-retry': '🔄',
  'alternate-service': '🔀',
  'static-page': '📄',
};

interface Props {
  fallbacks: FallbackConfig[];
  services: Service[];
  activeFallbacks: Map<string, string>;
  onToggle: (id: string) => void;
}

export default function FallbackConfigPanel({ fallbacks, services, activeFallbacks, onToggle }: Props) {
  const groupedByService = services.map(s => ({
    service: s,
    configs: fallbacks.filter(f => f.serviceId === s.id).sort((a, b) => a.priority - b.priority),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">MongoDB Fallback Configs</h2>
        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded ml-auto">
          db.fallback_configs
        </span>
      </div>

      {groupedByService.map(({ service, configs }) => (
        <div key={service.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              service.status === 'healthy' ? 'bg-success' :
              service.status === 'degraded' ? 'bg-warning' : 'bg-destructive'
            }`} />
            <span className="text-sm font-medium text-foreground">{service.name}</span>
            <ArrowDown className="w-3 h-3 text-muted-foreground" />
          </div>

          {configs.map((config, i) => {
            const isActive = activeFallbacks.get(service.id) === config._id;

            return (
              <motion.div
                key={config._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`ml-4 p-3 rounded-lg border transition-all duration-300 ${
                  isActive
                    ? 'border-primary bg-primary/10 glow-primary'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{strategyIcons[config.strategy]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{config.label}</span>
                      {isActive && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-bold animate-pulse">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{config.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-warning" />
                        Quality: {config.qualityScore}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        TTL: {config.ttl}s
                      </span>
                      <span className="text-muted-foreground">P{config.priority}</span>
                    </div>
                  </div>
                  <button onClick={() => onToggle(config._id)} className="mt-0.5">
                    {config.enabled ? (
                      <ToggleRight className="w-5 h-5 text-success" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
