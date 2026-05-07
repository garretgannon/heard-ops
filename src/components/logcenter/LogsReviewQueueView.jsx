export default function LogsReviewQueueView({ logs, onLogClick }) {
  const reviewLogs = logs.filter(l => l.requires_review);

  if (reviewLogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No logs requiring review</p>
        <p className="text-sm text-muted-foreground mt-2">All caught up! 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reviewLogs.map((log) => (
        <button
          key={log.id}
          onClick={() => onLogClick?.(log)}
          className="w-full text-left p-4 rounded-lg bg-card border border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all active:scale-95"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{log.title}</h3>
                <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-xs font-bold flex-shrink-0">
                  Review
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{log.employee_name}</p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {new Date(log.created_date).toLocaleDateString()}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}