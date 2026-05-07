import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOG_TYPE_CONFIG } from "./logConfig";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  addMonths, subMonths, addWeeks, subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

function EventDot({ type }) {
  const cfg = LOG_TYPE_CONFIG[type];
  return <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg?.dot || "bg-primary")} />;
}

export default function LogsCalendarView({ logs, onLogClick }) {
  const [viewType, setViewType] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const logsByDate = {};
  logs.forEach(log => {
    if (!log.ts) return;
    try {
      const key = format(new Date(log.ts), "yyyy-MM-dd");
      if (!logsByDate[key]) logsByDate[key] = [];
      logsByDate[key].push(log);
    } catch {}
  });

  const nav = (dir) => {
    if (viewType === "month") setCursor(dir === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1));
    else if (viewType === "week") setCursor(dir === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1));
    else setCursor(prev => { const d = new Date(prev); d.setDate(d.getDate() + dir); return d; });
  };

  const monthStart = startOfMonth(cursor);
  const gridDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(cursor)) });
  const weekDays = eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });
  const dayKey = format(cursor, "yyyy-MM-dd");
  const dayLogs = selectedDay ? (logsByDate[format(selectedDay, "yyyy-MM-dd")] || []) : [];

  const LogRow = ({ log }) => {
    const cfg = LOG_TYPE_CONFIG[log.type];
    const Icon = cfg?.icon;
    return (
      <button onClick={() => onLogClick(log)}
        className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-l-4 bg-background hover:bg-muted transition-all", cfg?.border)}>
        {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg?.text)} />}
        <p className="text-xs font-bold text-foreground truncate flex-1">{log.title}</p>
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border ml-auto shrink-0", cfg?.badge)}>{cfg?.label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {["month", "week", "day"].map(v => (
            <button key={v} onClick={() => setViewType(v)}
              className={cn("h-7 px-3 rounded-lg text-xs font-bold capitalize transition-all",
                viewType === v ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-muted")}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => nav(-1)} className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-bold text-foreground min-w-[130px] text-center">
            {viewType === "month" && format(cursor, "MMMM yyyy")}
            {viewType === "week" && `${format(startOfWeek(cursor), "MMM d")} – ${format(endOfWeek(cursor), "MMM d")}`}
            {viewType === "day" && format(cursor, "EEE, MMM d")}
          </p>
          <button onClick={() => nav(1)} className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => { setCursor(new Date()); setSelectedDay(null); }} className="h-7 px-2 rounded-lg bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground">
            Today
          </button>
        </div>
      </div>

      {/* Month grid */}
      {viewType === "month" && (
        <>
          <div className="grid grid-cols-7">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="text-[10px] font-bold text-muted-foreground text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {gridDays.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const dls = logsByDate[key] || [];
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <button key={key}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn("min-h-[58px] p-1 rounded-lg text-left transition-all border",
                    isSelected ? "bg-primary/15 border-primary/40" : "bg-card border-border/40 hover:border-border",
                    !isSameMonth(day, cursor) && "opacity-25")}>
                  <p className={cn("text-[11px] font-bold mb-1 h-5 w-5 rounded-full flex items-center justify-center",
                    isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground")}>
                    {format(day, "d")}
                  </p>
                  <div className="flex flex-wrap gap-0.5">
                    {dls.slice(0, 4).map((log, i) => <EventDot key={i} type={log.type} />)}
                    {dls.length > 4 && <span className="text-[8px] text-muted-foreground">+{dls.length - 4}</span>}
                  </div>
                </button>
              );
            })}
          </div>
          {/* Selected day detail */}
          {selectedDay && dayLogs.length > 0 && (
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-muted/30 border-b border-border/40">
                <p className="text-xs font-bold text-foreground">{format(selectedDay, "EEEE, MMMM d")} · {dayLogs.length} log{dayLogs.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="p-2 space-y-1.5">
                {dayLogs.map(log => <LogRow key={`${log.type}-${log.id}`} log={log} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Week view */}
      {viewType === "week" && (
        <div className="space-y-2">
          {weekDays.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const dls = logsByDate[key] || [];
            return (
              <div key={key} className={cn("rounded-xl border overflow-hidden", isToday(day) ? "border-primary/30" : "border-border/60")}>
                <div className={cn("px-3 py-2 flex items-center justify-between", isToday(day) ? "bg-primary/10" : "bg-muted/30")}>
                  <p className={cn("text-xs font-bold", isToday(day) ? "text-primary" : "text-foreground")}>{format(day, "EEEE, MMM d")}</p>
                  <span className="text-[10px] text-muted-foreground">{dls.length} log{dls.length !== 1 ? "s" : ""}</span>
                </div>
                {dls.length > 0 && (
                  <div className="p-2 space-y-1.5">
                    {dls.map(log => <LogRow key={`${log.type}-${log.id}`} log={log} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Day view */}
      {viewType === "day" && (
        <div className="space-y-2">
          {(logsByDate[dayKey] || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No logs for {format(cursor, "MMMM d")}</div>
          ) : (
            (logsByDate[dayKey] || []).map(log => <LogRow key={`${log.type}-${log.id}`} log={log} />)
          )}
        </div>
      )}
    </div>
  );
}