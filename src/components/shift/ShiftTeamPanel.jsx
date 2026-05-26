import { cn } from '@/lib/utils';

export default function ShiftTeamPanel({ tasks, selectedEmployee, onSelectEmployee }) {
  // Group tasks by assigned employee
  const employees = {};
  tasks.forEach((t) => {
    const empId = t.assigned_employee_id || 'unassigned';
    const empName = t.assigned_employee_name || 'Unassigned';
    if (!employees[empId]) {
      employees[empId] = { id: empId, name: empName, tasks: [] };
    }
    employees[empId].tasks.push(t);
  });

  const employeeList = Object.values(employees).map((emp) => {
    const completed = emp.tasks.filter((t) => ['complete', 'approved'].includes(t.status)).length;
    const total = emp.tasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const hasOverdue = emp.tasks.some((t) => t.status === 'overdue');
    const hasReview = emp.tasks.some((t) => t.status === 'needs_review');

    let status = 'On Track';
    if (hasOverdue) status = 'Behind';
    else if (hasReview) status = 'Review';
    else if (pct === 100) status = 'Complete';

    const statusColor =
      status === 'Behind'
        ? 'text-red-400'
        : status === 'Review'
        ? 'text-purple-400'
        : status === 'Complete'
        ? 'text-green-400'
        : 'text-blue-400';

    return { ...emp, completed, total, pct, status, statusColor };
  });

  return (
    <div className="liquid-card p-4">
      <h3 className="font-bold text-foreground text-sm mb-3">Shift Team</h3>
      <div className="space-y-2">
        {employeeList.length === 0 ? (
          <p className="text-xs text-muted-foreground">No employees assigned</p>
        ) : (
          employeeList.map((emp) => (
            <button
              key={emp.id}
              onClick={() => onSelectEmployee(selectedEmployee?.id === emp.id ? null : emp)}
              className={cn(
                'w-full text-left p-2.5 rounded-2xl border transition-all active:scale-95',
                selectedEmployee?.id === emp.id
                  ? 'bg-primary/15 border-primary/30'
                  : 'bg-muted/40 border-border/30 hover:border-border/50'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold text-foreground truncate">{emp.name}</p>
                <span className={`text-[10px] font-bold ${emp.statusColor}`}>{emp.status}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{emp.completed}/{emp.total} done</span>
                  <span className="font-bold">{emp.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${emp.pct}%` }}
                  />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}