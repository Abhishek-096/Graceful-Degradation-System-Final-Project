import { motion } from 'framer-motion';
import { Service } from '@/lib/types';

interface Props {
  services: Service[];
}

export default function CircuitBreakerViz({ services }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M8 12h3l2-4 2 8 2-4h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Circuit Breakers
      </h2>

      <div className="grid grid-cols-3 gap-3">
        {services.map(service => {
          const color = service.circuitState === 'closed' ? 'success' : service.circuitState === 'half-open' ? 'warning' : 'destructive';

          return (
            <motion.div
              key={service.id}
              className={`relative p-3 rounded-lg border bg-card text-center`}
              style={{
                borderColor: `hsl(var(--${color}))`,
                boxShadow: `0 0 15px hsl(var(--${color}) / 0.2)`,
              }}
            >
              <div className="relative w-12 h-12 mx-auto mb-2">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                  <motion.circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke={`hsl(var(--${color}))`}
                    strokeWidth="3"
                    strokeDasharray="125.6"
                    strokeDashoffset={service.circuitState === 'closed' ? 0 : service.circuitState === 'half-open' ? 62.8 : 115}
                    strokeLinecap="round"
                    animate={{
                      strokeDashoffset: service.circuitState === 'closed' ? 0 : service.circuitState === 'half-open' ? 62.8 : 115,
                    }}
                    transition={{ duration: 0.8 }}
                  />
                  <circle cx="24" cy="24" r="6" fill={`hsl(var(--${color}))`} className={service.circuitState === 'open' ? 'animate-pulse-glow' : ''} />
                </svg>
              </div>
              <div className="text-xs font-semibold text-foreground truncate">{service.name}</div>
              <div className={`text-[10px] font-mono uppercase text-${color}`}>
                {service.circuitState}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
