import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, AlertTriangle, Thermometer, Wrench, DollarSign,
  Camera, TrendingUp, Plus, Droplet, CalendarDays, ArrowRight,
  ShieldAlert, Users, CheckCircle2, Clock, Flame, FileText,
  Activity, ChevronRight, UserCheck, UserX, UserMinus, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

function MetricCard({ icon: Icon, label, value, sub, color = "text-primary", bg = "bg-primary/10", onClick }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1.5 bg-card border border-border rounded-xl py-3 px-2 active:scale-95 transition-transform min-w-0">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <span className="text-xl font-extrabold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground font-semibold text-center leading-tight">{label}</span>
      {sub && <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", sub.color)}>{sub.label}</span>}
    </button>
  );
}

function AlertRow({ icon: Icon, iconBg, iconColor, title, meta, badge, badgeColor, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform text-left">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {meta && <p className="text-[11px] text-muted-foreground mt-0.5">{meta}</p>}
      </div>
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", badgeColor)}>{badge}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </button>
  );
}

function PriorityRow({ rank, icon: Icon, title, meta, assignee, actionLabel, actionPath, status, navigate }) {
  const statusColor = {
    overdue: "bg-red-500/15 text-red-400 border-red-500/30",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    "in-progress": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    ok: "bg-green-500/15 text-green-400 border-green-500/30",
  }[status] || "bg-muted text-muted-foreground border-border";

  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5">
      <span className="text-base font-extrabold text-primary/50 w-5 shrink-0">{rank}</span>
      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{assignee}{meta ? ` · ${meta}` : ""}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusColor)}>{status}</span>
        <button onClick={() => navigate(actionPath)} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20 active:scale-95 transition-transform">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color = "text-primary", bg = "bg-primary/10", onClick }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1.5 bg-card border border-border rounded-xl py-3 px-1 active:scale-95 transition-transform min-w-0">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <span className="text-[10px] text-muted-foreground font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}

function ActivityItem({ icon: Icon, iconColor, title, time }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Icon className={cn("h-3.5 w-3.5", iconColor)} />
      </div>
      <p className="flex-1 text-xs text-muted-foreground leading-snug">{title}</p>
      <span className="text-[10px] text-muted-foreground/60 shrink-0">{time}</span>
    </div>
  );
}

