import { Activity, TrendingUp } from 'lucide-react';
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
    <div className="card-glass border border-border/30 rounded-xl p-5 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground">Shift Status</h2>
            <p className="text-[11px] text-muted-foreground">Progress today</p>
          </div>
        </div>
        <div className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg border', status.bg, status.color)}>
          {status.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">Progress</p>
          <p className="text-lg font-bold text-primary">{completionPct}%</p>
        </div>
        <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 rounded-lg p-2.5 text-center">
          <p className="text-base font-bold text-foreground">{completedCount}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">Done</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 text-center">
          <p className="text-base font-bold text-foreground">{totalCount}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">Total</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 text-center">
          <p className={cn('text-base font-bold', overdueCount > 0 ? 'text-red-400' : 'text-green-400')}>
            {overdueCount}
          </p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">Overdue</p>
        </div>
      </div>

      {/* Next Due Item */}
      {nextDueItem && (
        <div className="pt-3 border-t border-border/20">
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Next</p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground text-sm truncate">{nextDueItem.title}</p>
              <p className="text-xs text-muted-foreground">{nextDueItem.dueIn}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}