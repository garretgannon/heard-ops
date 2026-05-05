import { useState } from 'react';
import { useShiftMode } from '@/lib/ShiftModeContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { X, Zap } from 'lucide-react';
import { haptics } from '@/utils/haptics';

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-card rounded-t-2xl border-t border-border p-4 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Start Shift</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-secondary-text uppercase">Shift Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['opening', 'mid', 'closing', 'full'].map(type => (
              <button
                key={type}
                onClick={() => setShiftType(type)}
                className={`py-2.5 rounded-lg border font-bold text-sm transition-all ${
                  shiftType === type
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-muted border-border text-foreground hover:bg-muted/80'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          {starting ? 'Starting...' : 'Start Shift'}
        </button>
      </div>
    </div>
  );
}