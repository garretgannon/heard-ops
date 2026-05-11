const summaryItems = [
  { key: 'totalActive', label: 'Active Today', statusClass: 'status-info' },
  { key: 'overdue', label: 'Overdue', statusClass: 'status-critical' },
  { key: 'needsReview', label: 'Review', statusClass: 'status-warning' },
  { key: 'completed', label: 'Completed', statusClass: 'status-success' },
];

export default function ActiveLogsSummary({ stats }) {
  return (
    <div className="px-4 py-3 bg-card border-b border-border">
      <div className="grid grid-cols-4 gap-2">
        {summaryItems.map(item => (
          <div key={item.key} className="flex flex-col items-center gap-1.5 text-center">
            <span className={`status-marker-sm ${item.statusClass}`}>{stats[item.key] || 0}</span>
            <p className="text-[9px] text-muted-foreground leading-tight">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
