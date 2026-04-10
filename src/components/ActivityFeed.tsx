import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, AlertTriangle, AlertCircle, Info, Zap, Terminal, Radio } from 'lucide-react';
import { ActivityLog } from '@/lib/types';

const typeIcons = {
  'failure-detected': AlertCircle,
  'fallback-activated': Zap,
  'circuit-opened': AlertTriangle,
  'circuit-closed': Info,
  'policy-updated': Info,
  'service-recovered': Zap,
  'shell-script-run': Terminal,
  'socket-event': Radio,
};

const severityStyles = {
  info: 'border-l-primary text-primary',
  warning: 'border-l-warning text-warning',
  critical: 'border-l-destructive text-destructive',
};

interface Props {
  logs: ActivityLog[];
}

export default function ActivityFeed({ logs }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Activity Feed</h2>
        <span className="text-xs text-muted-foreground font-mono ml-auto">{logs.length} events</span>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No events yet. Trigger a service failure or start simulation.
            </div>
          ) : (
            logs.map(log => {
              const Icon = typeIcons[log.type];
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2 p-2 rounded border-l-2 bg-card/50 ${severityStyles[log.severity]}`}
                >
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-foreground leading-tight">{log.message}</p>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()} · {log.type}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
