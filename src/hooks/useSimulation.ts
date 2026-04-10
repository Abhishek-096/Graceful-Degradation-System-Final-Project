import { useState, useCallback, useEffect, useRef } from 'react';
import { Service, FallbackConfig, ActivityLog, UnixSocketConnection, ShellScript } from '@/lib/types';
import { initialServices, initialFallbacks, initialPolicies, initialSockets, shellScripts, generateLog } from '@/lib/simulation-data';

export function useSimulation() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [fallbacks, setFallbacks] = useState<FallbackConfig[]>(initialFallbacks);
  const [policies] = useState(initialPolicies);
  const [sockets, setSockets] = useState<UnixSocketConnection[]>(initialSockets);
  const [scripts, setScripts] = useState<ShellScript[]>(shellScripts);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeFallbacks, setActiveFallbacks] = useState<Map<string, string>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((log: ActivityLog) => {
    setLogs(prev => [log, ...prev].slice(0, 100));
  }, []);

  const triggerServiceFailure = useCallback((serviceId: string) => {
    setServices(prev => prev.map(s => {
      if (s.id !== serviceId) return s;
      const failed: Service = {
        ...s,
        status: 'failed',
        errorRate: 85 + Math.random() * 15,
        latency: 5000 + Math.random() * 5000,
        circuitState: 'open',
        lastChecked: new Date(),
      };
      return failed;
    }));

    setSockets(prev => prev.map(sock =>
      sock.connectedService === serviceId
        ? { ...sock, status: 'error' as const, failureCount: sock.failureCount + 1, lastHeartbeat: new Date() }
        : sock
    ));

    addLog(generateLog('socket-event', `Unix socket detected failure on ${serviceId}`, serviceId, 'critical'));
    addLog(generateLog('failure-detected', `Express middleware detected downstream failure`, serviceId, 'critical'));
    addLog(generateLog('circuit-opened', `Circuit breaker OPENED for service`, serviceId, 'warning'));

    // Activate best fallback
    const serviceFallbacks = initialFallbacks
      .filter(f => f.serviceId === serviceId && f.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (serviceFallbacks.length > 0) {
      const best = serviceFallbacks[0];
      setActiveFallbacks(prev => new Map(prev).set(serviceId, best._id));
      addLog(generateLog('fallback-activated', `Activated fallback: "${best.label}" (quality: ${best.qualityScore}%)`, serviceId, 'warning'));
    }
  }, [addLog]);

  const recoverService = useCallback((serviceId: string) => {
    setServices(prev => prev.map(s => {
      if (s.id !== serviceId) return s;
      return {
        ...s,
        status: 'healthy' as const,
        errorRate: Math.random() * 0.5,
        latency: 10 + Math.random() * 80,
        circuitState: 'closed' as const,
        lastChecked: new Date(),
      };
    }));

    setSockets(prev => prev.map(sock =>
      sock.connectedService === serviceId
        ? { ...sock, status: 'connected' as const, lastHeartbeat: new Date() }
        : sock
    ));

    setActiveFallbacks(prev => {
      const next = new Map(prev);
      next.delete(serviceId);
      return next;
    });

    addLog(generateLog('service-recovered', `Service recovered, circuit breaker closing`, serviceId, 'info'));
    addLog(generateLog('circuit-closed', `Circuit breaker CLOSED`, serviceId, 'info'));
  }, [addLog]);

  const runShellScript = useCallback((scriptId: string) => {
    setScripts(prev => prev.map(s =>
      s.id === scriptId ? { ...s, status: 'running' as const, lastRun: new Date() } : s
    ));

    const script = scripts.find(s => s.id === scriptId);
    addLog(generateLog('shell-script-run', `Executing: ${script?.name}`, undefined, 'info'));

    setTimeout(() => {
      const outputs: Record<string, string> = {
        'sh-001': '✓ Imported 2,847 user records into fallbacks.cached_users\n✓ TTL set to 300s\n✓ MongoDB write concern: majority',
        'sh-002': '✓ Generated 500 mock user profiles\n✓ Generated 200 mock orders\n✓ Stored in fallbacks.mock_data\n✓ Schema validation passed',
        'sh-003': '✓ Pulled latest from origin/main\n✓ 3 policy files updated\n✓ Imported to config.policies\n✓ Git commit: a3f8b2c',
        'sh-004': '✓ user-api.sock: PONG (2ms)\n✓ mongodb.sock: PONG (1ms)\n✓ redis.sock: PONG (1ms)\n✓ rabbitmq.sock: PONG (3ms)\n✓ s3.sock: PONG (5ms)\n✓ auth.sock: PONG (2ms)',
      };
      setScripts(prev => prev.map(s =>
        s.id === scriptId ? { ...s, status: 'success' as const, output: outputs[scriptId] || '✓ Done' } : s
      ));
    }, 2000);
  }, [scripts, addLog]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isSimulating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setServices(prev => prev.map(s => {
        if (s.status === 'failed') return s;
        const jitter = (Math.random() - 0.5) * 20;
        const newLatency = Math.max(1, s.latency + jitter);
        const errJitter = (Math.random() - 0.5) * 2;
        const newErr = Math.max(0, Math.min(100, s.errorRate + errJitter));

        // Random degradation
        if (Math.random() < 0.02 && s.status === 'healthy') {
          return { ...s, status: 'degraded' as const, latency: newLatency * 3, errorRate: 15 + Math.random() * 20, circuitState: 'half-open' as const, lastChecked: new Date() };
        }

        // Random failure from degraded
        if (Math.random() < 0.05 && s.status === 'degraded') {
          setTimeout(() => triggerServiceFailure(s.id), 0);
          return s;
        }

        // Random recovery from degraded
        if (Math.random() < 0.08 && s.status === 'degraded') {
          return { ...s, status: 'healthy' as const, latency: 10 + Math.random() * 50, errorRate: Math.random() * 1, circuitState: 'closed' as const, lastChecked: new Date() };
        }

        return { ...s, latency: newLatency, errorRate: newErr, lastChecked: new Date() };
      }));
    }, 1500);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isSimulating, triggerServiceFailure]);

  return {
    services, fallbacks, policies, sockets, scripts, logs, isSimulating, activeFallbacks,
    triggerServiceFailure, recoverService, runShellScript, toggleSimulation, addLog,
    setFallbacks,
  };
}
