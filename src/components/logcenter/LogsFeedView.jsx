import { useState } from 'react';
import LogInboxCard from './LogInboxCard';
import LogQuickActionsMenu from './LogQuickActionsMenu';

export default function LogsFeedView({ logs, onLogClick, onLogUpdate }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Group by "needs attention" priority
  const needsAttention = logs.filter((l) => l.requires_review || l.status === 'open' || l.status === 'flagged');
  const normal = logs.filter((l) => !needsAttention.includes(l));

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground mb-2">Inbox Zero</p>
          <p className="text-sm text-muted-foreground">All caught up! ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Needs Attention Section */}
      {needsAttention.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">⚠️ Needs Attention</p>
          <div className="space-y-2">
            {needsAttention.map((log) => (
              <LogInboxCard
                key={log.id}
                log={log}
                onOpen={onLogClick}
                onMoreClick={(log) => {
                  setSelectedLog(log);
                  setShowQuickActions(true);
                }}
                onSwipeRight={() => {
                  // Approve/resolve
                  onLogUpdate?.(log.id, { status: 'resolved', requires_review: false });
                }}
                onSwipeLeft={() => {
                  // Escalate
                  onLogUpdate?.(log.id, { flagged: true });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Logs Section */}
      {normal.length > 0 && (
        <div>
          {needsAttention.length > 0 && <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-4 mb-2">Other Logs</p>}
          <div className="space-y-2">
            {normal.map((log) => (
              <LogInboxCard
                key={log.id}
                log={log}
                onOpen={onLogClick}
                onMoreClick={(log) => {
                  setSelectedLog(log);
                  setShowQuickActions(true);
                }}
                onSwipeRight={() => {
                  onLogUpdate?.(log.id, { status: 'resolved' });
                }}
                onSwipeLeft={() => {
                  onLogUpdate?.(log.id, { flagged: true });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Menu */}
      {showQuickActions && selectedLog && (
        <LogQuickActionsMenu
          log={selectedLog}
          onClose={() => {
            setShowQuickActions(false);
            setSelectedLog(null);
          }}
          onAction={(action) => {
            // Handle quick actions
            const updates = {
              approve: { status: 'resolved', requires_review: false },
              reject: { status: 'failed' },
              escalate: { flagged: true },
              comment: { /* handled separately */ },
            }[action];
            if (updates) {
              onLogUpdate?.(selectedLog.id, updates);
            }
            setShowQuickActions(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
}