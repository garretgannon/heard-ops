import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShiftProgressCard({ completedCount, totalCount, status, nextDueTime }) {
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getStatusColor = () => {
    if (completionPct === 100) return { label: 'Complete', color: 'text-green-400', bg: 'bg-green-500/15' };
    if (completionPct >= 75) return { label: 'On Track', color: 'text-blue-400', bg: 'bg-blue-500/15' };
    if (completionPct >= 50) return { label: 'Progressing', color: 'text-yellow-400', bg: 'bg-yellow-500/15' };
    return { label: 'Behind', color: 'text-red-400', bg: 'bg-red-500/15' };
  };

  const statusConfig = getStatusColor();

  return (
    <div className="liquid-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Overall Progress</p>
          <p className="text-3xl font-extrabold text-primary mt-1">{completionPct}%</p>
        </div>
        <div className={cn('text-xs font-bold px-3 py-1.5 rounded-full border', statusConfig.bg, statusConfig.color)}>
          {statusConfig.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            {completedCount} of {totalCount} tasks
          </p>
          <p className="text-xs font-bold text-foreground">{completionPct}%</p>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Next Due Time */}
      {nextDueTime && (
        <div className="pt-2 border-t border-border/20 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span className="text-muted-foreground">
            Next due: <span className="font-semibold text-foreground">{nextDueTime}</span>
          </span>
        </div>
      )}
    </div>
  );
}