import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TemperatureAlertsList({ onLogClick, filter = 'all' }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const logsToday = await base44.entities.UnifiedLog.filter({
          type: 'temperature',
        }).catch(() => []);

        let filtered = logsToday;

        if (filter === 'failed') {
          filtered = logsToday.filter(l => l.status === 'flagged' || l.custom_metadata?.passFail === 'fail');
        } else if (filter === 'missed') {
          const tasks = await base44.entities.Task.filter({ type: 'temperature' }).catch(() => []);
          const overdueTasks = tasks.filter(t => t.status === 'overdue');
          filtered = overdueTasks;
        } else if (filter === 'review') {
          filtered = logsToday.filter(l => l.requires_review || l.review_status === 'pending');
        }

        setAlerts(filtered.slice(0, 20));
        setLoading(false);
      } catch (err) {
        console.error('Failed to load temperature alerts:', err);
        setLoading(false);
      }
    };

    loadAlerts();
  }, [filter]);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (alerts.length === 0) {
    return (
      <div className="p-6 text-center">
        <CheckCircle className="h-8 w-8 text-status-success mx-auto mb-2 opacity-60" />
        <p className="text-muted-foreground text-sm">No alerts in this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const isTask = !alert.type || alert.type === 'task';
        const isFailed = alert.custom_metadata?.passFail === 'fail' || alert.status === 'flagged';
        const needsReview = alert.requires_review || alert.review_status === 'pending';

        return (
          <button
            key={alert.id}
            onClick={() => onLogClick?.(alert)}
            className={cn(
              'w-full text-left p-4 rounded-lg border transition-all active:scale-95',
              isFailed && 'border-status-critical/30 bg-status-critical/5 hover:bg-status-critical/10',
              needsReview && !isFailed && 'border-status-review/30 bg-status-review/5 hover:bg-status-review/10',
              !isFailed && !needsReview && 'border-border/40 bg-card hover:bg-card/80',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-foreground truncate">{alert.title}</h4>
                  {isFailed && <AlertTriangle className="h-4 w-4 text-status-critical flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mb-2 truncate">
                  {alert.location || alert.employee_name || 'No location'}
                </p>
                {alert.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </button>
        );
      })}
    </div>
  );
}