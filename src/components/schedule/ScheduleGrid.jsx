import { format, isSameDay, parseISO, isToday, getDay } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ShiftBlock from './ShiftBlock';
import { cn } from '@/lib/utils';
import { Plus, MapPin, Users } from 'lucide-react';

// ─── Station Lane View ────────────────────────────────────────────────────────
// Read-only view grouping shifts by station. No drag/drop for safety.

function StationLaneGrid({ shifts, stationsList, weekDays, selectedShiftIds, onSelectShift, shiftConflicts, isExpanded }) {
  // Collect unique station names from shifts + from Station entity list
  const entityStations = (stationsList || []).map(s => s.name).filter(Boolean);
  const shiftStations = [...new Set(shifts.map(s => s.station).filter(Boolean))];
  const allStationNames = [...new Set([...entityStations, ...shiftStations])];

  // Shifts with no station
  const unassignedShifts = shifts.filter(s => !s.station);

  const stationsToShow = [
    ...allStationNames,
    ...(unassignedShifts.length > 0 ? ['__unassigned__'] : []),
  ];

  if (stationsToShow.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <MapPin className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No stations configured yet.</p>
        <p className="text-xs text-muted-foreground/60">Add stations in Stations settings, then assign shifts to them.</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-card overflow-hidden', isExpanded ? 'rounded-none border-none' : 'rounded-xl border border-border/40 shadow-sm')}>
      <div className={cn('overflow-auto', isExpanded ? 'max-h-[calc(100vh-52px)]' : 'max-h-[calc(100vh-300px)]')}>
        <div className="min-w-[860px]">
          {/* Header */}
          <div className="grid sticky top-0 z-20 border-b border-border/50 bg-card/95 backdrop-blur-sm" style={{ gridTemplateColumns: '240px repeat(7, 1fr)' }}>
            <div className="px-3 py-2.5 border-r border-border/30 sticky left-0 z-30 bg-card/95 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Station</p>
            </div>
            {weekDays.map((day, idx) => {
              const today = isToday(day);
              return (
                <div key={idx} className={cn('py-2 px-1.5 text-center border-l border-border/30 relative', today ? 'bg-primary/8' : 'bg-card/95')}>
                  {today && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                  <p className={cn('text-[9px] font-bold uppercase tracking-widest', today ? 'text-primary' : 'text-muted-foreground')}>{format(day, 'EEE')}</p>
                  <p className={cn('text-xs font-extrabold mt-0.5', today ? 'text-primary' : 'text-foreground')}>{format(day, 'd')}</p>
                </div>
              );
            })}
          </div>

          {/* Station rows */}
          {stationsToShow.map((stationName, rowIdx) => {
            const isUnassigned = stationName === '__unassigned__';
            const rowShifts = isUnassigned
              ? unassignedShifts
              : shifts.filter(s => s.station === stationName);

            const totalCoverage = rowShifts.filter(s => s.employee_email || s.employee_name).length;

            return (
              <div
                key={stationName}
                className={cn('grid border-t border-border/20', rowIdx % 2 === 0 ? 'bg-background/50' : 'bg-background/30')}
                style={{ gridTemplateColumns: '240px repeat(7, 1fr)' }}
              >
                {/* Station label cell */}
                <div className="flex items-center gap-2 px-3 py-2 border-r border-border/30 sticky left-0 z-10 bg-inherit">
                  <div className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    totalCoverage > 0 ? 'bg-green-400' : 'bg-muted-foreground/30'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate leading-tight">
                      {isUnassigned ? 'No Station' : stationName}
                    </p>
                    {rowShifts.length > 0 && (
                      <p className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5 mt-0.5">
                        <Users className="h-2.5 w-2.5" /> {rowShifts.length}
                      </p>
                    )}
                  </div>
                </div>

                {/* Day cells */}
                {weekDays.map((day, dayIdx) => {
                  const today = isToday(day);
                  const dayShifts = rowShifts.filter(s => {
                    try { return isSameDay(parseISO(s.date), day); } catch { return false; }
                  });
                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        'min-h-[56px] px-1 py-1 border-l border-border/20',
                        today && 'bg-primary/6 border-l-primary/30',
                      )}
                    >
                      {dayShifts.map(shift => (
                        <ShiftBlock
                          key={shift.id}
                          shift={shift}
                          isSelected={selectedShiftIds.includes(shift.id)}
                          onSelect={() => onSelectShift(shift)}
                          conflicts={shiftConflicts?.[shift.id]}
                          showEmployee
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Grid ────────────────────────────────────────────────────────────────

export default function ScheduleGrid({
  shifts, employees, weekDays,
  selectedShiftIds, onSelectShift, onSelectShifts,
  shiftConflicts, timeOffRequests, availability,
  onDragEnd, onAddShift, onPasteShift, onShiftContextMenu, onEmptyCellContextMenu,
  isMobile, groupBy = 'employee', isExpanded = false,
  stationsList = [], hasClipboard = false,
}) {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {weekDays.map((day, dayIdx) => {
          const dayShifts = shifts.filter(s => { try { return isSameDay(parseISO(s.date), day); } catch { return false; } });
          const today = isToday(day);
          if (!today && dayShifts.length === 0) return null;
          return (
            <div
              key={dayIdx}
              className={cn('overflow-hidden rounded-2xl border', today ? 'border-primary/40' : 'border-border/40')}
              style={{
                background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)',
              }}
            >
              {/* Day header */}
              <div className={cn(
                'flex items-center justify-between px-4 py-3 border-b',
                today ? 'border-primary/20' : 'border-border/20',
              )}>
                <div className="flex items-center gap-2.5">
                  {today && <div className="h-2 w-2 rounded-full bg-primary" />}
                  <p className={cn('text-sm font-black', today ? 'text-primary' : 'text-foreground')}>
                    {format(day, 'EEE, MMM d')}
                  </p>
                  {today && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                      TODAY
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[11px] font-bold tabular-nums',
                  dayShifts.length > 0 ? 'text-foreground/60' : 'text-muted-foreground/40'
                )}>
                  {dayShifts.length} {dayShifts.length === 1 ? 'shift' : 'shifts'}
                </span>
              </div>

              {/* Shifts */}
              <div className="space-y-1.5 p-3">
                {dayShifts.length === 0
                  ? <p className="py-2 text-center text-xs text-muted-foreground/50">No shifts scheduled</p>
                  : dayShifts.map(shift => (
                    <ShiftBlock
                      key={shift.id}
                      shift={shift}
                      variant="mobile"
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
        onPasteShift={onPasteShift}
        hasClipboard={hasClipboard}
        onShiftContextMenu={onShiftContextMenu}
        onEmptyCellContextMenu={onEmptyCellContextMenu}
        isEven={i % 2 === 0}
      />
    ));

  // Station lane view — non-draggable, read-optimized
  if (groupBy === 'station') {
    return (
      <StationLaneGrid
        shifts={shifts}
        stationsList={stationsList}
        weekDays={weekDays}
        selectedShiftIds={selectedShiftIds}
        onSelectShift={onSelectShift}
        shiftConflicts={shiftConflicts}
        isExpanded={isExpanded}
      />
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={cn('bg-card overflow-hidden', isExpanded ? 'rounded-none border-none' : 'rounded-xl border border-border/40 shadow-sm')}>
        <div className={cn('overflow-auto', isExpanded ? 'max-h-[calc(100vh-52px)]' : 'max-h-[calc(100vh-300px)]')}>

          <div className="min-w-[860px]">
            {/* Premium Header */}
            <div className="grid sticky top-0 z-20 border-b border-border/50 bg-card/95 backdrop-blur-sm" style={{ gridTemplateColumns: '240px repeat(7, 1fr)' }}>
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

function EmployeeRow({ employee, weekDays, shifts, selectedShiftIds, onSelectShift, onSelectShifts, shiftConflicts, getTimeOffStatus, getAvailability, onAddShift, onPasteShift, hasClipboard, onShiftContextMenu, onEmptyCellContextMenu, isEven }) {
  const empShiftsThisWeek = shifts.filter(s =>
    (employee.email && s.employee_email && s.employee_email === employee.email) ||
    (!employee.email && s.employee_name === employee.name) ||
    (employee.email && !s.employee_email && s.employee_name === employee.name)
  );
  const totalHours = empShiftsThisWeek.reduce((sum, s) => {
    if (!s.start_time || !s.end_time) return sum;
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return sum + (diff > 0 ? diff / 60 : 0);
  }, 0);

  return (
    <div className={cn('grid border-t border-border/20', isEven ? 'bg-background/50' : 'bg-background/30')} style={{ gridTemplateColumns: '240px repeat(7, 1fr)' }}>
      {/* Compact Employee Cell */}
      <div className="flex items-center gap-2 px-3 py-2 border-r border-border/30 sticky left-0 z-10 bg-inherit">
        <div className="relative">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-primary">
            {(employee.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {employee.isClockedIn && (
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" title="Clocked in via POS" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground truncate leading-tight flex items-center gap-1.5">
            {employee.name}
          </p>
          {totalHours > 0 && <p className={cn('text-[9px] font-bold whitespace-nowrap mt-0.5', totalHours > 40 ? 'text-red-400' : 'text-muted-foreground/60')}>{totalHours.toFixed(1)}h</p>}
        </div>
      </div>

      {/* Day cells */}
      {weekDays.map((day, dayIdx) => {
        const today = isToday(day);
        const dayShifts = shifts.filter(s => {
          try {
            const sameDay = isSameDay(parseISO(s.date), day);
            const sameEmp =
              (employee.email && s.employee_email && s.employee_email === employee.email) ||
              (!employee.email && s.employee_name === employee.name) ||
              (employee.email && !s.employee_email && s.employee_name === employee.name);
            return sameDay && sameEmp;
          }
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
                onClick={() => { if (dayShifts.length === 0) { if (hasClipboard) onPasteShift?.(employee, day); else onAddShift?.(employee, day); } }}
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

                {/* Empty state + hover affordance */}
                {dayShifts.length === 0 && !snapshot.isDraggingOver && (
                  <div className="flex items-center justify-center h-full min-h-[56px] opacity-0 group-hover/cell:opacity-100 transition-opacity">
                    {hasClipboard ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-400/80 bg-green-500/10 border border-green-500/25 rounded-md px-1.5 py-0.5">
                        Paste
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-primary/60 bg-primary/8 border border-primary/20 rounded-md px-1.5 py-0.5">
                        <Plus className="h-3 w-3" /> Add
                      </span>
                    )}
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