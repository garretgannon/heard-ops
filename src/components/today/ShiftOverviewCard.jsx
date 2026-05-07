import { Activity, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShiftOverviewCard({
  completionPct = 0,
  completedCount = 0,
  totalCount = 0,
  overdueCount = 0,
  nextDueItem = null,
}) {
  const getStatus = () => {
    if (completionPct === 100) return { label: 'Complete', color: 'text-green-400', bg: 'bg-green-500/15' };
    if (overdueCount > 0) return { label: 'Needs Attention', color: 'text-red-400', bg: 'bg-red-500/15' };
    if (completionPct >= 75) return { label: 'On Track', color: 'text-blue-400', bg: 'bg-blue-500/15' };
    return { label: 'Behind', color: 'text-amber-400', bg: 'bg-amber-500/15' };
  };

  const status = getStatus();

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Shift Overview</h2>
            <p className="text-xs text-muted-foreground">Today's progress</p>
          </div>
        </div>
        <div className={cn('text-xs font-bold px-3 py-1.5 rounded-full border', status.bg, status.color)}>
          {status.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">Completion</p>
          <p className="text-xl font-extrabold text-primary">{completionPct}%</p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-lg font-extrabold text-foreground">{completedCount}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5">Completed</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-lg font-extrabold text-foreground">{totalCount}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5">Total</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className={cn('text-lg font-extrabold', overdueCount > 0 ? 'text-red-400' : 'text-green-400')}>
            {overdueCount}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5">Overdue</p>
        </div>
      </div>

      {/* Next Due Item */}
      {nextDueItem && (
        <div className="pt-3 border-t border-border/20">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Next Due</p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate">{nextDueItem.title}</p>
              <p className="text-xs text-muted-foreground">{nextDueItem.dueIn}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}