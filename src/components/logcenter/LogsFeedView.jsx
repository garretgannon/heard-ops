import LogInboxCard from './LogInboxCard';

export default function LogsFeedView({ logs, onLogClick }) {
  const needsAttention = logs.filter((l) => l.requires_review || l.status === 'open' || l.status === 'flagged');
  const normal = logs.filter((l) => !needsAttention.includes(l));

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-base font-bold text-foreground mb-1">Inbox Zero</p>
        <p className="text-sm text-muted-foreground">All caught up ✨</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needsAttention.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 mb-2 px-1">⚠ Needs Attention</p>
          <div className="space-y-1.5">
            {needsAttention.map((log) => (
              <LogInboxCard key={log.id} log={log} onOpen={onLogClick} />
            ))}
          </div>
        </div>
      )}

      {normal.length > 0 && (
        <div>
          {needsAttention.length > 0 && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 px-1">Other Logs</p>
          )}
          <div className="space-y-1.5">
            {normal.map((log) => (
              <LogInboxCard key={log.id} log={log} onOpen={onLogClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}