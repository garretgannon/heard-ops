import { CheckCircle2, Clock, AlertCircle, Eye, AlertTriangle } from 'lucide-react';

export default function MetricsCards({ stats, priorities, onMetricClick }) {
  const metrics = [
    {
      key: 'progress',
      label: 'Shift Progress',
      value: `${stats.completionPct}%`,
      icon: CheckCircle2,
      color: 'bg-green-500/15 text-green-400 border-green-500/30',
      detail: `${stats.completedCount}/${stats.totalCount} done`,
      onClick: () => {},
    },
    {
      key: 'prep',
      label: 'Prep Tasks',
      value: priorities.find((p) => p.type === 'prep')?.count || 0,
      icon: Clock,
      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      detail: `${priorities.find((p) => p.type === 'prep')?.overdueCount || 0} overdue`,
      onClick: () => onMetricClick('prep'),
    },
    {
      key: 'sidework',
      label: 'Side Work',
      value: priorities.find((p) => p.type === 'sidework')?.count || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      detail: `${priorities.find((p) => p.type === 'sidework')?.dueCount || 0} due`,
      onClick: () => onMetricClick('sidework'),
    },
    {
      key: 'review',
      label: 'Logs for Review',
      value: stats.logsNeedingReview || 0,
      icon: Eye,
      color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      detail: 'Awaiting approval',
      onClick: () => onMetricClick('review'),
    },
    {
      key: 'incidents',
      label: 'Open Issues',
      value: stats.openIncidents || 0,
      icon: AlertCircle,
      color: 'bg-red-500/15 text-red-400 border-red-500/30',
      detail: 'Incidents & maintenance',
      onClick: () => onMetricClick('incidents'),
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.key}
            onClick={m.onClick}
            className={`p-4 rounded-xl border transition-all hover:scale-105 active:scale-95 text-left ${m.color}`}
          >
            <div className="flex items-start justify-between mb-2">
              <Icon className="h-5 w-5 flex-shrink-0" />
            </div>
            <div className="text-2xl font-bold">{m.value}</div>
            <p className="text-xs font-semibold mt-1">{m.label}</p>
            <p className="text-[10px] opacity-75 mt-0.5">{m.detail}</p>
          </button>
        );
      })}
    </div>
  );
}