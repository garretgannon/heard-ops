import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsCalendarView({ logs }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getLogsForDate = (day) => {
    if (!day) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toDateString();
    return logs.filter((log) => new Date(log.created_date).toDateString() === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-all">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-foreground">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-all">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-lg border border-border/20 p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const logsForDay = day ? getLogsForDate(day) : [];
            return (
              <div
                key={idx}
                className={`p-2 rounded-lg border border-border/20 min-h-20 ${
                  day
                    ? 'bg-background hover:bg-muted/50 cursor-pointer transition-all'
                    : 'bg-muted/30'
                }`}
              >
                {day && (
                  <>
                    <div className="text-sm font-semibold text-foreground mb-1">{day}</div>
                    <div className="space-y-1">
                      {logsForDay.slice(0, 2).map((log) => (
                        <div key={log.id} className="text-xs bg-primary/15 text-primary px-1 py-0.5 rounded truncate">
                          {log.title}
                        </div>
                      ))}
                      {logsForDay.length > 2 && (
                        <div className="text-xs text-muted-foreground">+{logsForDay.length - 2} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}