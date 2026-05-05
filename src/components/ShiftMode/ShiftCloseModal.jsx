import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShiftCloseModal({ shiftSession, onClose, isLoading }) {
  const [score, setScore] = useState(85);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
      <div className="relative bg-background border-t border-border rounded-t-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="w-8 h-0.5 bg-border rounded-full mx-auto" />

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
            <LogOut className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Close Shift</p>
            <p className="text-xs text-muted-foreground mt-0.5">Complete today's shift and hand off to next manager</p>
          </div>
        </div>

        {/* Shift Score Slider */}
        <div className="bg-card border border-border rounded-lg p-3 space-y-2">
          <label className="block">
            <span className="text-xs font-semibold text-foreground">Shift Score</span>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={e => setScore(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className={cn(
                "text-lg font-bold w-12 text-center",
                score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'
              )}>
                {score}
              </span>
            </div>
          </label>
        </div>

        {/* Metrics Summary */}
        <div className="bg-card border border-border rounded-lg p-3 grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">{shiftSession.prep_completion_pct || 0}%</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">Prep Done</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">{shiftSession.temp_check_count || 0}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">Temp Checks</p>
          </div>
          <div className="text-center col-span-2">
            <p className="text-lg font-bold text-amber-400">{shiftSession.incidents_count || 0}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">Incidents</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Handoff Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Key items for next shift..."
            rows={3}
            className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-card text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 rounded-lg border border-border font-bold text-sm text-muted-foreground hover:bg-card transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => onClose(score, notes)}
            disabled={isLoading}
            className="flex-1 h-11 rounded-lg bg-red-600 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Closing..." : "Close Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}