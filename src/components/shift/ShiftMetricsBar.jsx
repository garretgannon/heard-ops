import { CheckCircle2, Clock, AlertCircle, Eye, XCircle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShiftMetricsBar({ stats, tasks, selectedMetric, onMetricClick }) {
  const overdue = tasks.filter((t) => t.status === 'overdue').length;
  const needsReview = tasks.filter((t) => t.status === 'needs_review').length;
  const unableComplete = tasks.filter((t) => t.status === 'unable_to_complete').length;

  const metrics = [
    {
      id: 'all',
      label: 'Overall Progress',
      value: `${stats.completionPct}%`,
      icon: CheckCircle2,
      color: 'bg-green-500/15 text-green-400 border-green-500/30',
    },
    {
      id: 'complete',
      label: 'Tasks Complete',
      value: stats.completedCount,
      detail: `of ${stats.totalCount}`,
      icon: CheckCircle2,
      color: 'bg-green-500/15 text-green-400 border-green-500/30',
    },
    {
      id: 'remaining',
      label: 'Remaining',
      value: stats.totalCount - stats.completedCount,
      icon: Clock,
      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: overdue,
      icon: AlertCircle,
      color: 'bg-red-500/15 text-red-400 border-red-500/30',
    },
    {
      id: 'review',
      label: 'Needs Review',
      value: needsReview,
      icon: Eye,
      color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
    {
      id: 'unable',
      label: 'Unable Complete',
      value: unableComplete,
      icon: XCircle,
      color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-2">
      {metrics.map((m) => {
        const Icon = m.icon;
        const isSelected = selectedMetric === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onMetricClick(isSelected ? null : m.id)}
            className={cn(
              'p-3 rounded-lg border transition-all hover:scale-105 active:scale-95 text-left',
              isSelected ? `${m.color} ring-2 ring-offset-1 ring-offset-background` : `${m.color} opacity-75 hover:opacity-100`
            )}
          >
            <div className="flex items-start justify-between mb-1">
              <Icon className="h-4 w-4 flex-shrink-0" />
            </div>
            <div className="text-xl font-bold">{m.value}</div>
            <p className="text-[10px] font-semibold mt-0.5 leading-tight">{m.label}</p>
            {m.detail && <p className="text-[9px] opacity-70 mt-0.5">{m.detail}</p>}
          </button>
        );
      })}
    </div>
  );
}