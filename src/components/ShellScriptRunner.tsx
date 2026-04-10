import { motion } from 'framer-motion';
import { Terminal, Play, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ShellScript } from '@/lib/types';

interface Props {
  scripts: ShellScript[];
  onRun: (id: string) => void;
}

export default function ShellScriptRunner({ scripts, onRun }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Shell Scripts</h2>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">Fallback data management</span>
      </div>

      {scripts.map((script, i) => (
        <motion.div
          key={script.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="p-3 rounded-lg border border-border bg-card"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-primary">{script.name}</span>
            <div className="ml-auto flex items-center gap-2">
              {script.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-warning animate-spin" />}
              {script.status === 'success' && <CheckCircle className="w-3.5 h-3.5 text-success" />}
              {script.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
              <button
                onClick={() => onRun(script.id)}
                disabled={script.status === 'running'}
                className="p-1.5 rounded bg-primary/20 hover:bg-primary/40 text-primary transition-colors disabled:opacity-50"
              >
                <Play className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{script.description}</p>

          <div className="mt-2 p-2 rounded bg-muted/50 font-mono text-[10px] text-muted-foreground whitespace-pre overflow-x-auto max-h-20">
            {script.command}
          </div>

          {script.output && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-2 rounded bg-success/5 border border-success/20 font-mono text-[10px] text-success whitespace-pre"
            >
              {script.output}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
