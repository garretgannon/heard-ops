import { useState, useEffect, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ShiftModeContext } from "@/lib/ShiftModeContext";
import ShiftStartModal from "@/components/ShiftMode/ShiftStartModal";
import ShiftCloseModal from "@/components/ShiftMode/ShiftCloseModal";
import {
  ClipboardList, AlertTriangle, Thermometer, Wrench, DollarSign,
  Droplet, ChevronRight, ShieldAlert, CheckCircle2, Flame, Plus, FileText,
  Users, Clock, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInHours, formatDistanceToNow, isToday } from "date-fns";

/* ── Atoms ──────────────────────────────────────────────── */

function Badge({ label, color }) {
  return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap", color)}>{label}</span>;
}

function SectionLabel({ text, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-1.5 mt-4 first:mt-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{text}</p>
      {action && <button onClick={onAction} className="text-[10px] text-[#F5A623] font-bold">{action}</button>}
    </div>
  );
}

function Stat({ icon: Icon, label, value, alert, onClick }) {
  return (
    <button onClick={onClick} className={cn("flex-1 flex flex-col items-center text-center gap-0 bg-[#111827] border rounded-xl py-2 px-1 active:scale-95 transition-transform min-w-0", alert ? "border-red-500/30" : "border-[#1F2937]")}>
      <Icon className={cn("h-3 w-3 mb-0.5", alert ? "text-red-400" : "text-gray-500")} />
      <span className={cn("text-lg font-bold leading-none", alert ? "text-red-400" : "text-white")}>{value}</span>
      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wide mt-0.5 leading-tight">{label}</span>
    </button>
  );
}

