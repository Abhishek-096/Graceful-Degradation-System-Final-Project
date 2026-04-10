import { motion } from 'framer-motion';
import { GitBranch, FileCode, CheckCircle } from 'lucide-react';
import { DegradationPolicy } from '@/lib/types';

interface Props {
  policies: DegradationPolicy[];
}

export default function DegradationPolicies({ policies }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Git-Tracked Degradation Policies</h2>
      </div>

      {policies.map((policy, i) => (
        <motion.div
          key={policy.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="p-4 rounded-lg border border-border bg-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{policy.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{policy.version}</span>
            {policy.active && <CheckCircle className="w-3.5 h-3.5 text-success ml-auto" />}
          </div>

          <div className="flex gap-3 text-[10px] font-mono text-muted-foreground mb-3">
            <span>commit: <span className="text-primary">{policy.gitCommit}</span></span>
            <span>by: {policy.author}</span>
            <span>{policy.timestamp.toLocaleDateString()}</span>
          </div>

          <div className="space-y-1.5">
            {policy.rules.map((rule, ri) => (
              <div key={ri} className="p-2 rounded bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-warning">IF</span>
                  <span className="text-foreground">{rule.condition}</span>
                  <span className="text-primary">→</span>
                  <span className="text-success">{rule.action}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-muted-foreground">Fallback chain:</span>
                  {rule.fallbackChain.map((f, fi) => (
                    <span key={fi} className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary">
                      {fi > 0 && '→ '}{f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
