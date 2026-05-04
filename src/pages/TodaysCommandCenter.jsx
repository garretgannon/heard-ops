import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, AlertTriangle, Thermometer, Wrench, DollarSign,
  Droplet, CalendarDays, ChevronRight, ShieldAlert, Users,
  CheckCircle2, Clock, FileText, UserCheck, UserX, Plus, Flame
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
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1 bg-[#111827] border border-[#1F2937] rounded-xl py-3 px-1.5 active:scale-95 transition-transform min-w-0">
      <Icon className={cn("h-4 w-4", alert ? "text-red-400" : "text-[#F5A623]")} />
      <span className={cn("text-xl font-extrabold leading-none", alert ? "text-red-400" : "text-white")}>{value}</span>
      <span className="text-[10px] text-gray-500 font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}

function AlertCard({ icon: Icon, iconColor, iconBg, title, meta, badge, badgeColor, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform text-left">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight truncate">{title}</p>
        {meta && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{meta}</p>}
      </div>
      {badge && <Badge label={badge} color={badgeColor} />}
      <ChevronRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
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
    <div className="flex items-center gap-3 bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5">
      <span className="text-sm font-extrabold text-[#F5A623]/40 w-4 shrink-0 text-center">{rank}</span>
      <div className="h-8 w-8 rounded-lg bg-[#1C2432] flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-[#F5A623]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight truncate">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{assignee}{meta ? ` · ${meta}` : ""}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge label={status} color={statusColors[status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"} />
        <button onClick={() => navigate(actionPath)}
          className="text-[10px] font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/25 px-2 py-0.5 rounded-lg active:scale-95 transition-transform">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function QA({ icon: Icon, label, iconColor, bg, onClick }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1.5 bg-[#111827] border border-[#1F2937] rounded-xl py-3 px-1 active:scale-95 transition-transform min-w-0">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", bg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <span className="text-[10px] text-gray-500 font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ── Page ───────────────────────────────────────────────── */

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    (async () => {
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
          base44.entities.ShiftHandoff.list("-created_date", 5),
          base44.entities.DrawerCount.filter({ date: todayStr }),
          base44.entities.DishMachineLog.filter({ date: todayStr }),
          base44.entities.DishMachineEquipment.list(),
          base44.entities.CalendarEvent.list("-date", 100),
          base44.entities.StaffShift.filter({ date: todayStr, status: "published" }).catch(() => []),
          base44.entities.Issue.filter({ status: "open" }).catch(() => []),
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

        // Needs Attention alerts
        const alerts = [];
        if (incCrit > 0)    alerts.push({ icon: AlertTriangle, iconColor: "text-red-400",    iconBg: "bg-red-500/15",    title: "Critical Incident",    meta: `${incCrit} unresolved`,                          badge: "Critical", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",        path: "/incidents" });
        if (dishFailed > 0) alerts.push({ icon: Droplet,       iconColor: "text-red-400",    iconBg: "bg-red-500/15",    title: "Dish Machine Failed",  meta: `${dishFailed} need attention`,                   badge: "Failed",   badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",        path: "/dish-machines" });
        if (tempAlerts > 0) alerts.push({ icon: Thermometer,   iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15", title: "High Temp Alert",      meta: `${tempAlerts} reading out of range`,              badge: "Alert",    badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/temp-logs" });
        if (prepOverdue > 0) alerts.push({ icon: ClipboardList, iconColor: "text-red-400", iconBg: "bg-red-500/15", title: `Overdue Prep — ${prepOverdue} item${prepOverdue > 1 ? 's' : ''} missed due time`, meta: `${prepUrgent > 0 ? prepUrgent + ' high priority · ' : ''}Added to Shift Handoff`, badge: "Overdue", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30", path: "/prep-lists" });
        else if (prepUrgent > 0) alerts.push({ icon: ClipboardList, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15", title: "Overdue Prep Items",   meta: `${prepUrgent} high-priority not started`,          badge: "Urgent",  badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/prep-lists" });
        if (swOverdue > 0) alerts.push({ icon: Flame, iconColor: "text-red-400", iconBg: "bg-red-500/15", title: `Overdue Side Work — ${swOverdue} task${swOverdue > 1 ? 's' : ''} missed due time`, meta: swOverdue + ' not completed on time', badge: "Overdue", badgeColor: "bg-red-500/15 text-red-400 border-red-500/30", path: "/side-work" });
        if (mainUrgent > 0) alerts.push({ icon: Wrench,        iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15", title: "Urgent Maintenance",   meta: `${mainUrgent} flagged urgent`,                    badge: "Urgent",   badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/maintenance" });
        if (cashIssues > 0) alerts.push({ icon: DollarSign,    iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15", title: "Cash Variance",        meta: `${cashIssues} drawer${cashIssues > 1 ? "s" : ""} out of balance`, badge: "Review", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/cash" });
        if (dishOverdue > 0 && !dishFailed) alerts.push({ icon: Droplet, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15", title: "Dish Machine Overdue", meta: `${dishOverdue} past check interval`, badge: "Overdue", badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", path: "/dish-machines" });

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
          alerts: alerts.slice(0, 5),
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-[3px] border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!m) return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Failed to load</div>;

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="pb-2">

      {/* Greeting */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">{getGreeting()}, {firstName}</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">Here's what needs your attention today</p>
        </div>
        <button onClick={() => navigate("/prep-lists")}
          className="flex items-center gap-1.5 text-xs font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/25 px-3 py-2 rounded-xl active:scale-95 transition-transform">
          <Plus className="h-3.5 w-3.5" /> Task
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="flex gap-2 mb-3">
        <Stat icon={ClipboardList} label="Tasks Due"    value={m.stats.tasksDue}    alert={m.stats.tasksDue > 0}    onClick={() => navigate("/prep-lists")} />
        <Stat icon={Thermometer}   label="Temp Checks"  value={m.stats.tempChecks}  alert={m.tempAlerts > 0}        onClick={() => navigate("/temp-logs")} />
        <Stat icon={AlertTriangle} label="Open Issues"  value={m.stats.openIssues}  alert={m.stats.openIssues > 0}  onClick={() => navigate("/incidents")} />
        <Stat icon={Users}         label="On Shift"     value={m.stats.onShift}                                     onClick={() => navigate("/schedule-center")} />
      </div>

      {/* Needs Attention */}
      <SectionLabel text="⚡ Needs Attention" />
      {m.alerts.length > 0 ? (
        <div className="space-y-1.5">
          {m.alerts.map((a, i) => <AlertCard key={i} {...a} onClick={() => navigate(a.path)} />)}
        </div>
      ) : (
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-2.5 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-400">All Clear</p>
            <p className="text-[11px] text-gray-500">No critical issues right now</p>
          </div>
        </div>
      )}

      {/* Today's Priorities */}
      {m.priorities.length > 0 && (
        <>
          <SectionLabel text="Today's Priorities" action="All Tasks" onAction={() => navigate("/prep-lists")} />
          <div className="space-y-1.5">
            {m.priorities.map((p, i) => (
              <PriorityCard key={i} rank={i + 1} navigate={navigate} {...p} />
            ))}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <SectionLabel text="Quick Actions" />
      <div className="flex gap-2">
        <QA icon={Thermometer}   label="Log Temp"      iconColor="text-[#F5A623]"  bg="bg-[#F5A623]/10"  onClick={() => navigate("/temp-logs")} />
        <QA icon={ClipboardList} label="Start Checklist" iconColor="text-blue-400" bg="bg-blue-500/10"   onClick={() => navigate("/prep-lists")} />
        <QA icon={AlertTriangle} label="Report Issue"  iconColor="text-red-400"    bg="bg-red-500/10"    onClick={() => navigate("/incidents")} />
        <QA icon={FileText}      label="Add Note"      iconColor="text-purple-400" bg="bg-purple-500/10" onClick={() => navigate("/manager-log")} />
      </div>

      {/* Team Snapshot */}
      <SectionLabel text="Team Snapshot" action="Schedule" onAction={() => navigate("/schedule-center")} />
      <div className="flex gap-2">
        {[
          { icon: UserCheck, label: "On Shift", value: m.onShift, color: "text-green-400" },
          { icon: Clock,     label: "Late",     value: 0,          color: "text-yellow-400" },
          { icon: UserX,     label: "Absent",   value: 0,          color: "text-red-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex-1 bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Icon className={cn("h-4 w-4 shrink-0", color)} />
            <div>
              <p className="text-lg font-extrabold leading-none text-white">{value}</p>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Feed */}
      {m.activity.length > 0 && (
        <>
          <SectionLabel text="Recent Activity" />
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-1 divide-y divide-[#1F2937]">
            {m.activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-7 w-7 rounded-lg bg-[#1C2432] flex items-center justify-center shrink-0">
                    <Icon className={cn("h-3.5 w-3.5", a.iconColor)} />
                  </div>
                  <p className="flex-1 text-xs text-gray-400 leading-snug">{a.title}</p>
                  <span className="text-[10px] text-gray-600 shrink-0">{a.time}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Last Handoff Note */}
      {m.latestHandoff && (
        <>
          <SectionLabel text="Last Shift Handoff" action="All" onAction={() => navigate("/shift-handoff")} />
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 space-y-1.5">
            {[
              { key: "items_86d",             label: "86'd" },
              { key: "staff_issues",           label: "Staff" },
              { key: "maintenance_problems",   label: "Maint." },
              { key: "notes_for_next_manager", label: "Notes" },
            ].filter(f => m.latestHandoff[f.key]).map(f => (
              <p key={f.key} className="text-xs text-gray-500 leading-snug">
                <span className="font-semibold text-gray-300">{f.label}: </span>
                {m.latestHandoff[f.key].substring(0, 80)}{m.latestHandoff[f.key].length > 80 ? "…" : ""}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const hideBase44Index = true;