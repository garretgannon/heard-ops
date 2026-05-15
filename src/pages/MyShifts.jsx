import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Clock, AlertCircle, CheckCircle2, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function statusStyle(status) {
  if (status === 'completed') return { color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10' };
  if (status === 'active')    return { color: 'text-primary',   border: 'border-primary/30',   bg: 'bg-primary/10' };
  return                             { color: 'text-blue-400',  border: 'border-blue-500/30',  bg: 'bg-blue-500/10' };
}

function statusIcon(status) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-400" />;
  if (status === 'active')    return <AlertCircle  className="h-4 w-4 text-primary" />;
  return                             <Clock        className="h-4 w-4 text-blue-400" />;
}

function ShiftCard({ shift, onClick, dim }) {
  const s = statusStyle(shift.status);
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: dim ? 0.55 : 1, y: 0 }}
      onClick={onClick}
      className={cn('flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.97]', s.border)}
      style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', s.border, s.bg)}>
        {statusIcon(shift.status)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-foreground truncate">{shift.role || 'Shift'}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(shift.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        {shift.area && <p className="mt-0.5 text-[10px] font-bold text-muted-foreground">{shift.area}</p>}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-black capitalize', s.border, s.bg, s.color)}>
          {shift.status || 'scheduled'}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </motion.button>
  );
}

export default function MyShifts() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [shifts, setShifts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.StaffShift?.list?.('-start_time', 100)
      .catch(() => [])
      .then(all => {
        setShifts((all || []).filter(s => s.assigned_to === user.email));
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="app-screen flex flex-col items-center justify-center gap-3 pb-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent"
          style={{ boxShadow: '0 0 20px rgba(230,106,31,0.35)' }}
        />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading shifts…</p>
      </div>
    );
  }

  const now = new Date();
  const upcoming = shifts.filter(s => new Date(s.start_time) > now);
  const past     = shifts.filter(s => new Date(s.start_time) <= now);

  return (
    <div className="app-screen">
      <DesktopPageHeader title="My Shifts" />
      <main className="app-page mx-auto max-w-[520px] lg:max-w-5xl space-y-5">

        <header className="flex items-start justify-between gap-4 pt-1 lg:hidden">
          <div>
            <p className="metric-label">Schedule</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">My Shifts</h1>
          </div>
          <div
            className="rounded-xl border border-border/40 px-3 py-2 text-right"
            style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.97) 0%, rgba(6,9,13,0.97) 100%)' }}
          >
            <p className="text-lg font-black text-foreground">{upcoming.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground">Upcoming</p>
          </div>
        </header>

        <div className="lg:mt-0">{shifts.length === 0 ? (
          <div className="app-card py-14 text-center">
            <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">No shifts scheduled</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="space-y-2">
                <p className="metric-label px-1">Upcoming</p>
                {upcoming.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} onClick={() => navigate(`/shift/${shift.id}`)} />
                ))}
              </section>
            )}

            {past.length > 0 && (
              <section className="space-y-2">
                <p className="metric-label px-1">History</p>
                {past.slice(0, 8).map(shift => (
                  <ShiftCard key={shift.id} shift={shift} onClick={() => navigate(`/shift/${shift.id}`)} dim />
                ))}
              </section>
            )}
          </>
        )}</div>

      </main>
    </div>
  );
}

export const hideBase44Index = true;
