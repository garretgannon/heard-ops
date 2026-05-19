import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TASK_TYPE_CONFIG = {
  prep: { icon: '🧅', color: 'bg-green-500/10 border-green-500/20' },
  sidework: { icon: '📋', color: 'bg-orange-500/10 border-orange-500/20' },
  temperature: { icon: '🌡️', color: 'bg-blue-500/10 border-blue-500/20' },
  cleaning: { icon: '🧹', color: 'bg-purple-500/10 border-purple-500/20' },
  manager_note: { icon: '📝', color: 'bg-violet-500/10 border-violet-500/20' },
  shift_handoff: { icon: '🔄', color: 'bg-indigo-500/10 border-indigo-500/20' },
  beo: { icon: '🎉', color: 'bg-pink-500/10 border-pink-500/20' },
  incident: { icon: '⚠️', color: 'bg-red-500/10 border-red-500/20' },
};

export default function UpNextList({ tasks, onViewAll }) {
  const navigate = useNavigate();

  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4 lg:px-0">
        <h3 className="text-sm font-bold text-foreground">Up Next</h3>
        <button
          onClick={() => navigate('/tasks')}
          className="text-xs font-semibold text-primary hover:brightness-110 transition-all"
        >
          All →
        </button>
      </div>

      <div className="space-y-1.5 px-4 lg:px-0">
        {tasks.slice(0, 5).map((task, idx) => {
          const config = TASK_TYPE_CONFIG[task.type] || { icon: '📌', color: 'bg-slate-500/10 border-slate-500/20' };
          return (
            <div
              key={task.id}
              className={cn(
                'flex items-start gap-2.5 px-3 py-2 rounded-lg border transition-all',
                idx === 0 ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/40' : cn('bg-card', config.color)
              )}
            >
              {/* Icon */}
              <span className="text-base flex-shrink-0 mt-0.5">{config.icon}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{task.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  {task.station && <span>{task.station}</span>}
                  {task.due_time && (
                    <>
                      <span>•</span>
                      <span>{task.due_time}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {/* View Full Plan Link */}
      <button
        onClick={() => navigate('/tasks')}
        className="w-full mx-4 lg:mx-0 h-9 rounded-lg border border-border/30 card-glass text-muted-foreground font-semibold text-xs hover:border-border/50 transition-all active:scale-95"
      >
        View Shift Plan
      </button>
    </div>
  );
}