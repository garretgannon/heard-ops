import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, parseISO, isToday } from 'date-fns';
import { Droppable, Draggable, DragDropContext } from '@hello-pangea/dnd';
import ShiftBlock from './ShiftBlock';
import { cn } from '@/lib/utils';

export default function ScheduleGrid({
  shifts,
  employees,
  weekDays,
  selectedShifts,
  onSelectShift,
  onSelectShifts,
  onShiftUpdate,
  isMobile,
  groupBy = 'employee',
}) {
  const [draggedShift, setDraggedShift] = useState(null);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    setDraggedShift(null);
    // TODO: Update shift with new employee/day
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {weekDays.map((day, dayIdx) => {
          const dayShifts = shifts.filter(s => isSameDay(parseISO(s.date), day));
          const today = isToday(day);
          return (
            <div key={dayIdx} className={cn('rounded-xl border overflow-hidden', today ? 'border-primary/40' : 'border-border/40')}>
              <div className={cn('px-4 py-3 border-b flex items-center justify-between', today ? 'bg-primary/10 border-primary/30' : 'bg-card/80 border-border/30')}>
                <p className={cn('font-bold', today ? 'text-primary' : 'text-foreground')}>{format(day, 'EEE, MMM d')}</p>
                {today && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">TODAY</span>}
                <span className="text-xs text-muted-foreground">{dayShifts.length} shifts</span>
              </div>
              <div className="p-3 space-y-2 bg-background">
                {dayShifts.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-2">No shifts</p>
                  : dayShifts.map(shift => (
                    <ShiftBlock
                      key={shift.id}
                      shift={shift}
                      employee={employees.find(e => e.email === shift.employee_email || e.name === shift.employee_name)}
                      isSelected={selectedShifts.includes(shift.id)}
                      onSelect={() => onSelectShift(shift)}
                      onMultiSelect={() => {
                        if (selectedShifts.includes(shift.id)) {
                          onSelectShifts(selectedShifts.filter(id => id !== shift.id));
                        } else {
                          onSelectShifts([...selectedShifts, shift.id]);
                        }
                      }}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Day Headers */}
          <div
            className="grid mb-1 sticky top-[120px] z-20 rounded-xl border border-border/60 overflow-hidden shadow-sm"
            style={{ gridTemplateColumns: '160px repeat(7, 1fr)' }}
          >
            <div className="px-3 py-3 border-r border-border/50 bg-card">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</p>
            </div>
            {weekDays.map((day, idx) => {
              const today = isToday(day);
              return (
                <div key={idx} className={cn(
                  'text-center py-3 px-2 border-r border-border/40 last:border-r-0',
                  today ? 'bg-primary/15' : 'bg-card'
                )}>
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1.5', today ? 'text-primary' : 'text-muted-foreground')}>
                    {format(day, 'EEE')}
                  </p>
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center mx-auto',
                    today ? 'bg-primary shadow-md shadow-primary/30' : ''
                  )}>
                    <p className={cn('text-base font-extrabold', today ? 'text-white' : 'text-foreground')}>
                      {format(day, 'd')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Schedule Grid */}
          <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
            {groupBy === 'employee' ? (
              employees.map((employee, empIdx) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  weekDays={weekDays}
                  shifts={shifts}
                  selectedShifts={selectedShifts}
                  onSelectShift={onSelectShift}
                  onSelectShifts={onSelectShifts}
                  isEven={empIdx % 2 === 0}
                />
              ))
            ) : (
              Object.entries(
                employees.reduce((acc, emp) => {
                  const key = groupBy === 'department'
                    ? (shifts.find(s => s.employee_name === emp.name || s.employee_email === emp.email)?.department || 'Other')
                    : (emp.role || 'Other');
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(emp);
                  return acc;
                }, {})
              ).map(([group, groupEmps]) => (
                <div key={group}>
                  <div className="py-2 px-4 bg-muted/40 border-t border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{group}</p>
                  </div>
                  {groupEmps.map((employee, empIdx) => (
                    <EmployeeRow
                      key={employee.id}
                      employee={employee}
                      weekDays={weekDays}
                      shifts={shifts}
                      selectedShifts={selectedShifts}
                      onSelectShift={onSelectShift}
                      onSelectShifts={onSelectShifts}
                      isEven={empIdx % 2 === 0}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

function EmployeeRow({ employee, weekDays, shifts, selectedShifts, onSelectShift, onSelectShifts, isEven }) {
  return (
    <div
      className={cn('grid items-stretch border-t border-border/30 first:border-t-0', isEven ? 'bg-card/20' : 'bg-background')}
      style={{ gridTemplateColumns: '160px repeat(7, 1fr)' }}
    >
      {/* Employee name cell */}
      <div className="flex flex-col justify-center py-3 px-3 border-r border-border/40 bg-card/50 gap-1">
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-extrabold text-primary">{employee.name?.charAt(0)}</span>
        </div>
        <p className="text-xs font-bold text-foreground truncate leading-tight">{employee.name}</p>
        <p className="text-[10px] text-muted-foreground truncate capitalize">{employee.role}</p>
      </div>

      {/* Day cells */}
      {weekDays.map((day, dayIdx) => {
        const today = isToday(day);
        const dayShifts = shifts.filter(
          s => isSameDay(parseISO(s.date), day) && (s.employee_email === employee.email || s.employee_name === employee.name)
        );
        return (
          <Droppable key={`${employee.id}-${dayIdx}`} droppableId={`${employee.id}-${dayIdx}`}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  'min-h-[80px] p-1.5 border-r border-border/25 last:border-r-0 transition-colors',
                  today && !snapshot.isDraggingOver && 'bg-primary/5',
                  snapshot.isDraggingOver && 'bg-primary/15'
                )}
              >
                {dayShifts.map((shift, shiftIdx) => (
                  <Draggable key={shift.id} draggableId={shift.id} index={shiftIdx}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-1">
                        <ShiftBlock
                          shift={shift}
                          employee={employee}
                          isSelected={selectedShifts.includes(shift.id)}
                          onSelect={() => onSelectShift(shift)}
                          onMultiSelect={() => {
                            if (selectedShifts.includes(shift.id)) {
                              onSelectShifts(selectedShifts.filter(id => id !== shift.id));
                            } else {
                              onSelectShifts([...selectedShifts, shift.id]);
                            }
                          }}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        );
      })}
    </div>
  );
}