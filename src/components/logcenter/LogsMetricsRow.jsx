export default function LogsMetricsRow({ logs, onMetricClick }) {
  const today = new Date().toISOString().split('T')[0];
  
  const metrics = [
    {
      label: 'Total Logs Today',
      value: logs.filter(l => l.created_date?.startsWith(today)).length,
      filter: 'today'
    },
    {
      label: 'Needs Review',
      value: logs.filter(l => l.requires_review).length,
      filter: 'needs_review'
    },
    {
      label: 'Open Issues',
      value: logs.filter(l => l.status === 'open').length,
      filter: 'open'
    },
    {
      label: 'Failed Temps',
      value: logs.filter(l => l.type === 'temperature' && l.custom_metadata?.passFail === 'fail').length,
      filter: 'failed_temps'
    },
    {
      label: 'Overdue Follow-ups',
      value: logs.filter(l => l.follow_up_required && l.follow_up_due_date && new Date(l.follow_up_due_date) < new Date()).length,
      filter: 'overdue_followup'
    },
    {
      label: 'Resolved Today',
      value: logs.filter(l => l.status === 'resolved' && l.resolved_timestamp?.startsWith(today)).length,
      filter: 'resolved_today'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {metrics.map((metric) => (
        <button
          key={metric.filter}
          onClick={() => onMetricClick?.(metric.filter)}
          className="p-3 rounded-lg bg-card border border-border/30 hover:border-border/60 transition-all active:scale-95 text-left"
        >
          <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
          <p className="text-2xl font-bold text-foreground">{metric.value}</p>
        </button>
      ))}
    </div>
  );
}