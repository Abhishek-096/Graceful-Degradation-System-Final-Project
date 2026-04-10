import { motion } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';
import { FallbackConfig, Service } from '@/lib/types';

interface Props {
  fallbacks: FallbackConfig[];
  services: Service[];
  activeFallbacks: Map<string, string>;
}

export default function RankedFallbackStrategies({ fallbacks, services, activeFallbacks }: Props) {
  const failedServices = services.filter(s => s.status === 'failed');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-semibold text-foreground">Ranked Fallback Strategies</h2>
      </div>

      {failedServices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          All services healthy. Trigger a failure to see ranked fallback selection.
        </div>
      ) : (
        failedServices.map(service => {
          const configs = fallbacks
            .filter(f => f.serviceId === service.id)
            .sort((a, b) => b.qualityScore - a.qualityScore);
          const activeId = activeFallbacks.get(service.id);

          return (
            <div key={service.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-semibold text-destructive">{service.name}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Best available fallback selected by Node.js</span>
              </div>

              {configs.map((config, i) => {
                const isSelected = config._id === activeId;
                const barWidth = config.qualityScore;

                return (
                  <motion.div
                    key={config._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-3 rounded-lg border ${
                      isSelected
                        ? 'border-primary bg-primary/10 glow-primary'
                        : !config.enabled
                        ? 'border-border/50 bg-card/30 opacity-50'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-foreground">#{i + 1}</span>
                      <span className="text-xs font-semibold text-foreground">{config.label}</span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-bold">
                          SELECTED
                        </span>
                      )}
                      {!config.enabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          DISABLED
                        </span>
                      )}
                    </div>

                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          barWidth >= 80 ? 'bg-success' : barWidth >= 50 ? 'bg-warning' : 'bg-destructive'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
                      <span>{config.strategy}</span>
                      <span>Quality: {config.qualityScore}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
