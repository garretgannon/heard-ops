import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmployeeSidebar({ employees, shifts, searchQuery }) {
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState(null);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    return employees.filter(e =>
      e.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  return (
    <div className="space-y-2">
      <div className="sticky top-[120px] z-20 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Team</p>
        <p className="text-sm font-bold text-foreground">{filteredEmployees.length} Staff</p>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        <AnimatePresence>
          {filteredEmployees.map((employee, idx) => {
            const employeeShifts = shifts.filter(s => s.employeeId === employee.id);
            const totalHours = employeeShifts.reduce((acc, s) => acc + (s.hours || 0), 0);
            const isOvertime = totalHours > 40;

            return (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ delay: idx * 0.02 }}
                onMouseEnter={() => setHoveredEmployeeId(employee.id)}
                onMouseLeave={() => setHoveredEmployeeId(null)}
                className={cn(
                  'p-3 rounded-lg border border-border/30 bg-card/50 hover:bg-card/80 hover:border-border/50 transition-all cursor-pointer',
                  hoveredEmployeeId === employee.id && 'ring-1 ring-primary/50'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{employee.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{employee.role}</p>
                  </div>
                  {isOvertime && (
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="px-2 py-1.5 rounded bg-background/50">
                    <p className="text-muted-foreground">Hours</p>
                    <p className={cn('font-bold', isOvertime && 'text-orange-400')}>
                      {totalHours.toFixed(1)}h
                    </p>
                  </div>
                  <div className="px-2 py-1.5 rounded bg-background/50">
                    <p className="text-muted-foreground">Shifts</p>
                    <p className="font-bold text-foreground">{employeeShifts.length}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}