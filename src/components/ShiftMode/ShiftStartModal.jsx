import { useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShiftStartModal({ manager, onStart, isLoading }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
      <div className="relative bg-background border-t border-border rounded-t-2xl p-4 space-y-4">
        <div className="w-8 h-0.5 bg-border rounded-full mx-auto" />

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Play className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Start Shift</p>
            <p className="text-xs text-muted-foreground mt-0.5">Begin today's operations with {manager?.full_name}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-amber-400">Before you start:</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Review today's schedule and staffing</li>
            <li>Check prep lists and inventory</li>
            <li>Brief team on priorities</li>
          </ul>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-xs text-muted-foreground">I'm ready to start shift mode</span>
        </label>

        <div className="flex gap-2">
          <button
            disabled={isLoading}
            onClick={onStart}
            disabled={!confirmed || isLoading}
            className={cn(
              "flex-1 h-11 rounded-lg font-bold text-sm transition-all active:scale-95",
              confirmed && !isLoading
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            {isLoading ? "Starting..." : "Start Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}