import { Thermometer, Clock, AlertTriangle, CheckSquare } from 'lucide-react';

export default function LogsInboxHeader({ logs, onStatClick }) {
  const stats = [
    {
      id: 'today',
      icon: Clock,
      label: 'Logs Today',
      value: logs.filter((l) => {
        const created = new Date(l.created_date);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length,
      color: 'text-blue-500',
    },
    {
      id: 'review',
      icon: CheckSquare,
      label: 'Needs Review',
      value: logs.filter((l) => l.requires_review || l.status === 'open').length,
      color: 'text-amber-500',
    },
    {
      id: 'temp_failed',
      icon: Thermometer,
      label: 'Failed Temps',
      value: logs.filter((l) => l.type === 'temperature' && l.status === 'failed').length,
      color: 'text-red-500',
    },
    {
      id: 'issues',
      icon: AlertTriangle,
      label: 'Open Issues',
      value: logs.filter((l) => l.type === 'incident' && l.status === 'open').length,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="lg:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3">
      <h1 className="text-2xl font-black tracking-tight text-foreground mb-3">Logs</h1>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.id}
              onClick={() => onStatClick?.(stat.id)}
              className="flex flex-col items-center gap-1 p-2.5 rounded-lg card-glass border border-border/30 hover:border-border/60 active:scale-95 transition-all"
            >
              <Icon className={`h-4 w-4 ${stat.color}`} />
              <p className="text-xs font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground text-center leading-tight">{stat.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}