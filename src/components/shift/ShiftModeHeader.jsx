import { Settings, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShiftMode } from '@/lib/ShiftModeContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function ShiftModeHeader() {
  const navigate = useNavigate();
  const { currentShift } = useShiftMode();
  const { user } = useCurrentUser();

  const shiftName = currentShift?.shift_type
    ? currentShift.shift_type.charAt(0).toUpperCase() + currentShift.shift_type.slice(1) + ' Shift'
    : 'Shift Mode';

  const shiftStart = currentShift?.created_date
    ? new Date(currentShift.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="sticky top-0 z-30 glass-header px-4 py-4 lg:px-8">
      <div className="flex items-center justify-between gap-4 mb-3">
        <button
          onClick={() => navigate('/')}
          className="h-8 w-8 rounded-2xl hover:bg-secondary flex items-center justify-center transition-all active:scale-95"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground">{shiftName}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user?.full_name} • {user?.role || 'Staff'}
          </p>
        </div>

        <button className="h-8 w-8 rounded-2xl hover:bg-secondary flex items-center justify-center transition-all active:scale-95">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {shiftStart && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          Started at {shiftStart}
        </div>
      )}
    </div>
  );
}