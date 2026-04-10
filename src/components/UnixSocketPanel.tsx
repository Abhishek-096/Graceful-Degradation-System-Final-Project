import { motion } from 'framer-motion';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { UnixSocketConnection, Service } from '@/lib/types';

interface Props {
  sockets: UnixSocketConnection[];
  services: Service[];
}

export default function UnixSocketPanel({ sockets, services }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Unix Socket Connections</h2>
      </div>

      <div className="space-y-2">
        {sockets.map((sock, i) => {
          const service = services.find(s => s.id === sock.connectedService);
          return (
            <motion.div
              key={sock.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                sock.status === 'connected'
                  ? 'border-success/30 bg-success/5'
                  : 'border-destructive/30 bg-destructive/5'
              }`}
            >
              {sock.status === 'connected' ? (
                <Wifi className="w-4 h-4 text-success shrink-0" />
              ) : (
                <WifiOff className="w-4 h-4 text-destructive shrink-0 animate-pulse" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-foreground truncate">{sock.path}</div>
                <div className="text-[10px] text-muted-foreground">
                  → {service?.name} · Failures: {sock.failureCount} · Last heartbeat: {sock.lastHeartbeat.toLocaleTimeString()}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                sock.status === 'connected' ? 'bg-success' : 'bg-destructive animate-pulse'
              }`} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
