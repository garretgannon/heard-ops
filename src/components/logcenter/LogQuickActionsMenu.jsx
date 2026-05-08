import { CheckCircle2, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function LogQuickActionsMenu({ log, onClose, onAction }) {
  const actions = [
    { id: 'approve', icon: CheckCircle2, label: 'Approve', color: 'text-green-500', bg: 'hover:bg-green-500/10' },
    { id: 'reject', icon: XCircle, label: 'Reject', color: 'text-red-500', bg: 'hover:bg-red-500/10' },
    { id: 'escalate', icon: AlertCircle, label: 'Escalate', color: 'text-amber-500', bg: 'hover:bg-amber-500/10' },
    { id: 'comment', icon: MessageSquare, label: 'Comment', color: 'text-blue-500', bg: 'hover:bg-blue-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* Menu */}
      <div className="relative w-full bg-card border-t border-border/30 rounded-t-2xl px-4 py-4 space-y-2">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  haptics.medium?.();
                  onAction?.(action.id);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border border-border/20 ${action.bg} transition-all active:scale-95`}
              >
                <Icon className={`h-5 w-5 ${action.color}`} />
                <p className="text-xs font-bold text-foreground text-center">{action.label}</p>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2 rounded-lg bg-background/50 text-foreground font-semibold text-sm hover:bg-background transition-all">
          Close
        </button>
      </div>
    </div>
  );
}