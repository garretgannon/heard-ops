import { differenceInHours, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ApprovalMetrics({ total, remaining, processedToday, urgent, oldest }) {
  const progressPercent = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  const hoursOld = oldest ? differenceInHours(new Date(), parseISO(oldest)) : 0;

  const metrics = [
    { label: 'Pending', value: total, icon: Clock, status: 'status-info' },
    { label: 'Urgent', value: urgent, icon: AlertCircle, status: urgent > 0 ? 'status-critical' : 'status-neutral' },
    { label: 'Cleared', value: processedToday, icon: CheckCircle2, status: 'status-success' },
    { label: 'Oldest', value: `${hoursOld}h`, icon: Timer, status: hoursOld > 8 ? 'status-warning' : 'status-neutral' },
  ];

  return (
    <section className="app-card-lg space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="metric-label">Review queue</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-foreground">{remaining}</p>
            <p className="text-sm text-muted-foreground">left to clear</p>
          </div>
        </div>
        <div className="status-marker status-marker-lg status-warning">
          <span className="text-xs font-black leading-none tabular-nums">{progressPercent}%</span>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <span>Today's progress</span>
          <span className="text-primary">{processedToday} reviewed</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-border/50 bg-black/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-orange-400 to-green-500 shadow-[0_0_18px_hsl(var(--primary)/0.55)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {metrics.map(({ label, value, icon: Icon, status }) => (
          <div key={label} className="rounded-lg border border-border/40 bg-black/25 p-2.5 text-center">
            <div className={cn('status-marker status-marker-md mx-auto mb-2', status)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-black leading-none text-foreground">{value}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
