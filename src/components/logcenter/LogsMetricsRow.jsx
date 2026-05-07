export default function LogsMetricsRow({ logs, onMetricClick }) {
  const today = new Date().toDateString();
  
  const metrics = {
    total: logs.length,
    needsReview: logs.filter(l => l.requires_review).length,
    open: logs.filter(l => l.status === 'open').length,
    failedTemps: logs.filter(l => l.type === 'temperature' && l.status !== 'resolved').length,
    maintenance: logs.filter(l => l.type === 'maintenance' && l.status === 'open').length,
    resolved: logs.filter(l => l.status === 'resolved' && new Date(l.updated_date).toDateString() === today).length,
  };

  const cards = [
    { label: 'Total Logs Today', value: metrics.total, key: 'all' },
    { label: 'Needs Review', value: metrics.needsReview, key: 'needs_review' },
    { label: 'Open Issues', value: metrics.open, key: 'open' },
    { label: 'Failed Temps', value: metrics.failedTemps, key: 'temperature' },
    { label: 'Maintenance Open', value: metrics.maintenance, key: 'maintenance' },
    { label: 'Resolved Today', value: metrics.resolved, key: 'resolved' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-4 py-4 lg:px-8">
      {cards.map((card) => (
        <button
          key={card.key}
          onClick={() => onMetricClick?.(card.key)}
          className="p-4 rounded-lg bg-card border border-border/40 hover:border-border/60 hover:bg-card/80 transition-all active:scale-95"
        >
          <div className="text-2xl font-bold text-primary">{card.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
        </button>
      ))}
    </div>
  );
}