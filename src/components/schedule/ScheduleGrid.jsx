import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, parseISO } from 'date-fns';
import { Droppable, Draggable, DragDropContext } from '@hello-pangea/dnd';
import ShiftBlock from './ShiftBlock';
import { cn } from '@/lib/utils';

const ROLE_COLORS = {
  manager: 'bg-blue-500/20 border-blue-500/50',
  server: 'bg-pink-500/20 border-pink-500/50',
  bartender: 'bg-purple-500/20 border-purple-500/50',
  cook: 'bg-orange-500/20 border-orange-500/50',
  prep: 'bg-yellow-500/20 border-yellow-500/50',
  dish: 'bg-gray-500/20 border-gray-500/50',
  host: 'bg-teal-500/20 border-teal-500/50',
};

export default function ScheduleGrid({
  shifts,
  employees,
  weekDays,
  selectedShifts,
  onSelectShift,
  onSelectShifts,
  onShiftUpdate,
  isMobile,
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
      <div className="space-y-4">
        {weekDays.map((day, dayIdx) => (
          <div key={dayIdx} className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 bg-card">
              <p className="font-bold text-foreground">{format(day, 'EEE, MMM d')}</p>
            </div>
            <div className="p-4 space-y-3">
              {shifts
                .filter(s => isSameDay(parseISO(s.date), day))
                .map(shift => (
                  <ShiftBlock
                    key={shift.id}
                    shift={shift}
                    employee={employees.find(e => e.id === shift.employeeId)}
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
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4 sticky top-[120px] z-20">
            {weekDays.map((day, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {format(day, 'EEE')}
                </p>
                <p className="text-lg font-bold text-foreground">{format(day, 'd')}</p>
              </div>
            ))}
          </div>

          {/* Schedule Grid */}
          <div className="space-y-2">
            {employees.map((employee, empIdx) => (
              <div key={employee.id} className="grid grid-cols-7 gap-2 items-start">
                {weekDays.map((day, dayIdx) => {
                  const dayShifts = shifts.filter(
                    s => isSameDay(parseISO(s.date), day) && s.employeeId === employee.id
                  );

                  return (
                    <Droppable key={`${employee.id}-${dayIdx}`} droppableId={`${employee.id}-${dayIdx}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            'min-h-[80px] rounded-lg border-2 border-dashed border-transparent transition-colors',
                            snapshot.isDraggingOver && 'border-primary bg-primary/5'
                          )}
                        >
                          {dayShifts.map((shift, shiftIdx) => (
                            <Draggable key={shift.id} draggableId={shift.id} index={shiftIdx}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="mb-2"
                                >
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
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}