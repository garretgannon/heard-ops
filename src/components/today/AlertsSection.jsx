import { AlertTriangle, Thermometer, Clock, CheckSquare2, Wrench, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/utils/haptics';

const ALERT_TYPES = {
  overdue_prep: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    label: 'Overdue Prep',
  },
  missed_temps: {
    icon: Thermometer,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    label: 'Missed Temperature Logs',
  },
  pending_review: {
    icon: CheckSquare2,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    label: 'Pending Manager Review',
  },
  incidents: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    label: 'Open Incidents',
  },
  maintenance: {
    icon: Wrench,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
    label: 'Maintenance Follow-ups',
  },
  handoff_pending: {
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    label: 'Shift Handoff Pending',
  },
};

export default function AlertsSection({ alerts }) {
  const navigate = useNavigate();

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const handleAlert = (type) => {
    haptics.medium();
    const routes = {
      overdue_prep: '/tasks?filter=prep&status=overdue',
      missed_temps: '/tasks?filter=temperature&status=not_started',
      pending_review: '/tasks?status=needs_review',
      incidents: '/logs?filter=incident',
      maintenance: '/logs?filter=maintenance',
      handoff_pending: '/shift-handoff',
    };
    navigate(routes[type] || '/tasks');
  };

  return (
    <div className="space-y-3">
      <div className="px-4 lg:px-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">Alerts and Action Items</h2>
      </div>

      <div className="space-y-2 px-4 lg:px-0">
        {alerts.map((alert) => {
          const config = ALERT_TYPES[alert.type];
          const Icon = config?.icon || AlertTriangle;

          return (
            <button
              key={alert.type}
              onClick={() => handleAlert(alert.type)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 transition-all active:scale-[0.98]"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config?.bg}`}>
                <Icon className={`h-4 w-4 ${config?.color}`} />
              </div>

              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-foreground text-sm">{config?.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {alert.count} {alert.count === 1 ? 'item' : 'items'} - Action needed
                </p>
              </div>

              <span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
                {alert.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}