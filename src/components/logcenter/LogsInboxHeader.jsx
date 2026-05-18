import { useNavigate } from 'react-router-dom';
import { Thermometer, Clock, AlertTriangle, CheckSquare, ChevronLeft, Bell, UserCircle } from 'lucide-react';

export default function LogsInboxHeader({ logs, onStatClick }) {
  const navigate = useNavigate();

  const stats = [
    {
      id: 'today',
      icon: Clock,
      label: 'Today',
      value: logs.filter((l) => {
        const created = new Date(l.created_date);
        return created.toDateString() === new Date().toDateString();
      }).length,
      color: 'text-blue-400',
    },
    {
      id: 'review',
      icon: CheckSquare,
      label: 'Review',
      value: logs.filter((l) => l.requires_review || l.status === 'open').length,
      color: 'text-amber-400',
    },
    {
      id: 'temp_failed',
      icon: Thermometer,
      label: 'Temps',
      value: logs.filter((l) => l.type === 'temperature' && l.status === 'failed').length,
      color: 'text-red-400',
    },
    {
      id: 'issues',
      icon: AlertTriangle,
      label: 'Issues',
      value: logs.filter((l) => l.type === 'incident' && l.status === 'open').length,
      color: 'text-red-400',
    },
  ];

  return (
    <div
      className="lg:hidden sticky top-0 z-10"
      style={{ background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 h-8 rounded-full bg-white/[0.06] border border-border/30 px-3"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Back</span>
        </button>
        <span className="text-[15px] font-black text-foreground">Logs</span>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.id}
              onClick={() => onStatClick?.(stat.id)}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border/20 active:scale-95 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <Icon className={`h-4 w-4 ${stat.color}`} />
              <p className="text-sm font-black text-foreground">{stat.value}</p>
              <p className="text-[9px] font-bold text-muted-foreground text-center leading-tight">{stat.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}