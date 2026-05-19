import { Clock, Eye, XCircle } from 'lucide-react';

export default function ShiftNeedsAttentionPanel({ tasks }) {
  const overdueTasks = tasks.filter((t) => t.status === 'overdue');
  const reviewTasks = tasks.filter((t) => t.status === 'needs_review');
  const unableTasks = tasks.filter((t) => t.status === 'unable_to_complete');

  const totalIssues = overdueTasks.length + reviewTasks.length + unableTasks.length;

  return (
    <div className="rounded-xl border border-border/30 card-glass p-4">
      <h3 className="font-bold text-foreground text-sm mb-3">Needs Attention</h3>

      {totalIssues === 0 ? (
        <p className="text-xs text-muted-foreground">All clear!</p>
      ) : (
        <div className="space-y-3">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-red-400" />
                <span className="text-xs font-bold text-foreground">Overdue ({overdueTasks.length})</span>
              </div>
              <div className="space-y-1 ml-6">
                {overdueTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className="text-[10px] text-muted-foreground truncate">
                    {t.title} — {t.assigned_employee_name || 'Unassigned'}
                  </div>
                ))}
                {overdueTasks.length > 3 && (
                  <p className="text-[10px] text-primary font-bold">+{overdueTasks.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          {/* Needs Review */}
          {reviewTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-foreground">Needs Review ({reviewTasks.length})</span>
              </div>
              <div className="space-y-1 ml-6">
                {reviewTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className="text-[10px] text-muted-foreground truncate">
                    {t.title} — {t.assigned_employee_name || 'Unassigned'}
                  </div>
                ))}
                {reviewTasks.length > 3 && (
                  <p className="text-[10px] text-primary font-bold">+{reviewTasks.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          {/* Unable to Complete */}
          {unableTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-bold text-foreground">Unable Complete ({unableTasks.length})</span>
              </div>
              <div className="space-y-1 ml-6">
                {unableTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className="text-[10px] text-muted-foreground truncate">
                    {t.title} — {t.assigned_employee_name || 'Unassigned'}
                  </div>
                ))}
                {unableTasks.length > 3 && (
                  <p className="text-[10px] text-primary font-bold">+{unableTasks.length - 3} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}