import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, AlertTriangle, Thermometer, Wrench, DollarSign,
  Truck, Camera, TrendingUp, Plus, CheckCircle2, Droplet,
  CalendarDays, ArrowRight, ShieldAlert, Utensils, Users, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Compact row card ────────────────────────────────────────────────────────
function RowCard({ icon: Icon, iconColor = "text-primary", title, meta, badge, badgeColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform text-left"
    >
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", "bg-secondary")}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">{title}</p>
        {meta && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{meta}</p>}
      </div>
      {badge && (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", badgeColor)}>
          {badge}
        </span>
      )}
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
    </button>
  );
}

// ── Stat pill ───────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color = "text-primary", onClick }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1 bg-card border border-border rounded-xl py-2.5 px-2 active:scale-95 transition-transform min-w-[60px]">
      <Icon className={cn("h-4 w-4", color)} />
      <span className="text-base font-extrabold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </button>
  );
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ label, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      {action && <button onClick={onAction} className="text-[11px] text-primary font-semibold">{action}</button>}
    </div>
  );
}

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const [
          prepLists, prepItems, sideWork, tempLogs, maintenance,
          incidents, vendors, shiftHandoffs, cashDrawers,
          dishLogs, dishMachines, calendarEvents, staffShifts,
        ] = await Promise.all([
          base44.entities.PrepList.filter({ date: todayStr }),
          base44.entities.PrepItem.list("-updated_date", 300),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }),
          base44.entities.TempLogEntry.filter({ date: todayStr }),
          base44.entities.MaintenanceRequest.filter({ status: "open" }),
          base44.entities.IncidentReport.filter({ status: "open" }),
          base44.entities.Vendor.list(),
          base44.entities.ShiftHandoff.list("-created_date", 5),
          base44.entities.DrawerCount.filter({ date: todayStr }),
          base44.entities.DishMachineLog.filter({ date: todayStr }),
          base44.entities.DishMachineEquipment.list(),
          base44.entities.CalendarEvent.list("-date", 100),
          base44.entities.StaffShift.filter({ date: todayStr, status: "published" }).catch(() => []),
        ]);

        const todayPrepItems = prepItems.filter(i => prepLists.some(pl => pl.id === i.prep_list_id));
        const prepDone = todayPrepItems.filter(i => i.status === "completed").length;
        const prepUrgent = todayPrepItems.filter(i => i.priority === "high" && i.status !== "completed").length;

        const swDone = sideWork.filter(t => ["completed","approved"].includes(t.status)).length;
        const swUrgent = sideWork.filter(t => t.priority === "high" && t.status === "pending").length;

        const tempAlertsCount = tempLogs.filter(tl => tl.is_above_range || tl.is_below_range).length;
        const mainUrgent = maintenance.filter(m => ["urgent","high"].includes(m.priority)).length;
        const incCritical = incidents.filter(i => ["critical","high"].includes(i.severity)).length;
        const cashIssues = cashDrawers.filter(d => Math.abs(d.variance || 0) > 0).length;

        const dishFailed = dishLogs.filter(l => l.status === "fail" && !l.corrective_action_resolved).length;
        const dishOverdue = dishMachines.filter(m => {
          if (!m.is_active) return false;
          const mLogs = dishLogs.filter(l => l.machine_id === m.id && l.status === "pass");
          if (!mLogs.length) return true;
          const last = mLogs.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0];
          return (Date.now() - new Date(last.logged_at)) / 3600000 > (m.check_frequency_hours || 4);
        }).length;

        const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3);
        const threeDaysStr = threeDays.toISOString().split("T")[0];
        const upcomingCal = calendarEvents.filter(e =>
          e.date >= todayStr && e.date <= threeDaysStr &&
          ["private_event","catering","reservation_buyout","maintenance","inspection"].includes(e.category)
        ).slice(0, 3);

        const alerts = [];
        if (incCritical > 0) alerts.push({ type: "incidents", count: incCritical, crit: true, path: "/incidents" });
        if (dishFailed > 0) alerts.push({ type: "dish_fail", count: dishFailed, crit: true, path: "/dish-machines" });
        if (mainUrgent > 0) alerts.push({ type: "maintenance", count: mainUrgent, crit: true, path: "/maintenance" });
        if (tempAlertsCount > 0) alerts.push({ type: "temp", count: tempAlertsCount, crit: false, path: "/temp-logs" });
        if (cashIssues > 0) alerts.push({ type: "cash", count: cashIssues, crit: false, path: "/cash" });
        if (dishOverdue > 0 && !dishFailed) alerts.push({ type: "dish_over", count: dishOverdue, crit: false, path: "/dish-machines" });

        setMetrics({
          prep: { done: prepDone, total: todayPrepItems.length, urgent: prepUrgent },
          sideWork: { done: swDone, total: sideWork.length, urgent: swUrgent },
          tempLogs: { alerts: tempAlertsCount, total: tempLogs.length },
          maintenance: { open: maintenance.length, urgent: mainUrgent },
          incidents: { open: incidents.length, critical: incCritical },
          cash: { issues: cashIssues, total: cashDrawers.length },
          dish: { failed: dishFailed, overdue: dishOverdue },
          staffShifts: staffShifts || [],
          upcomingCal,
          latestHandoff: shiftHandoffs[0] || null,
          alerts: alerts.slice(0, 5),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!metrics) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Failed to load</div>
  );

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="space-y-3 pb-2">

      {/* Date + quick add */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{dateLabel}</p>
        <button onClick={() => navigate("/prep-lists")}
          className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 border border-primary/25 px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
          <Plus className="h-3 w-3" /> New Task
        </button>
      </div>

      {/* Stat pills row */}
      <div className="flex gap-2">
        <StatPill icon={ClipboardList} label="Prep" value={`${metrics.prep.done}/${metrics.prep.total}`} onClick={() => navigate("/prep-lists")} color={metrics.prep.urgent > 0 ? "text-yellow-400" : "text-primary"} />
        <StatPill icon={Camera} label="Side Work" value={`${metrics.sideWork.done}/${metrics.sideWork.total}`} onClick={() => navigate("/side-work")} color={metrics.sideWork.urgent > 0 ? "text-yellow-400" : "text-primary"} />
        <StatPill icon={Thermometer} label="Temps" value={metrics.tempLogs.alerts > 0 ? `${metrics.tempLogs.alerts}⚠` : metrics.tempLogs.total} onClick={() => navigate("/temp-logs")} color={metrics.tempLogs.alerts > 0 ? "text-red-400" : "text-primary"} />
        <StatPill icon={Users} label="On Shift" value={metrics.staffShifts.length} onClick={() => navigate("/schedule-center")} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {[
          { label: "Pre-Shift", icon: Utensils, path: "/pre-shift" },
          { label: "Handoff",   icon: TrendingUp, path: "/shift-handoff" },
          { label: "Photos",    icon: Camera, path: "/photo-review" },
          { label: "Issue",     icon: ShieldAlert, path: "/maintenance" },
          { label: "Cash",      icon: DollarSign, path: "/cash" },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-secondary text-xs font-semibold text-foreground whitespace-nowrap active:scale-95 transition-transform shrink-0">
            <a.icon className="h-3.5 w-3.5 text-primary" />{a.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <div>
          <SectionHeader label="⚡ Needs Attention" />
          <div className="space-y-1.5">
            {metrics.alerts.map((alert, i) => {
              const cfg = {
                incidents:   { icon: AlertTriangle, label: "Critical Incident",    path: "/incidents" },
                dish_fail:   { icon: Droplet,       label: "Dish Machine Failed",  path: "/dish-machines" },
                dish_over:   { icon: Droplet,       label: "Dish Machine Overdue", path: "/dish-machines" },
                maintenance: { icon: Wrench,        label: "Urgent Maintenance",   path: "/maintenance" },
                temp:        { icon: Thermometer,   label: "Temp Out of Range",    path: "/temp-logs" },
                cash:        { icon: DollarSign,    label: "Cash Variance",        path: "/cash" },
              }[alert.type];
              return (
                <RowCard
                  key={i}
                  icon={cfg.icon}
                  iconColor={alert.crit ? "text-red-400" : "text-yellow-400"}
                  title={cfg.label}
                  meta={`${alert.count} item${alert.count !== 1 ? "s" : ""} need action`}
                  badge={alert.crit ? "Critical" : "Warning"}
                  badgeColor={alert.crit ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"}
                  onClick={() => navigate(cfg.path)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Operations */}
      <div>
        <SectionHeader label="Operations" />
        <div className="space-y-1.5">
          <RowCard icon={ClipboardList} title="Prep Lists" meta={`${metrics.prep.done} of ${metrics.prep.total} complete${metrics.prep.urgent > 0 ? ` · ${metrics.prep.urgent} overdue` : ""}`} badge={metrics.prep.urgent > 0 ? "Overdue" : "On Track"} badgeColor={metrics.prep.urgent > 0 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"} onClick={() => navigate("/prep-lists")} />
          <RowCard icon={Camera} title="Side Work" meta={`${metrics.sideWork.done} of ${metrics.sideWork.total} done${metrics.sideWork.urgent > 0 ? ` · ${metrics.sideWork.urgent} urgent` : ""}`} badge={metrics.sideWork.urgent > 0 ? "Urgent" : "On Track"} badgeColor={metrics.sideWork.urgent > 0 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"} onClick={() => navigate("/side-work")} />
          <RowCard icon={Thermometer} title="Temperature Logs" meta={`${metrics.tempLogs.total} logged today`} badge={metrics.tempLogs.alerts > 0 ? `${metrics.tempLogs.alerts} Alert` : "All Clear"} badgeColor={metrics.tempLogs.alerts > 0 ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"} onClick={() => navigate("/temp-logs")} />
          <RowCard icon={Droplet} title="Dish Machines" meta={metrics.dish.failed > 0 ? `${metrics.dish.failed} failed check` : metrics.dish.overdue > 0 ? `${metrics.dish.overdue} overdue` : "All logged"} badge={metrics.dish.failed > 0 ? "Failed" : metrics.dish.overdue > 0 ? "Overdue" : "OK"} badgeColor={metrics.dish.failed > 0 ? "bg-red-500/15 text-red-400 border-red-500/30" : metrics.dish.overdue > 0 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"} onClick={() => navigate("/dish-machines")} />
          <RowCard icon={Wrench} title="Maintenance" meta={`${metrics.maintenance.open} open requests`} badge={metrics.maintenance.urgent > 0 ? `${metrics.maintenance.urgent} Urgent` : "No Urgent"} badgeColor={metrics.maintenance.urgent > 0 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-muted text-muted-foreground border-border"} onClick={() => navigate("/maintenance")} />
          <RowCard icon={AlertTriangle} title="Incidents" meta={`${metrics.incidents.open} open`} badge={metrics.incidents.critical > 0 ? "Critical" : "Clear"} badgeColor={metrics.incidents.critical > 0 ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-muted text-muted-foreground border-border"} onClick={() => navigate("/incidents")} />
          <RowCard icon={DollarSign} title="Cash Drawers" meta={`${metrics.cash.total} drawers logged`} badge={metrics.cash.issues > 0 ? `${metrics.cash.issues} Variance` : "Balanced"} badgeColor={metrics.cash.issues > 0 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"} onClick={() => navigate("/cash")} />
        </div>
      </div>

      {/* Upcoming calendar */}
      {metrics.upcomingCal.length > 0 && (
        <div>
          <SectionHeader label="Upcoming Events" action="View All" onAction={() => navigate("/calendar")} />
          <div className="space-y-1.5">
            {metrics.upcomingCal.map((ev, i) => (
              <RowCard key={i} icon={CalendarDays} title={ev.title} meta={`${ev.date}${ev.time ? ` · ${ev.time}` : ""}`} onClick={() => navigate("/calendar")} />
            ))}
          </div>
        </div>
      )}

      {/* Latest handoff */}
      {metrics.latestHandoff && (
        <div>
          <SectionHeader label="Last Shift Handoff" action="View All" onAction={() => navigate("/shift-handoff")} />
          <div className="bg-card border border-border rounded-xl px-3 py-2.5 space-y-1.5">
            {[
              { key: "items_86d",             label: "86'd" },
              { key: "staff_issues",           label: "Staff" },
              { key: "maintenance_problems",   label: "Maint." },
              { key: "notes_for_next_manager", label: "Notes" },
            ].filter(f => metrics.latestHandoff[f.key]).map(f => (
              <p key={f.key} className="text-xs text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">{f.label}: </span>
                {metrics.latestHandoff[f.key].substring(0, 70)}{metrics.latestHandoff[f.key].length > 70 ? "…" : ""}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;