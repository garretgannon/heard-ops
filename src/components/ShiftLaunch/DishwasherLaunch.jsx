import { useState } from 'react';
import { Check, Droplets } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function DishwasherLaunch({ isOpen, onClose, onComplete, roleLabel }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="shrink-0 bg-gradient-to-b from-card via-card to-card/50 border-b border-border/50 px-4 pt-3 pb-4">
        <h1 className="text-xl font-bold text-foreground">{roleLabel} Launch</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Dish pit ready</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Station Setup</h2>
        
        <div className="space-y-2">
          <div className="bg-card border border-border rounded-lg p-2.5">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <p className="text-xs font-bold text-foreground">Machine sanitizer</p>
              <p className="ml-auto text-[9px] text-secondary-text">Stocked</p>
            </div>
          </div>
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
          <span className="text-xs text-foreground font-semibold">Dish pit is clean, organized, and ready.</span>
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