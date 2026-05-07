import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isToday, isSameDay, isAfter, startOfDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, List, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOG_TYPE_CONFIG } from './logConfig';
import LogCard from './LogCard';

const VIEWS = [
  { id: 'month', label: 'Month', icon: Calendar },
  { id: 'week', label: 'Week', icon: Calendar },
  { id: 'day', label: 'Day', icon: Clock },
];

function getLogDate(log) {
  // Map log type to appropriate date field
  if (log.ts) return new Date(log.ts);
  if (log.createdAt) return new Date(log.createdAt);
  if (log.created_date) return new Date(log.created_date);
  return null;
}

function isLogOverdue(log) {
  const logDate = getLogDate(log);
  if (!logDate) return false;
  return isAfter(new Date(), logDate) && !['completed', 'approved', 'resolved', 'passed'].includes(log.status);
}

function MonthView({ logs, currentDate, onDateClick, onLogClick }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const logsByDate = {};
  logs.forEach(log => {
    const logDate = getLogDate(log);
    if (logDate) {
      const dateKey = format(logDate, 'yyyy-MM-dd');
      if (!logsByDate[dateKey]) logsByDate[dateKey] = [];
      logsByDate[dateKey].push(log);
    }
  });

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="space-y-2">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-[11px] font-bold text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1">
            {week.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayLogs = logsByDate[dateKey] || [];
              const isCurrentMonth = isSameDay(day, currentDate) || (day >= monthStart && day <= monthEnd);
              const isTodayDate = isToday(day);
              const hasOverdue = dayLogs.some(isLogOverdue);

              return (
                <button
                  key={dateKey}
                  onClick={() => onDateClick(day)}
                  className={cn(
                    'flex flex-col min-h-24 p-1.5 rounded-lg border transition-all active:scale-95',
                    isTodayDate ? 'border-primary/50 bg-primary/10' : !isCurrentMonth ? 'border-border/20 bg-background/50' : 'border-border bg-card',
                    hasOverdue && 'border-red-500/50 bg-red-500/5'
                  )}>
                  <span className={cn('text-xs font-bold', isTodayDate ? 'text-primary' : !isCurrentMonth ? 'text-muted-foreground/50' : 'text-foreground')}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex-1 min-w-0 mt-0.5 space-y-0.5 overflow-hidden">
                    {dayLogs.slice(0, 2).map(log => {
                      const cfg = LOG_TYPE_CONFIG[log.type];
                      const isOverdue = isLogOverdue(log);
                      return (
                        <div
                          key={log.id}
                          onClick={(e) => { e.stopPropagation(); onLogClick(log); }}
                          className={cn(
                            'block w-full text-[9px] font-bold px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity',
                            isOverdue ? 'bg-red-500/30 text-red-300' : cfg?.badge || 'bg-muted text-muted-foreground'
                          )}>
                          {log.title}
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ logs, currentDate, onDateClick, onLogClick }) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const logsByDate = {};
  logs.forEach(log => {
    const logDate = getLogDate(log);
    if (logDate) {
      const dateKey = format(logDate, 'yyyy-MM-dd');
      if (!logsByDate[dateKey]) logsByDate[dateKey] = [];
      logsByDate[dateKey].push(log);
    }
  });

  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="grid grid-cols-7 gap-2 min-w-max">
        {weekDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayLogs = logsByDate[dateKey] || [];
          const isTodayDate = isToday(day);
          const hasOverdue = dayLogs.some(isLogOverdue);

          return (
            <div key={dateKey} className={cn(
              'flex flex-col min-w-48 p-2 rounded-lg border',
              isTodayDate ? 'border-primary/50 bg-primary/10' : 'border-border bg-card',
              hasOverdue && 'border-red-500/50 bg-red-500/5'
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-sm font-bold', isTodayDate && 'text-primary')}>
                  {format(day, 'EEE')}
                </span>
                <span className={cn('text-xs font-bold', isTodayDate ? 'text-primary' : 'text-muted-foreground')}>
                  {format(day, 'd MMM')}
                </span>
              </div>
              <div className="space-y-1 flex-1 overflow-y-auto max-h-64">
                {dayLogs.length > 0 ? (
                  dayLogs.map(log => {
                    const cfg = LOG_TYPE_CONFIG[log.type];
                    const isOverdue = isLogOverdue(log);
                    return (
                      <button
                        key={log.id}
                        onClick={() => onLogClick(log)}
                        className={cn(
                          'block w-full text-[10px] font-bold px-2 py-1 rounded text-left',
                          isOverdue ? 'bg-red-500/30 text-red-300' : cfg?.badge || 'bg-muted text-muted-foreground'
                        )}>
                        <div className="truncate">{log.title}</div>
                        <div className="text-[8px] opacity-80 truncate">{log.subtitle}</div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-muted-foreground text-center py-4">No logs</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ logs, currentDate, onLogClick }) {
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dayLogs = logs.filter(log => {
    const logDate = getLogDate(log);
    return logDate && isSameDay(logDate, currentDate);
  }).sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));

  const isTodayDate = isToday(currentDate);

  return (
    <div className="space-y-2">
      <div className={cn(
        'p-4 rounded-lg border',
        isTodayDate ? 'border-primary/50 bg-primary/10' : 'border-border bg-card'
      )}>
        <h3 className={cn('text-lg font-bold', isTodayDate && 'text-primary')}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {dayLogs.length} log{dayLogs.length !== 1 ? 's' : ''} this day
        </p>
      </div>

      <div className="space-y-2">
        {dayLogs.length > 0 ? (
          dayLogs.map(log => {
            const cfg = LOG_TYPE_CONFIG[log.type];
            const isOverdue = isLogOverdue(log);
            return (
              <button
                key={log.id}
                onClick={() => onLogClick(log)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all active:scale-95',
                  isOverdue ? 'border-red-500/50 bg-red-500/5' : 'border-border bg-card hover:bg-muted/40'
                )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground">{log.title}</h4>
                    {log.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{log.subtitle}</p>}
                    {log.notes && <p className="text-xs text-secondary-text mt-1 line-clamp-2">{log.notes}</p>}
                  </div>
                  <div className={cn('shrink-0 h-6 px-2 rounded-full text-[9px] font-bold flex items-center whitespace-nowrap', cfg?.badge || 'bg-muted text-muted-foreground')}>
                    {cfg?.label || log.type}
                  </div>
                </div>
                {isOverdue && (
                  <div className="mt-2 text-[10px] font-bold text-red-400 flex items-center gap-1">
                    ⚠️ Overdue
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No logs scheduled for this day</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogsCalendarView({ logs, onLogClick }) {
  const [viewType, setViewType] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(d => addDays(d, -1))} className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="font-bold text-foreground min-w-48 text-center">
            {viewType === 'month' && format(currentDate, 'MMMM yyyy')}
            {viewType === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
            {viewType === 'day' && format(currentDate, 'MMM d, yyyy')}
          </h3>
          <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button onClick={() => setCurrentDate(new Date())} className="h-8 px-3 rounded-lg border border-border bg-card text-muted-foreground text-xs font-bold hover:text-foreground active:scale-90">
          Today
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1">
        {VIEWS.map(v => {
          const Icon = v.icon;
          return (
            <button key={v.id} onClick={() => setViewType(v.id)}
              className={cn(
                'h-8 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1',
                viewType === v.id ? 'bg-primary/15 text-primary border-primary/30' : 'bg-card border-border text-muted-foreground hover:bg-muted'
              )}>
              <Icon className="h-3.5 w-3.5" />{v.label}
            </button>
          );
        })}
      </div>

      {/* Calendar */}
      <div className="bg-card/50 rounded-lg p-4 border border-border/40">
        {viewType === 'month' && <MonthView logs={logs} currentDate={currentDate} onDateClick={setCurrentDate} onLogClick={onLogClick} />}
        {viewType === 'week' && <WeekView logs={logs} currentDate={currentDate} onDateClick={setCurrentDate} onLogClick={onLogClick} />}
        {viewType === 'day' && <DayView logs={logs} currentDate={currentDate} onLogClick={onLogClick} />}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(LOG_TYPE_CONFIG).slice(0, 6).map(([type, cfg]) => (
          <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border/40 bg-card/50">
            <div className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
            <span className="text-[10px] font-bold text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}