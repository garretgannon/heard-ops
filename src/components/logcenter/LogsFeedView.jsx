import LogInboxCard from './LogInboxCard';
import { CheckSquare } from 'lucide-react';

export default function LogsFeedView({ logs, onLogClick }) {
  const needsAttention = logs.filter((l) => l.requires_review || l.status === 'open' || l.status === 'flagged');
  const normal = logs.filter((l) => !needsAttention.includes(l));

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="h-[46px] w-[46px] rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center mb-4" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          <CheckSquare className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <p className="text-[15px] font-extrabold text-foreground/80 mb-1 tracking-tight">Inbox Zero</p>
        <p className="text-[13px] font-medium text-muted-foreground/60">All operational logs are caught up.</p>
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