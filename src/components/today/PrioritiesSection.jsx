import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const PRIORITY_ICONS = {
  prep: '🧅',
  sidework: '📋',
  temperature: '🌡️',
  cleaning: '🧹',
  manager_note: '📝',
  shift_handoff: '🔄',
  beo: '🎉',
  incident: '⚠️',
};

const PRIORITY_LABELS = {
  prep: 'Prep Tasks',
  sidework: 'Side Work',
  temperature: 'Temperature Logs',
  cleaning: 'Cleaning',
  manager_note: 'Manager Notes',
  shift_handoff: 'Shift Handoff',
  beo: 'Events & Reservations',
  incident: 'Incidents',
};

export default function PrioritiesSection({ priorities }) {
  const navigate = useNavigate();

  const handleTap = (type) => {
    haptics.light();
    // Navigate with task type filter
    navigate(`/tasks?filter=${type}`);
  };

  if (!priorities || priorities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="px-4 lg:px-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">My Priorities</h2>
      </div>

      <div className="space-y-2 px-4 lg:px-0">
        {priorities.map((priority) => {
          const hasOverdue = priority.overdueCount > 0;
          const hasDue = priority.dueCount > 0;

          return (
            <button
              key={priority.type}
              onClick={() => handleTap(priority.type)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.98]',
                hasOverdue
                  ? 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'
                  : hasDue
                    ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                    : 'bg-card border-border/40 hover:border-border/60'
              )}
            >
              {/* Icon */}
              <span className="text-2xl flex-shrink-0">{PRIORITY_ICONS[priority.type] || '📌'}</span>

              {/* Content */}
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-foreground text-sm">{PRIORITY_LABELS[priority.type]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {priority.count} {priority.count === 1 ? 'item' : 'items'}
                </p>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {hasOverdue && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {priority.overdueCount}
                  </span>
                )}
                {hasDue && !hasOverdue && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                    {priority.dueCount}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}