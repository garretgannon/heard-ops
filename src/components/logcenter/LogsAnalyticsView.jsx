import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { LOG_TYPE_CONFIG } from "./logConfig";
import { isToday, isThisWeek } from "date-fns";
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Thermometer, Wrench, ShieldAlert, Users } from "lucide-react";

function StatCard({ label, value, icon: Icon, leftColor, sub }) {
  return (
    <div className={cn("bg-card border border-border/60 rounded-xl px-4 py-3 space-y-1", leftColor && `border-l-4 ${leftColor}`)}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/40" />}
      </div>
      <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function LogsAnalyticsView({ logs }) {
  const stats = useMemo(() => {
    const today = logs.filter(l => { try { return l.ts && isToday(new Date(l.ts)); } catch { return false; } });
    const week = logs.filter(l => { try { return l.ts && isThisWeek(new Date(l.ts)); } catch { return false; } });
    return {
      completedToday: today.filter(l => l.status === "completed" || l.status === "approved").length,
      todayTotal: today.length,
      openIssues: logs.filter(l => ["issue","incident"].includes(l.type) && ["open","in_progress"].includes(l.status)).length,
      overdue: logs.filter(l => l.status === "overdue" || (l.status === "flagged" && l.type === "temperature")).length,
      failedTemps: logs.filter(l => ["temperature","food_safety"].includes(l.type) && (l.status === "flagged" || l.status === "overdue")).length,
      maintenanceOpen: logs.filter(l => l.type === "maintenance" && ["open","in_progress"].includes(l.status)).length,
      incidentsWeek: week.filter(l => l.type === "incident" || (l.type === "issue" && l.priority === "critical")).length,
      employeeWeek: week.filter(l => l.type === "employee").length,
      needsReview: logs.filter(l => l.status === "needs_review").length,
      weekTotal: week.length,
    };
  }, [logs]);

  // Log type breakdown
  const counts = {};
  logs.forEach(l => { counts[l.type] = (counts[l.type] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = logs.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard label="Completed Today"     value={stats.completedToday} icon={CheckCircle2} leftColor="border-l-green-500"   sub="resolved today" />
        <StatCard label="Open Issues"         value={stats.openIssues}     icon={AlertTriangle} leftColor={stats.openIssues > 0 ? "border-l-red-500" : undefined}   sub="unresolved" />
        <StatCard label="Overdue"             value={stats.overdue}        icon={Clock}        leftColor={stats.overdue > 0 ? "border-l-red-500" : undefined}       sub="past due" />
        <StatCard label="Needs Review"        value={stats.needsReview}    icon={TrendingUp}   leftColor={stats.needsReview > 0 ? "border-l-purple-500" : undefined} sub="manager action" />
        <StatCard label="Failed Temps"        value={stats.failedTemps}    icon={Thermometer}  leftColor={stats.failedTemps > 0 ? "border-l-cyan-500" : undefined}   sub="out of range" />
        <StatCard label="Maintenance Open"    value={stats.maintenanceOpen} icon={Wrench}      leftColor={stats.maintenanceOpen > 0 ? "border-l-amber-400" : undefined} sub="pending" />
        <StatCard label="Incidents This Week" value={stats.incidentsWeek}  icon={ShieldAlert}  leftColor={stats.incidentsWeek > 0 ? "border-l-red-500" : undefined}  sub="7-day window" />
        <StatCard label="Employee Logs"       value={stats.employeeWeek}   icon={Users}        leftColor="border-l-pink-500"  sub="this week" />
      </div>

      {/* Weekly summary bar */}
      <div className="bg-card border border-border/60 rounded-xl px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">This Week Summary</p>
        <div className="grid grid-cols-4 divide-x divide-border/40 text-center">
          {[
            { label: "Total", value: stats.weekTotal, cls: "" },
            { label: "Today", value: stats.todayTotal, cls: "" },
            { label: "Done",  value: stats.completedToday, cls: "text-green-400" },
            { label: "Overdue", value: stats.overdue, cls: stats.overdue > 0 ? "text-red-400" : "" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="px-2">
              <p className={cn("text-xl font-extrabold text-foreground", cls)}>{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Type breakdown */}
      <div className="bg-card border border-border/60 rounded-xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Log Breakdown</p>
        <div className="space-y-2">
          {sorted.map(([type, count]) => {
            const cfg = LOG_TYPE_CONFIG[type];
            const Icon = cfg?.icon;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={type} className="flex items-center gap-2">
                {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg?.text)} />}
                <span className="text-xs text-foreground w-28 truncate">{cfg?.label || type}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", cfg?.dot || "bg-primary")} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}