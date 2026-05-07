import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const TASK_TYPE_ICONS = {
  prep: '🧅',
  sidework: '📋',
  temperature: '🌡️',
  cleaning: '🧹',
  manager_note: '📝',
  shift_handoff: '🔄',
  beo: '🎉',
  incident: '⚠️',
};

export default function UpNextList({ tasks, onViewAll }) {
  const navigate = useNavigate();

  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 lg:px-0">
        <h3 className="text-sm font-bold text-foreground">Up Next</h3>
        <button
          onClick={() => navigate('/tasks')}
          className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          View all →
        </button>
      </div>

      <div className="space-y-2 px-4 lg:px-0">
        {tasks.slice(0, 5).map((task, idx) => (
          <div
            key={task.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border transition-all',
              idx === 0 ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/30' : 'bg-card border-border/40 hover:border-border/60'
            )}
          >
            {/* Icon */}
            <span className="text-lg flex-shrink-0 mt-0.5">{TASK_TYPE_ICONS[task.type] || '📌'}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{task.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* View Full Plan Link */}
      <button
        onClick={() => navigate('/tasks')}
        className="w-full mx-4 lg:mx-0 h-10 rounded-lg border border-border/40 bg-transparent text-muted-foreground font-semibold text-sm hover:bg-secondary transition-all active:scale-95"
      >
        View Full Shift Plan
      </button>
    </div>
  );
}