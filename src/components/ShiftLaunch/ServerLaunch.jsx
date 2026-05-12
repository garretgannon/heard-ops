import { useState } from 'react';
import { Check } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function ServerLaunch({ isOpen, onClose, onComplete, roleLabel }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="shrink-0 bg-gradient-to-b from-card via-card to-card/50 border-b border-border/50 px-4 pt-3 pb-4">
        <h1 className="text-xl font-bold text-foreground">{roleLabel} Launch</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Ready to serve</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Shift Briefing</h2>
        <div className="card-glass border border-border rounded-lg p-3 space-y-2 text-xs text-secondary-text">
          <p>Review today's reservations, specials, and service notes from FOH lead.</p>
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
          <span className="text-xs text-foreground font-semibold">I am ready to begin service.</span>
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
          Start Shift
        </button>
      </div>
    </div>
  );
}