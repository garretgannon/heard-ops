import { Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ActivityFeed({ logs, tasks }) {
  // Combine and sort by recent activity
  const recentLogs = logs.slice(0, 8);
  const recentTasks = tasks.filter((t) => t.status === 'complete' || t.status === 'approved').slice(0, 3);

  const feed = [
    ...recentLogs.map((l) => ({
      type: 'log',
      id: l.id,
      title: l.title,
      detail: l.employee_name || 'Unknown',
      time: l.created_date,
      icon: FileText,
      color: 'text-blue-400',
    })),
    ...recentTasks.map((t) => ({
      type: 'task',
      id: t.id,
      title: t.title,
      detail: t.assigned_employee_name || 'Unassigned',
      time: t.completed_timestamp,
      icon: CheckCircle2,
      color: 'text-green-400',
    })),
  ]
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 10);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-xl border border-border/30 card-glass p-5">
      <h3 className="font-bold text-foreground text-sm mb-4">Activity Feed</h3>
      <div className="space-y-2">
        {feed.length > 0 ? (
          feed.map((item) => {
            const Icon = item.icon;
            return (
              <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${item.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTime(item.time)}</span>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground">No recent activity</p>
        )}
      </div>
    </div>
  );
}