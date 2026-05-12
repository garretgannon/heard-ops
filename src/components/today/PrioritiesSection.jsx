import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const PRIORITY_CONFIG = {
  prep: { icon: '🧅', label: 'Prep', color: 'bg-green-500/10 border-green-500/20 hover:border-green-500/40' },
  sidework: { icon: '📋', label: 'Side Work', color: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40' },
  temperature: { icon: '🌡️', label: 'Temps', color: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40' },
  cleaning: { icon: '🧹', label: 'Cleaning', color: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40' },
  manager_note: { icon: '📝', label: 'Notes', color: 'bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40' },
  shift_handoff: { icon: '🔄', label: 'Handoff', color: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40' },
  beo: { icon: '🎉', label: 'Events', color: 'bg-pink-500/10 border-pink-500/20 hover:border-pink-500/40' },
  incident: { icon: '⚠️', label: 'Incidents', color: 'bg-red-500/10 border-red-500/20 hover:border-red-500/40' },
};

export default function PrioritiesSection({ priorities }) {
  const navigate = useNavigate();

  const ROUTE_MAP = {
    prep: '/tasks?tab=prep',
    sidework: '/tasks?tab=sidework',
    incident: '/logs?type=incident',
    maintenance: '/logs?type=maintenance',
    cleaning: '/logs?type=cleaning',
    temperature: '/logs?type=temperature',
  };

  const handleTap = (type) => {
    haptics.light?.();
    navigate(ROUTE_MAP[type] || `/tasks?filter=${type}`);
  };

  if (!priorities || priorities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="px-4 lg:px-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">My Priorities</h2>
      </div>

      <div className="space-y-1.5 px-4 lg:px-0">
        {priorities.map((priority) => {
          const config = PRIORITY_CONFIG[priority.type] || PRIORITY_CONFIG.prep;
          const hasOverdue = priority.overdueCount > 0;
          const hasDue = priority.dueCount > 0;

          return (
            <button
              key={priority.type}
              onClick={() => handleTap(priority.type)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all active:scale-95',
                hasOverdue
                  ? 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'
                  : hasDue
                    ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                    : config.color
              )}
            >
              {/* Icon */}
              <span className="text-xl flex-shrink-0">{config.icon}</span>

              {/* Content */}
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-foreground text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{priority.count}</p>
              </div>

              {/* Status Badges */}
              {(hasOverdue || hasDue) && (
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', hasOverdue ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}>
                  {hasOverdue ? priority.overdueCount : priority.dueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
