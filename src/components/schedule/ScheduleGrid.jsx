import { useState } from 'react';
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
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    // TODO: Update shift with new employee/day
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {weekDays.map((day, dayIdx) => {
          const dayShifts = shifts.filter(s => isSameDay(parseISO(s.date), day));
          const today = isToday(day);
          return (
            <div key={dayIdx} className={cn('rounded-xl border overflow-hidden', today ? 'border-primary/50' : 'border-border/40')}>
              <div className={cn('px-4 py-3 border-b flex items-center justify-between', today ? 'bg-primary/10 border-primary/30' : 'bg-card border-border/30')}>
                <p className={cn('font-bold text-sm', today ? 'text-primary' : 'text-foreground')}>{format(day, 'EEE, MMM d')}</p>
                {today && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">TODAY</span>}
                <span className="text-xs text-muted-foreground">{dayShifts.length} shifts</span>
              </div>
              <div className="p-3 space-y-2 bg-background">
                {dayShifts.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-3">No shifts</p>
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

  const renderRows = (empList, startIdx = 0) =>
    empList.map((employee, i) => (
      <EmployeeRow
        key={employee.id}
        employee={employee}
        weekDays={weekDays}
        shifts={shifts}
        selectedShifts={selectedShifts}
        onSelectShift={onSelectShift}
        onSelectShifts={onSelectShifts}
        isEven={(startIdx + i) % 2 === 0}
      />
    ));

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="min-w-[900px]">
          {/* Column headers */}
          <div className="grid border-b border-border/50" style={{ gridTemplateColumns: '200px repeat(7, 1fr)' }}>
            <div className="px-4 py-3 bg-card/80">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</p>
            </div>
            {weekDays.map((day, idx) => {
              const today = isToday(day);
              return (
                <div
                  key={idx}
                  className={cn(
                    'py-3 px-2 text-center border-l border-border/30',
                    today ? 'bg-primary/10' : 'bg-card/80'
                  )}
                >
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest', today ? 'text-primary' : 'text-muted-foreground')}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={cn('text-sm font-bold mt-0.5', today ? 'text-primary' : 'text-foreground')}>
                    {format(day, 'MMM d')}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {groupBy === 'employee' ? (
            renderRows(employees)
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
            ).map(([group, groupEmps], gi) => (
              <div key={group}>
                <div className="px-4 py-2 bg-muted/30 border-t border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{group}</p>
                </div>
                {renderRows(groupEmps, gi * 10)}
              </div>
            ))
          )}
        </div>
      </div>
    </DragDropContext>
  );
}

function EmployeeRow({ employee, weekDays, shifts, selectedShifts, onSelectShift, onSelectShifts, isEven }) {
  return (
    <div
      className={cn('grid border-t border-border/30', isEven ? 'bg-card/30' : 'bg-background/60')}
      style={{ gridTemplateColumns: '200px repeat(7, 1fr)' }}
    >
      {/* Employee cell */}
      <div className="flex items-center gap-3 px-4 py-3 border-r border-border/30">
        <div className="h-9 w-9 rounded-full bg-primary/25 flex items-center justify-center shrink-0">
          <span className="text-xs font-extrabold text-primary">
            {(employee.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate leading-tight">{employee.name}</p>
          <p className="text-[11px] text-muted-foreground truncate capitalize">{employee.role}</p>
        </div>
      </div>

      {/* Day cells */}
      {weekDays.map((day, dayIdx) => {
        const today = isToday(day);
        const dayShifts = shifts.filter(
          s => isSameDay(parseISO(s.date), day) &&
            (s.employee_email === employee.email || s.employee_name === employee.name)
        );
        return (
          <Droppable key={`${employee.id}-${dayIdx}`} droppableId={`${employee.id}-${dayIdx}`}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  'min-h-[60px] px-1.5 py-2 border-l border-border/25 transition-colors',
                  today && 'bg-primary/5',
                  snapshot.isDraggingOver && 'bg-primary/15'
                )}
              >
                {dayShifts.length === 0 ? (
                  <span className="flex items-center justify-center h-full text-muted-foreground/40 text-sm font-medium">—</span>
                ) : (
                  dayShifts.map((shift, shiftIdx) => (
                    <Draggable key={shift.id} draggableId={shift.id} index={shiftIdx}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-1 last:mb-0">
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
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        );
      })}
    </div>
  );
}