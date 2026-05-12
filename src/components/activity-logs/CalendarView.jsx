import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  isToday, isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { LOG_TYPES } from "./logConfig";
import LogCard from "./LogCard";

export default function CalendarView({ logs, onLogClick }) {
  const [anchor, setAnchor] = useState(new Date());
  const [mode,   setMode]   = useState("month");
  const [selectedDay, setSelectedDay] = useState(null);

  const days = useMemo(() => {
    if (mode === "week") return eachDayOfInterval({ start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) });
    if (mode === "day")  return [anchor];
    return eachDayOfInterval({ start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }) });
  }, [anchor, mode]);

  const nav = (dir) => {
    if (mode === "month") setAnchor(dir > 0 ? addMonths(anchor, 1) : subMonths(anchor, 1));
    else if (mode === "week") setAnchor(dir > 0 ? addWeeks(anchor, 1) : subWeeks(anchor, 1));
    else setAnchor(d => { const n = new Date(d); n.setDate(n.getDate() + dir); return n; });
    setSelectedDay(null);
  };

  const logsForDay = (day) => logs.filter(l => {
    if (!l.ts) return false;
    try { return isSameDay(new Date(l.ts), day); } catch { return false; }
  });

  const selectedLogs = selectedDay ? logsForDay(selectedDay) : [];

  const headerLabel =
    mode === "month" ? format(anchor, "MMMM yyyy") :
    mode === "week"  ? `${format(startOfWeek(anchor, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(anchor, { weekStartsOn: 1 }), "MMM d")}` :
    format(anchor, "EEEE, MMM d");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {["month","week","day"].map(m => (
            <button key={m} onClick={() => { setMode(m); setSelectedDay(null); }}
              className={cn("h-7 px-3 rounded-lg text-xs font-bold border capitalize transition-all",
                mode === m ? "bg-primary/15 text-primary border-primary/30" : "bg-card border-border text-muted-foreground hover:bg-muted")}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => nav(-1)} className="h-7 w-7 rounded-lg border border-border card-glass flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-bold text-foreground min-w-[120px] text-center">{headerLabel}</span>
          <button onClick={() => nav(1)} className="h-7 w-7 rounded-lg border border-border card-glass flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {mode !== "day" && (
        <div className="grid grid-cols-7">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground py-1">{d}</div>
          ))}
        </div>
      )}

      {mode === "day" ? (
        <div className="space-y-2">
          {logsForDay(anchor).length === 0
            ? <div className="text-center py-12 text-muted-foreground text-sm">No logs for {format(anchor, "MMM d")}</div>
            : logsForDay(anchor).map(log => <LogCard key={`${log.type}-${log.id}`} log={log} onClick={onLogClick} />)
          }
        </div>
      ) : (
        <div className={cn("grid gap-px", mode === "month" ? "grid-cols-7" : "grid-cols-7")}>
          {days.map(day => {
            const dls = logsForDay(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isCurrentMonth = mode === "week" || day.getMonth() === anchor.getMonth();
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cn(
                  "min-h-[52px] p-1 rounded-lg border text-left flex flex-col transition-all",
                  isSelected ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/50",
                  !isCurrentMonth && "opacity-25"
                )}>
                <span className={cn("text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center mb-0.5",
                  isToday(day) ? "bg-primary text-white" : "text-muted-foreground")}>
                  {format(day, "d")}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {dls.slice(0, 3).map((log, i) => {
                    const cfg = LOG_TYPES[log.type];
                    return <div key={i} className={cn("h-1.5 w-1.5 rounded-full", cfg?.dot || "bg-muted")} />;
                  })}
                  {dls.length > 3 && <span className="text-[8px] font-bold text-muted-foreground">+{dls.length - 3}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <div className="card-glass border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-bold text-foreground">{format(selectedDay, "EEEE, MMMM d")} · {selectedLogs.length} log{selectedLogs.length !== 1 ? "s" : ""}</p>
            <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          {selectedLogs.length === 0
            ? <div className="text-center py-6 text-muted-foreground text-sm p-3">No logs on this day</div>
            : <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {selectedLogs.map(log => <LogCard key={`${log.type}-${log.id}`} log={log} onClick={onLogClick} compact />)}
              </div>
          }
        </div>
      )}
    </div>
  );
}