function SectionHeader({ label, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      {action && <button onClick={onAction} className="text-[11px] text-primary font-semibold">{action}</button>}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const [me, prepLists, prepItems, sideWork, tempLogs, maintenance,
          incidents, shiftHandoffs, cashDrawers, dishLogs, dishMachines,
          calendarEvents, staffShifts, issues,
        ] = await Promise.all([
          base44.auth.me().catch(() => null),
          base44.entities.PrepList.filter({ date: todayStr }),
          base44.entities.PrepItem.list("-updated_date", 300),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }),
          base44.entities.TempLogEntry.filter({ date: todayStr }),
          base44.entities.MaintenanceRequest.filter({ status: "open" }),
          base44.entities.IncidentReport.filter({ status: "open" }),
          base44.entities.ShiftHandoff.list("-created_date", 10),
          base44.entities.DrawerCount.filter({ date: todayStr }),
          base44.entities.DishMachineLog.filter({ date: todayStr }),
          base44.entities.DishMachineEquipment.list(),
          base44.entities.CalendarEvent.list("-date", 100),
          base44.entities.StaffShift.filter({ date: todayStr, status: "published" }).catch(() => []),
          base44.entities.Issue.filter({ status: "open" }).catch(() => []),
        ]);

        setUser(me);

        const todayPrepItems = prepItems.filter(i => prepLists.some(pl => pl.id === i.prep_list_id));
        const prepDone = todayPrepItems.filter(i => i.status === "completed").length;
        const prepOverdue = todayPrepItems.filter(i => i.priority === "high" && i.status !== "completed").length;
        const prepMissing = todayPrepItems.filter(i => i.status === "pending").length;

        const swDone = sideWork.filter(t => ["completed","approved"].includes(t.status)).length;
        const swOverdue = sideWork.filter(t => t.priority === "high" && t.status === "pending").length;

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

        // Needs attention alerts
        const alerts = [];
        if (incCritical > 0) alerts.push({ icon: AlertTriangle, iconBg: "bg-red-500/15", iconColor: "text-red-400", title: "Critical Incident Open", meta: `${incCritical} unresolved`, badge: "Critical", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30", path: "/incidents" });
        if (dishFailed > 0) alerts.push({ icon: Droplet, iconBg: "bg-red-500/15", iconColor: "text-red-400", title: "Dish Machine Failed Check", meta: `${dishFailed} machine${dishFailed > 1 ? "s" : ""} need attention`, badge: "Critical", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30", path: "/dish-machines" });
        if (tempAlertsCount > 0) alerts.push({ icon: Thermometer, iconBg: "bg-yellow-500/15", iconColor: "text-yellow-400", title: "Temperature Alert", meta: `${tempAlertsCount} reading${tempAlertsCount > 1 ? "s" : ""} out of range`, badge: "Alert", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/temp-logs" });
        if (prepOverdue > 0) alerts.push({ icon: ClipboardList, iconBg: "bg-yellow-500/15", iconColor: "text-yellow-400", title: "Overdue Prep Items", meta: `${prepOverdue} high-priority item${prepOverdue > 1 ? "s" : ""} not started`, badge: "Overdue", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/prep-lists" });
        if (mainUrgent > 0) alerts.push({ icon: Wrench, iconBg: "bg-yellow-500/15", iconColor: "text-yellow-400", title: "Urgent Maintenance", meta: `${mainUrgent} request${mainUrgent > 1 ? "s" : ""} flagged urgent`, badge: "Urgent", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/maintenance" });
        if (cashIssues > 0) alerts.push({ icon: DollarSign, iconBg: "bg-yellow-500/15", iconColor: "text-yellow-400", title: "Cash Variance Detected", meta: `${cashIssues} drawer${cashIssues > 1 ? "s" : ""} out of balance`, badge: "Review", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/cash" });
        if (dishOverdue > 0 && !dishFailed) alerts.push({ icon: Droplet, iconBg: "bg-yellow-500/15", iconColor: "text-yellow-400", title: "Dish Machine Overdue", meta: `${dishOverdue} machine${dishOverdue > 1 ? "s" : ""} past check interval`, badge: "Overdue", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/dish-machines" });

        // Today's priorities (top 3 operational items)
        const priorities = [];
        if (todayPrepItems.length > 0) priorities.push({ icon: ClipboardList, title: "Complete Today's Prep", meta: `${todayPrepItems.length - prepDone} items remaining`, assignee: "Kitchen", actionLabel: "Open", actionPath: "/prep-lists", status: prepOverdue > 0 ? "overdue" : prepDone === todayPrepItems.length ? "ok" : "in-progress" });
        if (tempLogs.length < 2) priorities.push({ icon: Thermometer, title: "Temperature Checks", meta: `${tempLogs.length} logged so far`, assignee: "All Staff", actionLabel: "Log Now", actionPath: "/temp-logs", status: tempAlertsCount > 0 ? "overdue" : tempLogs.length === 0 ? "pending" : "in-progress" });
        if (sideWork.length > 0) priorities.push({ icon: Camera, title: "Side Work Completion", meta: `${swDone} of ${sideWork.length} done`, assignee: "FOH", actionLabel: "Review", actionPath: "/side-work", status: swOverdue > 0 ? "overdue" : swDone === sideWork.length ? "ok" : "in-progress" });
        if (priorities.length < 3 && issues.length > 0) priorities.push({ icon: ShieldAlert, title: "Open Issues", meta: `${issues.length} unresolved`, assignee: "Management", actionLabel: "View", actionPath: "/issues", status: issues.filter(i => i.status === "critical").length > 0 ? "overdue" : "pending" });

        // Team snapshot
        const onShift = staffShifts.length;

        // Recent activity (last 5 items across logs)
        const activity = [];
        const recentTemps = [...tempLogs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 2);
        recentTemps.forEach(t => activity.push({ icon: Thermometer, iconColor: t.is_above_range || t.is_below_range ? "text-red-400" : "text-green-400", title: `Temp logged — ${t.location_name || "Station"}: ${t.value}°F`, time: t.logged_at ? new Date(t.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today" }));
        const recentPrep = todayPrepItems.filter(i => i.status === "completed").sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)).slice(0, 2);
        recentPrep.forEach(p => activity.push({ icon: CheckCircle2, iconColor: "text-green-400", title: `Prep completed — ${p.name}`, time: p.completed_at ? new Date(p.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today" }));
        const recentIncidents = [...incidents].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 1);
        recentIncidents.forEach(i => activity.push({ icon: AlertTriangle, iconColor: "text-red-400", title: `Issue reported — ${i.title || "Incident"}`, time: i.created_date ? new Date(i.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today" }));

        // 3 days ahead calendar
        const threeDaysStr = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
        const upcomingCal = calendarEvents.filter(e =>
          e.date >= todayStr && e.date <= threeDaysStr &&
          ["private_event","catering","reservation_buyout","maintenance","inspection"].includes(e.category)
        ).slice(0, 3);

        setMetrics({
          tasksDue: todayPrepItems.length - prepDone + swOverdue,
          tempChecks: tempLogs.length,
          openIssues: issues.length + incidents.length,
          onShift,
          prepDone, prepTotal: todayPrepItems.length, prepOverdue,
          tempAlertsCount,
          alerts: alerts.slice(0, 5),
          priorities: priorities.slice(0, 3),
          onShiftCount: onShift,
          lateCount: 0,
          absentCount: 0,
          activity: activity.slice(0, 5),
          upcomingCal,
          latestHandoff: shiftHandoffs[0] || null,
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

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-4 pb-2">

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{getGreeting()}, {firstName}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Here's what needs your attention today</p>
      </div>

      {/* Metric cards */}
      <div className="flex gap-2">
        <MetricCard icon={ClipboardList} label="Tasks Due" value={metrics.tasksDue} sub={metrics.tasksDue > 0 ? { label: "Pending", color: "bg-yellow-500/15 text-yellow-400" } : { label: "All Done", color: "bg-green-500/15 text-green-400" }} onClick={() => navigate("/prep-lists")} />
        <MetricCard icon={Thermometer} label="Temp Checks" value={metrics.tempChecks} sub={metrics.tempAlertsCount > 0 ? { label: `${metrics.tempAlertsCount} Alert`, color: "bg-red-500/15 text-red-400" } : { label: "All Clear", color: "bg-green-500/15 text-green-400" }} color={metrics.tempAlertsCount > 0 ? "text-red-400" : "text-primary"} bg={metrics.tempAlertsCount > 0 ? "bg-red-500/10" : "bg-primary/10"} onClick={() => navigate("/temp-logs")} />
        <MetricCard icon={AlertTriangle} label="Open Issues" value={metrics.openIssues} sub={metrics.openIssues > 0 ? { label: "Review", color: "bg-red-500/15 text-red-400" } : { label: "Clear", color: "bg-green-500/15 text-green-400" }} color={metrics.openIssues > 0 ? "text-red-400" : "text-primary"} bg={metrics.openIssues > 0 ? "bg-red-500/10" : "bg-primary/10"} onClick={() => navigate("/incidents")} />
        <MetricCard icon={Users} label="On Shift" value={metrics.onShiftCount} onClick={() => navigate("/schedule-center")} />
      </div>

      {/* Needs Attention */}
      {metrics.alerts.length > 0 && (
        <div>
          <SectionHeader label="⚡ Needs Attention" />
          <div className="space-y-1.5">
            {metrics.alerts.map((a, i) => (
              <AlertRow key={i} {...a} onClick={() => navigate(a.path)} />
            ))}
          </div>
        </div>
      )}

      {metrics.alerts.length === 0 && (
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-400">All Clear</p>
            <p className="text-[11px] text-muted-foreground">No critical issues right now</p>
          </div>
        </div>
      )}

      {/* Today's Priorities */}
      {metrics.priorities.length > 0 && (
        <div>
          <SectionHeader label="Today's Priorities" action="View All" onAction={() => navigate("/prep-lists")} />
          <div className="space-y-1.5">
            {metrics.priorities.map((p, i) => (
              <PriorityRow key={i} rank={i + 1} navigate={navigate} {...p} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <SectionHeader label="Quick Actions" />
        <div className="flex gap-2">
          <QuickAction icon={Thermometer} label="Log Temp" onClick={() => navigate("/temp-logs")} />
          <QuickAction icon={ClipboardList} label="Checklist" onClick={() => navigate("/prep-lists")} color="text-blue-400" bg="bg-blue-500/10" />
          <QuickAction icon={AlertTriangle} label="Report Issue" onClick={() => navigate("/incidents")} color="text-red-400" bg="bg-red-500/10" />
          <QuickAction icon={FileText} label="Add Note" onClick={() => navigate("/manager-log")} color="text-purple-400" bg="bg-purple-500/10" />
        </div>
      </div>

      {/* Team Snapshot */}
      <div>
        <SectionHeader label="Team Snapshot" action="Schedule" onAction={() => navigate("/schedule-center")} />
        <div className="flex gap-2">
          <div className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <UserCheck className="h-4 w-4 text-green-400 shrink-0" />
            <div>
              <p className="text-lg font-extrabold leading-none">{metrics.onShiftCount}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">On Shift</p>
            </div>
          </div>
          <div className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-yellow-400 shrink-0" />
            <div>
              <p className="text-lg font-extrabold leading-none">{metrics.lateCount}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Late</p>
            </div>
          </div>
          <div className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <UserX className="h-4 w-4 text-red-400 shrink-0" />
            <div>
              <p className="text-lg font-extrabold leading-none">{metrics.absentCount}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Absent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {metrics.activity.length > 0 && (
        <div>
          <SectionHeader label="Recent Activity" />
          <div className="bg-card border border-border rounded-xl px-3 py-1">
            {metrics.activity.map((a, i) => (
              <ActivityItem key={i} {...a} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {metrics.upcomingCal.length > 0 && (
        <div>
          <SectionHeader label="Upcoming (3 Days)" action="Calendar" onAction={() => navigate("/calendar")} />
          <div className="space-y-1.5">
            {metrics.upcomingCal.map((ev, i) => (
              <button key={i} onClick={() => navigate("/calendar")} className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform text-left">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">{ev.title}</p>
                  <p className="text-[11px] text-muted-foreground">{ev.date}{ev.time ? ` · ${ev.time}` : ""}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Last Handoff */}
      {metrics.latestHandoff && (
        <div>
          <SectionHeader label="Last Shift Handoff" action="All Handoffs" onAction={() => navigate("/shift-handoff")} />
          <div className="bg-card border border-border rounded-xl px-3 py-2.5 space-y-1.5">
            {[
              { key: "items_86d", label: "86'd" },
              { key: "staff_issues", label: "Staff" },
              { key: "maintenance_problems", label: "Maint." },
              { key: "notes_for_next_manager", label: "Notes" },
            ].filter(f => metrics.latestHandoff[f.key]).map(f => (
              <p key={f.key} className="text-xs text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">{f.label}: </span>
                {metrics.latestHandoff[f.key].substring(0, 80)}{metrics.latestHandoff[f.key].length > 80 ? "…" : ""}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;