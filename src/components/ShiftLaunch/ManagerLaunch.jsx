import { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function ManagerLaunch({ isOpen, onClose, onComplete, roleLabel }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="shrink-0 bg-gradient-to-b from-card via-card to-card/50 border-b border-border/50 px-4 pt-3 pb-4">
        <h1 className="text-xl font-bold text-foreground">{roleLabel} Launch</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Operational command center</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Daily Brief</h2>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-red-300">Critical: Saute cooler alert</p>
              <p className="text-red-400/70 mt-0.5">Temp 44F, needs immediate attention</p>
            </div>
          </div>
        </div>

        <div className="card-glass border border-border rounded-lg p-3 text-xs space-y-2 text-secondary-text">
          <p>Staffing: Full (0 call-outs)</p>
          <p>Projected covers: 120</p>
          <p>Prep status: 85% complete</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => {
              haptics.light?.();
              setAcknowledged(e.target.checked);
            }}
            className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-xs text-foreground font-semibold">I acknowledge all alerts and am ready to manage operations.</span>
        </label>

        <button
          onClick={() => {
            haptics.medium?.();
            onComplete?.();
          }}
          disabled={!acknowledged}
          className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Launch
        </button>
      </div>
    </div>
  );
}