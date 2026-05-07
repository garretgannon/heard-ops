import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { isToday, isThisWeek } from "date-fns";
import { LOG_TYPES } from "./logConfig";
import { CheckCircle2, AlertTriangle, Clock, Thermometer, Wrench, Flag, Users, BarChart3 } from "lucide-react";

function StatCard({ label, value, icon: Icon, borderColor, sub }) {
  return (
    <div className={cn("bg-card border border-border/60 rounded-xl px-4 py-3 space-y-1", borderColor && `border-l-4 ${borderColor}`)}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />}
      </div>
      <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AnalyticsView({ logs }) {
  const stats = useMemo(() => {
    const s = ts => { try { return ts ? new Date(ts) : null; } catch { return null; } };
    const today = logs.filter(l => { const d = s(l.ts); return d && isToday(d); });
    const week  = logs.filter(l => { const d = s(l.ts); return d && isThisWeek(d, { weekStartsOn: 1 }); });

    const typeCounts = {};
    logs.forEach(l => { typeCounts[l.type] = (typeCounts[l.type] || 0) + 1; });

    return {
      completedToday:   today.filter(l => ["completed","approved"].includes(l.status)).length,
      todayTotal:       today.length,
      openIssues:       logs.filter(l => l.type === "issue" && !["completed","approved","resolved"].includes(l.status)).length,
      overdue:          logs.filter(l => l.status === "overdue").length,
      failedTemps:      logs.filter(l => l.type === "temperature" && (l.status === "flagged" || l.status === "failed")).length,
      openMaintenance:  logs.filter(l => l.type === "maintenance" && !["completed","approved"].includes(l.status)).length,
      incidentsWeek:    week.filter(l => l.type === "incident" || (l.type === "issue" && l.priority === "critical")).length,
      employeeLogsWeek: week.filter(l => l.type === "manager" || l.type === "employee").length,
      typeCounts,
      total: logs.length,
    };
  }, [logs]);

  const typeEntries = Object.entries(stats.typeCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Today</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Completed"  value={stats.completedToday} icon={CheckCircle2} borderColor="border-l-green-500" sub="Today" />
          <StatCard label="Total Logs" value={stats.todayTotal}     icon={BarChart3}   sub="All types today" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Active</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Open Issues"  value={stats.openIssues}      icon={AlertTriangle} borderColor={stats.openIssues     > 0 ? "border-l-red-500"    : ""} />
          <StatCard label="Overdue"      value={stats.overdue}          icon={Clock}         borderColor={stats.overdue        > 0 ? "border-l-amber-500"  : ""} />
          <StatCard label="Failed Temps" value={stats.failedTemps}      icon={Thermometer}   borderColor={stats.failedTemps    > 0 ? "border-l-cyan-500"   : ""} />
          <StatCard label="Open Maint."  value={stats.openMaintenance}  icon={Wrench}        borderColor={stats.openMaintenance > 0 ? "border-l-purple-500" : ""} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">This Week</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Incidents"   value={stats.incidentsWeek}    icon={Flag}  borderColor={stats.incidentsWeek > 0 ? "border-l-red-500" : ""} sub="This week" />
          <StatCard label="Staff Logs"  value={stats.employeeLogsWeek} icon={Users} sub="This week" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Breakdown ({stats.total} total)</p>
        <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
          {typeEntries.map(([type, count]) => {
            const cfg = LOG_TYPES[type];
            if (!cfg) return null;
            const Icon = cfg.icon;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("h-3 w-3", cfg.color)} />
                    <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", cfg.dot)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}