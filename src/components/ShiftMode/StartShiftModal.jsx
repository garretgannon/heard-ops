import { useState } from 'react';
import { useShiftMode } from '@/lib/ShiftModeContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { X, Zap, Sunrise, Sun, Moon, Clock } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const SHIFT_TYPES = [
  { id: 'opening',  label: 'Opening',  desc: 'AM open tasks',     icon: Sunrise, color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  { id: 'mid',      label: 'Mid',      desc: 'Mid-day support',   icon: Sun,     color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  { id: 'closing',  label: 'Closing',  desc: 'PM close tasks',    icon: Moon,    color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  { id: 'full',     label: 'Full Day', desc: 'All shift tasks',   icon: Clock,   color: 'text-primary',    bg: 'bg-primary/15' },
];

export default function StartShiftModal({ isOpen, onClose, locationId, locationName }) {
  const { startShift } = useShiftMode();
  const { user } = useCurrentUser();
  const [shiftType, setShiftType] = useState('full');
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    haptics.medium();
    await startShift(user?.email, user?.full_name, locationId, locationName, shiftType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Start Shift</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Choose your shift type</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SHIFT_TYPES.map(({ id, label, desc, icon: Icon, color, bg }) => (
            <button
              key={id}
              onClick={() => { haptics.light(); setShiftType(id); }}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all active:scale-95 text-center",
                shiftType === id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted hover:bg-muted/80"
              )}
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", bg)}>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <div className="text-center">
                <p className={cn("text-sm font-bold", shiftType === id ? "text-primary" : "text-foreground")}>{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all shadow-glow"
        >
          <Zap className="h-4 w-4" />
          {starting ? 'Starting...' : 'Start Shift'}
        </button>
      </div>
    </div>
  );
}