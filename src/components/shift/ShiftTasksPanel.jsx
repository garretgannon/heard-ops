import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TASK_TYPE_ICONS = {
  prep: '🔪',
  sidework: '🧹',
  temperature: '🌡️',
  cleaning: '🧹',
  handoff: '🔄',
  manager_note: '📝',
};

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'text-slate-400', icon: '◯' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', icon: '◐' },
  complete: { label: 'Complete', color: 'text-green-400', icon: '✓' },
  needs_review: { label: 'Review', color: 'text-purple-400', icon: '👁' },
  approved: { label: 'Approved', color: 'text-green-400', icon: '✓' },
  overdue: { label: 'Overdue', color: 'text-red-400', icon: '!' },
  unable_to_complete: { label: 'Unable', color: 'text-yellow-400', icon: '✗' },
};

export default function ShiftTasksPanel({ tasks, selectedEmployee, onTaskUpdate }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleTaskAction = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      await base44.entities.Task.update(taskId, { status: newStatus });
      toast.success('Task updated');
      onTaskUpdate?.();
    } catch (err) {
      toast.error('Failed to update task');
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (tasks.length === 0 && selectedEmployee) {
    return (
      <div className="rounded-xl border border-border/30 card-glass p-8 text-center">
        <p className="text-sm text-muted-foreground">{selectedEmployee.name} has no assigned tasks</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-border/30 card-glass p-8 text-center">
        <p className="text-sm font-semibold text-foreground mb-2">No shift plan assigned</p>
        <p className="text-xs text-muted-foreground">Create or assign tasks to start tracking this shift.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/30 card-glass p-4">
      <h3 className="font-bold text-foreground text-sm mb-3">
        {selectedEmployee ? `${selectedEmployee.name}'s Tasks` : 'Active Shift Tasks'}
      </h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {tasks.map((task) => {
          const typeIcon = TASK_TYPE_ICONS[task.type] || '📋';
          const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
          const isCompleted = ['complete', 'approved'].includes(task.status);

          return (
            <div
              key={task.id}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isCompleted ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/40 border-border/30'
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">{typeIcon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={cn('text-xs font-bold truncate', isCompleted && 'line-through opacity-60')}>
                      {task.title}
                    </p>
                    <span className={cn('text-[10px] font-bold flex-shrink-0', statusConfig.color)}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2 flex-wrap">
                    {task.assigned_employee_name && (
                      <>
                        <span>👤 {task.assigned_employee_name}</span>
                        <span>•</span>
                      </>
                    )}
                    {task.station && (
                      <>
                        <span>📍 {task.station}</span>
                        <span>•</span>
                      </>
                    )}
                    {task.due_time && <span>⏰ {task.due_time}</span>}
                  </div>

                  {/* Quick Actions */}
                  {!isCompleted && (
                    <div className="flex gap-1">
                      {task.status !== 'in_progress' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'in_progress')}
                          disabled={updatingId === task.id}
                          className="px-2 py-1 text-[10px] font-bold rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => handleTaskAction(task.id, 'complete')}
                        disabled={updatingId === task.id}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleTaskAction(task.id, 'needs_review')}
                        disabled={updatingId === task.id}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleTaskAction(task.id, 'unable_to_complete')}
                        disabled={updatingId === task.id}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Unable
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}