import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function MyShifts() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const allShifts = await base44.entities.StaffShift?.list?.('-start_time', 100).catch(() => []);
        const myShifts = allShifts?.filter((s) => s.assigned_to === user?.email) || [];
        setShifts(myShifts);
      } catch (err) {
        console.error('Failed to load shifts:', err);
      }
      setLoading(false);
    };
    if (user?.email) loadShifts();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const upcoming = shifts.filter((s) => new Date(s.start_time) > new Date());
  const past = shifts.filter((s) => new Date(s.start_time) <= new Date());

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'active') return <AlertCircle className="h-4 w-4 text-orange-500" />;
    return <Clock className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="pb-32 bg-background min-h-screen">
      <div className="sticky top-0 z-10 border-b border-border/20 px-4 lg:px-8 py-4 bg-background/95 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-foreground">My Shifts</h1>
        <p className="text-xs text-muted-foreground mt-1">{upcoming.length} upcoming</p>
      </div>

      <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto space-y-8">
        {/* Upcoming Shifts */}
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-muted-foreground">Upcoming</h3>
            <div className="space-y-2">
              {upcoming.map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => navigate(`/shift/${shift.id}`)}
                  className="w-full card-glass border border-border/30 rounded-lg p-4 hover:border-primary/50 transition-all active:scale-95 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(shift.status)}
                        <p className="font-bold text-foreground">{shift.role}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', {
                          'bg-green-500/20 text-green-400': shift.status === 'completed',
                          'bg-orange-500/20 text-orange-400': shift.status === 'active',
                          'bg-blue-500/20 text-blue-400': shift.status === 'pending',
                        })}>
                          {shift.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>{new Date(shift.start_time).toLocaleString()}</p>
                        {shift.area && <p>Area: {shift.area}</p>}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No upcoming shifts scheduled</p>
          </div>
        )}

        {/* Past Shifts */}
        {past.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-muted-foreground">History</h3>
            <div className="space-y-2">
              {past.slice(0, 5).map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => navigate(`/shift/${shift.id}`)}
                  className="w-full bg-card/50 border border-border/20 rounded-lg p-4 hover:bg-card transition-all active:scale-95 text-left opacity-75"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-foreground text-sm">{shift.role}</p>
                      <p className="text-xs text-muted-foreground">{new Date(shift.start_time).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 font-semibold">Completed</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;