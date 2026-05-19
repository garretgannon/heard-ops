import { useContext } from 'react';
import { ShiftModeContext } from '@/lib/ShiftModeContext';
import { User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ShiftHeader() {
  const { shiftSession, isClosing } = useContext(ShiftModeContext);

  if (!shiftSession || !['in_progress', 'closing'].includes(shiftSession.status)) return null;

  const elapsed = shiftSession.start_time ? formatDistanceToNow(new Date(shiftSession.start_time)) : '--';

  return (
    <div className={`sticky top-0 z-30 border-b px-4 py-2.5 flex items-center justify-between ${
      isClosing ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full animate-pulse ${isClosing ? 'bg-red-500' : 'bg-primary'}`} />
        <div>
          <p className="text-xs font-bold text-foreground">
            {isClosing ? '🔴 Closing Shift' : '🟢 Shift Active'}
          </p>
          <p className="text-[9px] text-muted-foreground">{elapsed}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <User className="h-3 w-3" />
        <span className="font-semibold">{shiftSession.manager_name}</span>
      </div>
    </div>
  );
}