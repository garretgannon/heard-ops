import { format, isSameDay, parseISO, isToday, getDay } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ShiftBlock from './ShiftBlock';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function ScheduleGrid({
  shifts, employees, weekDays,
  selectedShiftIds, onSelectShift, onSelectShifts,
  shiftConflicts, timeOffRequests, availability,
  onDragEnd, onAddShift, onShiftContextMenu, onEmptyCellContextMenu,
  isMobile, groupBy = 'employee', isExpanded = false,
}) {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {weekDays.map((day, dayIdx) => {
          const dayShifts = shifts.filter(s => { try { return isSameDay(parseISO(s.date), day); } catch { return false; } });
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
                      key={shift.id} shift={shift}
                      isSelected={selectedShiftIds.includes(shift.id)}
                      onSelect={() => onSelectShift(shift)}
                      onMultiSelect={() => {
                        if (selectedShiftIds.includes(shift.id)) onSelectShifts(selectedShiftIds.filter(id => id !== shift.id));
                        else onSelectShifts([...selectedShiftIds, shift.id]);
                      }}
                      conflicts={shiftConflicts?.[shift.id]}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const getTimeOffStatus = (empEmail, day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const req = timeOffRequests?.find(r =>
      r.employee_email === empEmail &&
      dateStr >= r.start_date && dateStr <= r.end_date
    );
    return req?.status || null;
  };

  const getAvailability = (empEmail, day) => {
    const dow = getDay(day);
    return availability?.find(a => a.employee_email === empEmail && a.day_of_week === dow);
  };

  const renderRows = (empList) =>
    empList.map((employee, i) => (
      <EmployeeRow
        key={employee.id}
        employee={employee}
        weekDays={weekDays}
        shifts={shifts}
        selectedShiftIds={selectedShiftIds}
        onSelectShift={onSelectShift}
        onSelectShifts={onSelectShifts}
        shiftConflicts={shiftConflicts}
        getTimeOffStatus={getTimeOffStatus}
        getAvailability={getAvailability}
        onAddShift={onAddShift}
        onShiftContextMenu={onShiftContextMenu}
        onEmptyCellContextMenu={onEmptyCellContextMenu}
        isEven={i % 2 === 0}
      />
    ));

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={cn('bg-card overflow-hidden', isExpanded ? 'rounded-none border-none' : 'rounded-xl border border-border/40 shadow-sm')}>
        <div className={cn('overflow-auto', isExpanded ? 'max-h-[calc(100vh-52px)]' : 'max-h-[calc(100vh-300px)]')}>

          <div className="min-w-[860px]">
            {/* Premium Header */}
            <div className="grid sticky top-0 z-20 border-b border-border/50 bg-card/95 backdrop-blur-sm" style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}>
              <div className="px-3 py-2.5 border-r border-border/30 sticky left-0 z-30 bg-card/95">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</p>
              </div>
              {weekDays.map((day, idx) => {
                const today = isToday(day);
                return (
                  <div key={idx} className={cn('py-2 px-1.5 text-center border-l border-border/30 relative', today ? 'bg-primary/8' : 'bg-card/95')}>
                    {today && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                    <p className={cn('text-[9px] font-bold uppercase tracking-widest', today ? 'text-primary' : 'text-muted-foreground')}>{format(day, 'EEE')}</p>
                    <p className={cn('text-xs font-extrabold mt-0.5', today ? 'text-primary' : 'text-foreground')}>{format(day, 'd')}</p>
                    {today && <span className="inline-block text-[8px] font-bold text-primary mt-1">TODAY</span>}
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
              ).map(([group, groupEmps]) => (
                <div key={group}>
                  <div className="px-4 py-1.5 bg-muted/20 border-t border-border/40 sticky left-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary">{group}</p>
                  </div>
                  {renderRows(groupEmps)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

function EmployeeRow({ employee, weekDays, shifts, selectedShiftIds, onSelectShift, onSelectShifts, shiftConflicts, getTimeOffStatus, getAvailability, onAddShift, onShiftContextMenu, onEmptyCellContextMenu, isEven }) {
  const empShiftsThisWeek = shifts.filter(s => s.employee_email === employee.email || s.employee_name === employee.name);
  const totalHours = empShiftsThisWeek.reduce((sum, s) => {
    if (!s.start_time || !s.end_time) return sum;
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return sum + (diff > 0 ? diff / 60 : 0);
  }, 0);

  return (
    <div className={cn('grid border-t border-border/20', isEven ? 'bg-background/50' : 'bg-background/30')} style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}>
      {/* Compact Employee Cell */}
      <div className="flex items-center gap-2 px-3 py-2 border-r border-border/30 sticky left-0 z-10 bg-inherit">
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-primary">
          {(employee.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground truncate leading-tight">{employee.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[9px] text-muted-foreground truncate capitalize">{employee.role}</p>
            {totalHours > 0 && <p className={cn('text-[9px] font-bold whitespace-nowrap', totalHours > 40 ? 'text-red-400' : 'text-muted-foreground/60')}>{totalHours.toFixed(1)}h</p>}
          </div>
        </div>
      </div>

      {/* Day cells */}
      {weekDays.map((day, dayIdx) => {
        const today = isToday(day);
        const dayShifts = shifts.filter(s => {
          try { return isSameDay(parseISO(s.date), day) && (s.employee_email === employee.email || s.employee_name === employee.name); }
          catch { return false; }
        });
        const timeOffStatus = getTimeOffStatus(employee.email, day);
        const avail = getAvailability(employee.email, day);
        const isUnavailable = avail && !avail.is_available;
        const droppableId = `${employee.id}__${dayIdx}`;

        return (
          <Droppable key={droppableId} droppableId={droppableId}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                onClick={() => { if (dayShifts.length === 0) onAddShift?.(employee, day); }}
                onContextMenu={(e) => {
                  if (dayShifts.length === 0) { e.preventDefault(); onEmptyCellContextMenu?.(employee, day, e.clientX, e.clientY); }
                }}
                className={cn(
                  'min-h-[56px] px-1 py-1 border-l border-border/20 relative transition-all group/cell',
                  today && 'bg-primary/6 border-l-primary/30',
                  snapshot.isDraggingOver && 'bg-primary/20 border-primary/50 shadow-inner',
                  timeOffStatus === 'approved' && 'bg-red-500/10',
                  timeOffStatus === 'pending' && 'bg-amber-500/8',
                  isUnavailable && 'bg-muted/15',
                  dayShifts.length === 0 && !snapshot.isDraggingOver && 'cursor-pointer hover:bg-primary/4'
                )}
              >
                {/* Time-off indicator */}
                {timeOffStatus && (
                  <div className={cn('absolute top-1 right-1 h-1.5 w-1.5 rounded-full', timeOffStatus === 'approved' ? 'bg-red-400' : 'bg-amber-400')} title={`${timeOffStatus} time off`} />
                )}

                {/* Empty state + hover add button */}
                {dayShifts.length === 0 && !snapshot.isDraggingOver && (
                  <div className="flex items-center justify-center h-full opacity-0 group-hover/cell:opacity-100 transition-opacity">
                    <Plus className="h-3.5 w-3.5 text-primary/50" />
                  </div>
                )}

                {dayShifts.map((shift, shiftIdx) => (
                  <Draggable key={shift.id} draggableId={shift.id} index={shiftIdx}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-1 last:mb-0">
                        <ShiftBlock
                          shift={shift}
                          isSelected={selectedShiftIds.includes(shift.id)}
                          onSelect={() => onSelectShift(shift)}
                          onMultiSelect={() => {
                            if (selectedShiftIds.includes(shift.id)) onSelectShifts(selectedShiftIds.filter(id => id !== shift.id));
                            else onSelectShifts([...selectedShiftIds, shift.id]);
                          }}
                          onContextMenu={(e) => onShiftContextMenu?.(shift, employee, day, e.clientX, e.clientY)}
                          isDragging={snapshot.isDragging}
                          conflicts={shiftConflicts?.[shift.id]}
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