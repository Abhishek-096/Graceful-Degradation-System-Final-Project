import { Service } from '@/lib/types';

interface Props {
  services: Service[];
  activeFallbacks: Map<string, string>;
}

const statusColor = (s: Service) =>
  s.status === 'healthy' ? '#22c55e' : s.status === 'degraded' ? '#f59e0b' : '#ef4444';

export default function SystemArchDiagram({ services, activeFallbacks }: Props) {
  const positions = [
    { x: 200, y: 60 },
    { x: 380, y: 60 },
    { x: 200, y: 160 },
    { x: 380, y: 160 },
    { x: 200, y: 260 },
    { x: 380, y: 260 },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">System Architecture</h2>
      <div className="relative rounded-lg border border-border bg-card p-4 overflow-hidden">
        <svg viewBox="0 0 580 320" className="w-full h-auto">
          {/* Express Gateway */}
          <rect x="20" y="120" width="120" height="80" rx="8" fill="hsl(220, 18%, 10%)" stroke="hsl(173, 80%, 50%)" strokeWidth="2" />
          <text x="80" y="155" textAnchor="middle" fill="hsl(173, 80%, 50%)" fontSize="11" fontWeight="bold">Express</text>
          <text x="80" y="172" textAnchor="middle" fill="hsl(215, 12%, 50%)" fontSize="9">Gateway</text>

          {/* Node.js Fallback Logic */}
          <rect x="20" y="220" width="120" height="60" rx="8" fill="hsl(220, 18%, 10%)" stroke="hsl(145, 70%, 45%)" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="80" y="248" textAnchor="middle" fill="hsl(145, 70%, 45%)" fontSize="9" fontWeight="bold">Node.js</text>
          <text x="80" y="262" textAnchor="middle" fill="hsl(215, 12%, 50%)" fontSize="8">Fallback Logic</text>

          {/* Connections */}
          {services.map((svc, i) => {
            const pos = positions[i];
            const color = statusColor(svc);
            const hasFallback = activeFallbacks.has(svc.id);

            return (
              <g key={svc.id}>
                <line x1="140" y1="160" x2={pos.x} y2={pos.y + 20} stroke={color} strokeWidth="1.5" strokeDasharray={hasFallback ? '4 4' : 'none'} opacity={0.6} />
                <rect x={pos.x} y={pos.y} width="160" height="40" rx="6" fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="1.5" />
                <circle cx={pos.x + 12} cy={pos.y + 20} r="4" fill={color}>
                  {svc.status === 'failed' && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
                </circle>
                <text x={pos.x + 22} y={pos.y + 17} fill="hsl(210, 20%, 92%)" fontSize="9" fontWeight="bold">{svc.name}</text>
                <text x={pos.x + 22} y={pos.y + 30} fill="hsl(215, 12%, 50%)" fontSize="7">{svc.circuitState.toUpperCase()} · {svc.latency.toFixed(0)}ms</text>
              </g>
            );
          })}

          {/* MongoDB label */}
          <rect x="440" y="290" width="120" height="24" rx="4" fill="hsl(220, 18%, 10%)" stroke="hsl(145, 70%, 45%)" strokeWidth="1" />
          <text x="500" y="306" textAnchor="middle" fill="hsl(145, 70%, 45%)" fontSize="8">MongoDB Configs</text>
        </svg>
      </div>
    </div>
  );
}