function AlertCard({ icon: Icon, iconColor, iconBg, title, meta, badge, badgeColor, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 bg-[#111827] border border-[#1F2937] rounded-lg px-2.5 py-2 active:scale-[0.98] transition-transform text-left">
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-3.5 w-3.5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white leading-tight truncate">{title}</p>
        {meta && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{meta}</p>}
      </div>
      {badge && <Badge label={badge} color={badgeColor} />}
    </button>
  );
}

function PriorityCard({ rank, icon: Icon, title, meta, assignee, status, actionLabel, actionPath, navigate }) {
  const statusColors = {
    overdue:      "bg-red-500/15 text-red-400 border-red-500/30",
    pending:      "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    "in-progress":"bg-blue-500/15 text-blue-400 border-blue-500/30",
    ok:           "bg-green-500/15 text-green-400 border-green-500/30",
  };
  return (
    <div className="flex items-center gap-2.5 bg-[#111827] border border-[#1F2937] rounded-lg px-2.5 py-2">
      <span className="text-xs font-bold text-[#F5A623]/40 w-3 shrink-0 text-center">{rank}</span>
      <div className="h-7 w-7 rounded-lg bg-[#1C2432] flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-[#F5A623]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white leading-tight truncate">{title}</p>
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{assignee}{meta ? ` · ${meta}` : ""}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <Badge label={status} color={statusColors[status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"} />
        <button onClick={() => navigate(actionPath)}
          className="text-[9px] font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/25 px-1.5 py-0.5 rounded text-center active:scale-95 transition-transform min-h-[28px] min-w-[28px]">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}



function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ── Page ───────────────────────────────────────────────── */

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const { shiftSession, isShiftActive, isClosing, startShift, transitionToClosing, completeShift } = useContext(ShiftModeContext);
  const [m, setM] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me().catch(() => null);
        const [prepLists, prepItems, sideWork, tempLogs, maintenance,
          incidents, shiftHandoffs, cashDrawers, dishLogs, dishMachines,
          staffShifts, issues, inventoryItems,
        ] = await Promise.all([
          base44.entities.PrepList.filter({ date: todayStr }).catch(() => []),
          base44.entities.PrepItem.list("-updated_date", 150).catch(() => []),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }).catch(() => []),
          base44.entities.TempLogEntry.filter({ date: todayStr }).catch(() => []),
          base44.entities.MaintenanceRequest.filter({ status: "open" }).catch(() => []),
          base44.entities.IncidentReport.filter({ status: "open" }).catch(() => []),
          base44.entities.ShiftHandoff.list("-created_date", 3).catch(() => []),
          base44.entities.DrawerCount.filter({ date: todayStr }).catch(() => []),
          base44.entities.DishMachineLog.filter({ date: todayStr }).catch(() => []),
          base44.entities.DishMachineEquipment.list().catch(() => []),
          base44.entities.StaffShift.filter({ date: todayStr, status: "published" }).catch(() => []),
          base44.entities.Issue.filter({ status: "open" }).catch(() => []),
          base44.entities.InventoryItem.list('-updated_date', 150).catch(() => []),
        ]);

        setUser(me);

        const todayPrep  = prepItems.filter(i => prepLists.some(pl => pl.id === i.prep_list_id));
        const prepDone   = todayPrep.filter(i => i.status === "completed").length;
        const prepOverdue = todayPrep.filter(i => i.status === "overdue").length;
        const prepUrgent = todayPrep.filter(i => i.priority === "high" && i.status !== "completed").length;
        const swDone     = sideWork.filter(t => ["completed","approved"].includes(t.status)).length;
        const swOverdue  = sideWork.filter(t => t.status === "overdue").length;
        const swUrgent   = sideWork.filter(t => t.priority === "high" && ["pending","in_progress"].includes(t.status)).length;
        const tempAlerts = tempLogs.filter(t => t.is_above_range || t.is_below_range).length;
        const mainUrgent = maintenance.filter(m => ["urgent","high"].includes(m.priority)).length;
        const incCrit    = incidents.filter(i => ["critical","high"].includes(i.severity)).length;
        const cashIssues = cashDrawers.filter(d => Math.abs(d.variance || 0) > 0).length;
        const dishFailed = dishLogs.filter(l => l.status === "fail" && !l.corrective_action_resolved).length;
        const dishOverdue = dishMachines.filter(mach => {
          if (!mach.is_active) return false;
          const ok = dishLogs.filter(l => l.machine_id === mach.id && l.status === "pass");
          if (!ok.length) return true;
          const last = ok.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0];
          return (Date.now() - new Date(last.logged_at)) / 3600000 > (mach.check_frequency_hours || 4);
        }).length;
        const invLow = (inventoryItems || []).filter(i => i.status === 'low').length;
        const invCritical = (inventoryItems || []).filter(i => ['critical','out'].includes(i.status)).length;
        const invAtRisk = (inventoryItems || []).filter(i => i.required_for_prep && ['critical','out'].includes(i.status)).length;

        // ── Needs Attention — severity-sorted intelligence ──────────────
        // severity: 1=Critical, 2=Overdue, 3=At Risk
        const rawAlerts = [];

        // TEMPS — critical food-safety
        const critTemps = tempLogs.filter(t => t.is_above_range || t.is_below_range);
        critTemps.forEach(t => rawAlerts.push({
          severity: 1,
          icon: Thermometer, iconColor: "text-red-400", iconBg: "bg-red-500/15",
          title: `Temp Alert — ${t.location_name || "Unknown"}: ${t.value ?? t.temperature}°F`,
          meta: t.is_above_range ? "Above safe range" : "Below safe range",
          badge: "Critical", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
          path: "/temp-logs",
        }));

        // DISH MACHINE — failed
        if (dishFailed > 0) rawAlerts.push({
          severity: 1,
          icon: Droplet, iconColor: "text-red-400", iconBg: "bg-red-500/15",
          title: `Dish Machine Failed — ${dishFailed} unresolved`,
          meta: "Corrective action required",
          badge: "Critical", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
          path: "/dish-machines",
        });

        // ISSUES — critical
        const critIssues = issues.filter(i => i.status === "critical");
        const openIssues = issues.filter(i => i.status === "open" || i.status === "in_progress");
        critIssues.forEach(i => rawAlerts.push({
          severity: 1,
          icon: ShieldAlert, iconColor: "text-red-400", iconBg: "bg-red-500/15",
          title: i.title,
          meta: `Issue · ${i.category || "Other"}`,
          badge: "Critical", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
          path: "/issues",
        }));

        // INCIDENTS — critical
        incidents.filter(i => ["critical","high"].includes(i.severity)).forEach(i => rawAlerts.push({
          severity: 1,
          icon: AlertTriangle, iconColor: "text-red-400", iconBg: "bg-red-500/15",
          title: i.title || "Critical Incident",
          meta: `Incident · ${i.category || ""}`,
          badge: "Critical", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
          path: "/incidents",
        }));

        // INVENTORY — out / critical with prep impact
        const invOutItems = (inventoryItems || []).filter(i => ["critical","out"].includes(i.status));
        if (invOutItems.length > 0) rawAlerts.push({
          severity: invAtRisk > 0 ? 1 : 2,
          icon: ShieldAlert, iconColor: "text-red-400", iconBg: "bg-red-500/15",
          title: `${invOutItems.length} Inventory Item${invOutItems.length > 1 ? "s" : ""} Critical/Out`,
          meta: invAtRisk > 0 ? `${invAtRisk} prep item${invAtRisk > 1 ? "s" : ""} at risk` : invOutItems.map(i => i.name).slice(0, 2).join(", "),
          badge: invAtRisk > 0 ? "Prep At Risk" : "Critical", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
          path: "/issues",
        });

        // PREP — overdue items
        const overduePrepItems = todayPrep.filter(i => i.status === "overdue");
        if (overduePrepItems.length > 0) rawAlerts.push({
          severity: 2,
          icon: ClipboardList, iconColor: "text-orange-400", iconBg: "bg-orange-500/15",
          title: `${overduePrepItems.length} Prep Item${overduePrepItems.length > 1 ? "s" : ""} Overdue`,
          meta: overduePrepItems.slice(0, 2).map(i => i.name).join(", ") + (overduePrepItems.length > 2 ? " +more" : ""),
          badge: "Overdue", badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          path: "/prep-lists",
        });

        // PREP — at risk due to inventory
        const atRiskPrep = todayPrep.filter(i => i.at_risk && !["completed","approved"].includes(i.status));
        if (atRiskPrep.length > 0) rawAlerts.push({
          severity: 3,
          icon: ClipboardList, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15",
          title: `${atRiskPrep.length} Prep Item${atRiskPrep.length > 1 ? "s" : ""} At Risk`,
          meta: atRiskPrep.slice(0, 2).map(i => i.name).join(", ") + (atRiskPrep.length > 2 ? " +more" : ""),
          badge: "At Risk", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
          path: "/prep-lists",
        });

        // CLEANING — missed / overdue side work
        const overdueClean = sideWork.filter(t => t.status === "overdue");
        if (overdueClean.length > 0) rawAlerts.push({
          severity: 2,
          icon: Flame, iconColor: "text-orange-400", iconBg: "bg-orange-500/15",
          title: `${overdueClean.length} Cleaning Task${overdueClean.length > 1 ? "s" : ""} Missed`,
          meta: overdueClean.slice(0, 2).map(t => t.task_name).join(", ") + (overdueClean.length > 2 ? " +more" : ""),
          badge: "Overdue", badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          path: "/side-work",
        });

        // INVENTORY — low stock (not critical)
        if (invLow > 0 && invCritical === 0) rawAlerts.push({
          severity: 3,
          icon: ShieldAlert, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15",
          title: `${invLow} Inventory Item${invLow > 1 ? "s" : ""} Low Stock`,
          meta: "Below par level — reorder needed",
          badge: "Low Stock", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
          path: "/issues",
        });

        // OPEN ISSUES — non-critical
        if (openIssues.length > 0) rawAlerts.push({
          severity: 3,
          icon: ShieldAlert, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15",
          title: `${openIssues.length} Open Issue${openIssues.length > 1 ? "s" : ""} Unresolved`,
          meta: openIssues.slice(0, 2).map(i => i.title).join(", "),
          badge: "Open", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
          path: "/issues",
        });

        // MAINTENANCE — urgent
        if (mainUrgent > 0) rawAlerts.push({
          severity: 2,
          icon: Wrench, iconColor: "text-orange-400", iconBg: "bg-orange-500/15",
          title: `${mainUrgent} Urgent Maintenance Request${mainUrgent > 1 ? "s" : ""}`,
          meta: "Flagged as urgent or high priority",
          badge: "Urgent", badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          path: "/maintenance",
        });

        // CASH — variance
        if (cashIssues > 0) rawAlerts.push({
          severity: 2,
          icon: DollarSign, iconColor: "text-orange-400", iconBg: "bg-orange-500/15",
          title: `Cash Variance — ${cashIssues} Drawer${cashIssues > 1 ? "s" : ""} Off`,
          meta: "Drawer count out of balance",
          badge: "Review", badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          path: "/cash",
        });

        // DISH MACHINE — overdue check
        if (dishOverdue > 0 && !dishFailed) rawAlerts.push({
          severity: 2,
          icon: Droplet, iconColor: "text-orange-400", iconBg: "bg-orange-500/15",
          title: `${dishOverdue} Dish Machine${dishOverdue > 1 ? "s" : ""} Past Check Interval`,
          meta: "Log required",
          badge: "Overdue", badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          path: "/dish-machines",
        });

        // Sort: 1 → 2 → 3, then alphabetically by title within each tier
        const alerts = rawAlerts.sort((a, b) => a.severity - b.severity || a.title.localeCompare(b.title));

        // Today's Priorities

        const priorities = [];
        if (todayPrep.length > 0) priorities.push({ icon: ClipboardList, title: "Complete Today's Prep", meta: prepOverdue > 0 ? `${prepOverdue} OVERDUE · ${todayPrep.length - prepDone} remaining` : `${todayPrep.length - prepDone} remaining`, assignee: "Kitchen", actionLabel: "Open",  actionPath: "/prep-lists",  status: prepOverdue > 0 ? "overdue" : prepUrgent > 0 ? "overdue" : prepDone === todayPrep.length ? "ok" : "in-progress" });
        if (tempLogs.length < 2)  priorities.push({ icon: Thermometer,   title: "Temperature Checks",   meta: `${tempLogs.length} logged so far`,         assignee: "All Staff", actionLabel: "Log",   actionPath: "/temp-logs",   status: tempAlerts > 0 ? "overdue" : tempLogs.length === 0 ? "pending" : "in-progress" });
        if (sideWork.length > 0)  priorities.push({ icon: Flame,         title: "Side Work",            meta: `${swDone}/${sideWork.length} done`,          assignee: "FOH",       actionLabel: "View",  actionPath: "/side-work",   status: swUrgent > 0 ? "overdue" : swDone === sideWork.length ? "ok" : "in-progress" });
        if (priorities.length < 3 && issues.length > 0) priorities.push({ icon: ShieldAlert, title: "Open Issues", meta: `${issues.length} unresolved`, assignee: "Management", actionLabel: "View", actionPath: "/issues", status: "pending" });

        // Recent activity feed
        const activity = [];
        [...tempLogs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 2).forEach(t =>
          activity.push({ icon: Thermometer, iconColor: t.is_above_range || t.is_below_range ? "text-red-400" : "text-green-400", title: `Temp logged — ${t.location_name || "Station"}: ${t.value}°F`, time: t.logged_at ? new Date(t.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today" })
        );
        todayPrep.filter(i => i.status === "completed").sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)).slice(0, 2).forEach(p =>
          activity.push({ icon: CheckCircle2, iconColor: "text-green-400", title: `Checklist completed — ${p.name}`, time: p.completed_at ? new Date(p.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today" })
        );
        [...incidents].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 1).forEach(i =>
          activity.push({ icon: AlertTriangle, iconColor: "text-red-400", title: `Issue reported — ${i.title || "Incident"}`, time: new Date(i.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
        );

        setM({
          alerts,
          alertCounts: { critical: rawAlerts.filter(a => a.severity === 1).length, overdue: rawAlerts.filter(a => a.severity === 2).length, atRisk: rawAlerts.filter(a => a.severity === 3).length },
          priorities: priorities.slice(0, 3),
          activity: activity.slice(0, 5),
          latestHandoff: shiftHandoffs[0] || null,
          stats: {
            tasksDue: (todayPrep.filter(i => i.status !== 'completed').length) + swUrgent,
            tempChecks: tempLogs.length,
            openIssues: issues.length + incidents.length,
            onShift: staffShifts.length,
          },
          tempAlerts,
          onShift: staffShifts.length,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleStartShift = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await startShift(user);
      setShowStartModal(false);
    } catch (e) {
      console.error('Failed to start shift:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async (score, notes) => {
    setIsSubmitting(true);
    try {
      await completeShift(score, notes);
      setShowCloseModal(false);
    } catch (e) {
      console.error('Failed to close shift:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-[3px] border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!m) return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Failed to load</div>;

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="pb-2">
      {/* Shift Mode Modals */}
      {showStartModal && (
        <ShiftStartModal manager={user} onStart={handleStartShift} isLoading={isSubmitting} />
      )}
      {showCloseModal && shiftSession && (
        <ShiftCloseModal shiftSession={shiftSession} onClose={handleCloseShift} isLoading={isSubmitting} />
      )}

      {/* Greeting + Shift Controls */}
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">{getGreeting()}, {firstName}</h1>
        {!isShiftActive ? (
          <button
            onClick={() => setShowStartModal(true)}
            className="h-8 px-3 rounded-lg bg-primary/15 text-primary border border-primary/30 text-xs font-bold active:scale-95 transition-transform"
          >
            Start Shift
          </button>
        ) : (
          <button
            onClick={() => setShowCloseModal(true)}
            className="h-8 px-3 rounded-lg bg-red-600/15 text-red-400 border border-red-600/30 text-xs font-bold active:scale-95 transition-transform"
          >
            Close Shift
          </button>
        )}
      </div>

      {/* 3 Metric Cards — awareness only */}
      <div className="flex gap-1.5 mb-2.5">
        <Stat icon={ClipboardList} label="Tasks Due"   value={m.stats.tasksDue}   alert={m.stats.tasksDue > 0}   onClick={() => navigate("/prep-lists")} />
        <Stat icon={Thermometer}   label="Temp Checks" value={m.stats.tempChecks} alert={m.tempAlerts > 0}       onClick={() => navigate("/temp-logs")} />
        <Stat icon={AlertTriangle} label="Open Issues" value={m.stats.openIssues} alert={m.stats.openIssues > 0} onClick={() => navigate("/issues")} />
      </div>

      {/* Needs Attention */}
      <div className="flex items-center justify-between mb-1.5 mt-3 first:mt-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Needs Attention</p>
        {m.alerts.length > 0 && (
          <div className="flex items-center gap-1.5">
            {m.alertCounts.critical > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">{m.alertCounts.critical} Critical</span>}
            {m.alertCounts.overdue > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">{m.alertCounts.overdue} Overdue</span>}
            {m.alertCounts.atRisk > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">{m.alertCounts.atRisk} At Risk</span>}
          </div>
        )}
      </div>
      {m.alerts.length > 0 ? (
        <div className="space-y-1">
          {m.alerts.map((a, i) => <AlertCard key={i} {...a} onClick={() => navigate(a.path)} />)}
        </div>
      ) : (
        <div className="bg-green-500/8 border border-green-500/20 rounded-lg px-2.5 py-2 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <p className="text-xs font-bold text-green-400">All Clear</p>
        </div>
      )}

      {/* Today's Priorities */}
      {m.priorities.length > 0 && (
        <>
          <SectionLabel text="Priorities" action="All" onAction={() => navigate("/prep-lists")} />
          <div className="space-y-1">
            {m.priorities.map((p, i) => (
              <PriorityCard key={i} rank={i + 1} navigate={navigate} {...p} />
            ))}
          </div>
        </>
      )}



      {/* Quick Actions */}
      <SectionLabel text="Quick Actions" />
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <button onClick={() => navigate("/temp-logs")} className="flex flex-col items-center justify-center gap-1.5 bg-[#111827] border border-[#1F2937] rounded-lg p-2.5 active:scale-95 transition-transform min-h-[44px]">
          <Thermometer className="h-4 w-4 text-[#F5A623]" />
          <span className="text-[10px] font-bold text-white text-center">Temp</span>
        </button>
        <button onClick={() => navigate("/opening")} className="flex flex-col items-center justify-center gap-1.5 bg-[#111827] border border-[#1F2937] rounded-lg p-2.5 active:scale-95 transition-transform min-h-[44px]">
          <ClipboardList className="h-4 w-4 text-[#F5A623]" />
          <span className="text-[10px] font-bold text-white text-center">Check</span>
        </button>
        <button onClick={() => navigate("/manager-log")} className="flex flex-col items-center justify-center gap-1.5 bg-[#111827] border border-[#1F2937] rounded-lg p-2.5 active:scale-95 transition-transform min-h-[44px]">
          <FileText className="h-4 w-4 text-[#F5A623]" />
          <span className="text-[10px] font-bold text-white text-center">Note</span>
        </button>
        <button onClick={() => navigate("/issues")} className="flex flex-col items-center justify-center gap-1.5 bg-[#111827] border border-[#1F2937] rounded-lg p-2.5 active:scale-95 transition-transform min-h-[44px]">
          <AlertTriangle className="h-4 w-4 text-[#F5A623]" />
          <span className="text-[10px] font-bold text-white text-center">Issue</span>
        </button>
      </div>

      {/* Team Snapshot */}
      <SectionLabel text="Team" />
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-2 text-center">
          <p className="text-base font-bold text-white">{m.onShift || 0}</p>
          <p className="text-[8px] text-gray-600 font-bold uppercase mt-0.5">Shift</p>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-2 text-center">
          <p className="text-base font-bold text-orange-400">0</p>
          <p className="text-[8px] text-gray-600 font-bold uppercase mt-0.5">Late</p>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-2 text-center">
          <p className="text-base font-bold text-yellow-400">0</p>
          <p className="text-[8px] text-gray-600 font-bold uppercase mt-0.5">Sched</p>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-2 text-center">
          <p className="text-base font-bold text-red-400">0</p>
          <p className="text-[8px] text-gray-600 font-bold uppercase mt-0.5">Absent</p>
        </div>
      </div>

      {/* Recent Activity */}
      {m.activity.length > 0 && (
        <>
          <SectionLabel text="Activity" />
          <div className="space-y-1">
            {m.activity.map((act, i) => {
              const ActivityIcon = act.icon;
              return (
                <div key={i} className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-lg px-2 py-1.5">
                  <ActivityIcon className={cn("h-3 w-3 shrink-0", act.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 truncate">{act.title}</p>
                  </div>
                  <p className="text-[8px] text-gray-600 shrink-0 whitespace-nowrap">{act.time}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Last Handoff Note */}
      {m.latestHandoff && (
        <>
          <SectionLabel text="Handoff" action="All" onAction={() => navigate("/shift-handoff")} />
          <div className="bg-[#111827] border border-[#1F2937] rounded-lg px-2.5 py-2 space-y-1">
            {[
              { key: "items_86d",             label: "86'd" },
              { key: "staff_issues",           label: "Staff" },
              { key: "maintenance_problems",   label: "Maint." },
              { key: "notes_for_next_manager", label: "Notes" },
            ].filter(f => m.latestHandoff[f.key]).map(f => (
              <p key={f.key} className="text-[10px] text-gray-500 leading-snug">
                <span className="font-bold text-gray-300">{f.label}: </span>
                {m.latestHandoff[f.key].substring(0, 60)}{m.latestHandoff[f.key].length > 60 ? "…" : ""}
              </p>
            ))}
          </div>
        </>
      )}

      {/* Shift Mode Footer CTA */}
      {!isShiftActive && !loading && m && (
        <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">Ready to manage operations?</p>
          <button
            onClick={() => setShowStartModal(true)}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-xs active:scale-95 transition-transform"
          >
            Begin Shift Mode
          </button>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;