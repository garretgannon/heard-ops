import { useState } from 'react';
import { Check, Users } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function FOHLeadLaunch({ isOpen, onClose, onComplete, roleLabel }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="shrink-0 bg-gradient-to-b from-card via-card to-card/50 border-b border-border/50 px-4 pt-3 pb-4">
        <h1 className="text-xl font-bold text-foreground">{roleLabel} Launch</h1>
        <p className="text-xs text-muted-foreground mt-0.5">FOH team briefing</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Service Brief</h2>
        
        <div className="space-y-2">
          <div className="bg-card border border-border rounded-lg p-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-foreground">Team staffing</p>
                <p className="text-secondary-text mt-0.5">5 servers, 2 hosts, full coverage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 text-xs space-y-2 text-secondary-text">
          <p>Today's specials: Halibut, Steak Frites</p>
          <p>Projected covers: 120</p>
          <p>VIP: 2 tables reserved</p>
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
          <span className="text-xs text-foreground font-semibold">FOH team is briefed and ready to serve.</span>
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
          Launch Service
        </button>
      </div>
    </div>
  );
}