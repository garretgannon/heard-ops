import { format, parseISO, differenceInHours } from 'date-fns';
import { Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ApprovalMetrics({ total, remaining, processedToday, urgent, oldest }) {
  const progressPercent = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  const hoursOld = oldest ? differenceInHours(new Date(), parseISO(oldest)) : 0;

  return (
    <div className="bg-card border-b border-border/20 px-4 py-4 sticky top-0 z-20">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Today's progress</p>
          <p className="text-xs font-bold text-primary">{progressPercent}%</p>
        </div>
        <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">{processedToday} reviewed · {remaining} to clear</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Pending', value: total, icon: Clock, color: 'text-blue-400' },
          { label: 'Urgent', value: urgent, icon: AlertCircle, color: 'text-red-400' },
          { label: 'Cleared', value: processedToday, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Hours', value: hoursOld, icon: Zap, color: hoursOld > 8 ? 'text-orange-400' : 'text-muted-foreground', suffix: 'h' },
        ].map(({ label, value, icon: Icon, color, suffix }) => (
          <div key={label} className="rounded-lg bg-background border border-border/30 p-2 text-center">
            <Icon className={cn('h-3.5 w-3.5 mx-auto mb-1', color)} />
            <p className={cn('text-sm font-bold leading-none', color)}>{value}{suffix || ''}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}