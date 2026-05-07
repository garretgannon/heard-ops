import { Plus, Flame, Thermometer, Zap, CheckSquare2, AlertTriangle } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

export default function QuickActionsBar({ role, onAction }) {
  const actions = (() => {
    const base = [
      { id: 'add_log', icon: Plus, label: 'Add Log', color: 'text-primary' },
      { id: 'temp_log', icon: Thermometer, label: 'Temp', color: 'text-cyan-400' },
      { id: 'create_task', icon: CheckSquare2, label: 'Task', color: 'text-blue-400' },
      { id: 'report_issue', icon: AlertTriangle, label: 'Issue', color: 'text-red-400' },
    ];

    if (role === 'admin' || role === 'manager') {
      base.push({ id: 'handoff', icon: Zap, label: 'Handoff', color: 'text-amber-400' });
    }

    return base;
  })();

  const handleTap = (id) => {
    haptics.light();
    onAction?.(id);
  };

  return (
    <div className="px-4 lg:px-0">
      <div className="grid grid-cols-5 lg:grid-cols-5 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleTap(action.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/40 bg-card hover:border-border/60 transition-all active:scale-95"
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Icon className={cn('h-4 w-4', action.color)} />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground text-center truncate">{action.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}