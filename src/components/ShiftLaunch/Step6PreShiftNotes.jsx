import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function Step6PreShiftNotes({ onComplete }) {
  const [notes, setNotes] = useState('');
  const [focus, setFocus] = useState('');

  const handleComplete = () => {
    haptics.medium?.();
    onComplete(6, { 
      shiftFocus: focus,
      notes: notes,
      timestamp: new Date().toISOString()
    });
  };

  const isValid = focus.trim().length > 0 && notes.trim().length > 0;

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Pre-Shift Notes</h2>
        <p className="text-xs text-secondary-text">Set your shift priorities and reminders</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">Shift Focus</label>
          <input
            type="text"
            placeholder="e.g., High volume event, New staff training, Inventory count..."
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="w-full px-3 py-2.5 card-glass border border-border rounded-lg text-xs placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">Important Reminders</label>
          <textarea
            placeholder="Menu changes, specials, 86 items, operational priorities, team announcements..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="w-full px-3 py-2.5 card-glass border border-border rounded-lg text-xs placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
        <p className="text-[10px] text-secondary-text">
          These notes will be displayed to your team as shift priorities and will be included in today's handoff documentation.
        </p>
      </div>

      <button
        onClick={handleComplete}
        disabled={!isValid}
        className={cn(
          'w-full h-9 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all',
          isValid
            ? 'bg-primary text-primary-foreground active:scale-95'
            : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
        )}
      >
        <Check className="h-4 w-4" />
        Save and Continue
      </button>
    </div>
  );
}