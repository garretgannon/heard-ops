import { AlertTriangle } from 'lucide-react';

export default function ShiftProgress({ shift }) {
  if (!shift || shift.status === 'not_started' || shift.status === 'setup') return null;

  const taskProgress = shift.tasks_total > 0 ? Math.round((shift.tasks_completed / shift.tasks_total) * 100) : 0;
  const logProgress = shift.logs_total > 0 ? Math.round((shift.logs_completed / shift.logs_total) * 100) : 0;
  const overallProgress = Math.round((taskProgress + logProgress) / 2);

  return (
    <div className="card-glass border border-border rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Shift Progress</h3>
        <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
      </div>

      <div className="space-y-2">
        {/* Tasks Progress */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-secondary-text">Tasks</span>
            <span className="font-bold text-foreground">{shift.tasks_completed}/{shift.tasks_total}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${taskProgress}%` }} />
          </div>
        </div>

        {/* Logs Progress */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-secondary-text">Logs</span>
            <span className="font-bold text-foreground">{shift.logs_completed}/{shift.logs_total}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${logProgress}%` }} />
          </div>
        </div>

        {/* Critical Issues */}
        {shift.critical_issues_open > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-500/10 px-2 py-1.5 rounded">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-bold">{shift.critical_issues_open} critical issue{shift.critical_issues_open !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}