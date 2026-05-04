import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ClipboardList, AlertTriangle, Thermometer, Wrench, DollarSign, Truck, Camera, TrendingUp, Plus, CheckCircle2, Clock, AlertCircle, Droplet, CalendarDays, Users, Utensils, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ScheduledStaffSection from "@/components/ScheduledStaffSection";

const CompactCard = ({ icon: Icon, title, count, done, total, label, status, onClick }) => {
  const progress = total > 0 ? Math.round((done / total) * 100) : null;
  const borderColor = status === 'critical' ? 'border-red-500/60' : status === 'high' ? 'border-yellow-500/50' : 'border-border';
  const progressColor = status === 'critical' ? 'bg-red-500' : status === 'high' ? 'bg-yellow-400' : 'bg-primary';
  const iconColor = status === 'critical' ? 'text-red-400' : status === 'high' ? 'text-yellow-400' : 'text-primary';

  return (
    <button
      onClick={onClick}
      className={cn("bg-card border rounded-xl p-3 flex flex-col gap-1 text-left active:scale-95 transition-transform w-full", borderColor)}
    >
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4 shrink-0", iconColor)} />
        {(status === 'critical' || status === 'high') && (
          <span className={cn("h-1.5 w-1.5 rounded-full", status === 'critical' ? 'bg-red-500' : 'bg-yellow-400')} />
        )}
      </div>
      <p className="text-[11px] font-semibold text-muted-foreground">{title}</p>
      <p className="text-base font-bold leading-tight text-foreground">{count}</p>
      <div className="space-y-1">
        {progress !== null && (
          <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
            <div className={cn("h-0.5 rounded-full transition-all", progressColor)} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </button>
  );
};

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const [
          prepLists,
          prepItems,
          sideWork,
          tempLogs,
          maintenance,
          incidents,
          vendors,
          preShift,
          shiftHandoffs,
          cashDrawers,
          dishLogs,
          dishMachines,
          calendarEvents,
          staffShifts,
        ] = await Promise.all([
          base44.entities.PrepList.filter({ date: todayStr }),
          base44.entities.PrepItem.list("-updated_date", 300),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }),
          base44.entities.TempLogEntry.filter({ date: todayStr }),
          base44.entities.MaintenanceRequest.filter({ status: "open" }),
          base44.entities.IncidentReport.filter({ status: "open" }),
          base44.entities.Vendor.list(),
          base44.entities.PreShift.filter({ date: todayStr }),
          base44.entities.ShiftHandoff.list("-created_date", 5),
          base44.entities.DrawerCount.filter({ date: todayStr }),
          base44.entities.DishMachineLog.filter({ date: todayStr }),
          base44.entities.DishMachineEquipment.list(),
          base44.entities.CalendarEvent.list("-date", 100),
          base44.entities.StaffShift.filter({ date: todayStr, status: "published" }).catch(() => []),
        ]);

        const todayPrepItems = prepItems.filter(item => prepLists.some(pl => pl.id === item.prep_list_id));
        const prepCompleted = todayPrepItems.filter(i => i.status === "completed").length;
        const prepPending = todayPrepItems.filter(i => i.status !== "completed");
        const prepUrgent = todayPrepItems.filter(i => i.priority === "high" && i.status !== "completed");

        const sideWorkCompleted = sideWork.filter(t => t.status === "completed" || t.status === "approved").length;
        const sideWorkPending = sideWork.filter(t => t.status === "pending");
        const sideWorkUrgent = sideWork.filter(t => t.priority === "high" && t.status === "pending");

        const tempLogsOutOfRange = tempLogs.filter(tl => tl.is_above_range || tl.is_below_range).length;
        const photoPending = prepItems.filter(pi => pi.status === "completed" && pi.photo_url && !pi.photo_approved).length;

        const maintenanceUrgent = maintenance.filter(m => m.priority === "urgent" || m.priority === "high").length;
        const incidentsUrgent = incidents.filter(i => i.severity === "critical" || i.severity === "high").length;

        const cashIssues = cashDrawers.filter(d => Math.abs(d.variance || 0) > 0).length;
        const latestHandoff = shiftHandoffs.length > 0 ? shiftHandoffs[0] : null;

        // Build urgent alerts list
        const urgentAlerts = [];
        if (incidentsUrgent > 0) urgentAlerts.push({ type: 'incidents', count: incidentsUrgent, status: 'critical' });
        if (maintenanceUrgent > 0) urgentAlerts.push({ type: 'maintenance', count: maintenanceUrgent, status: 'critical' });
        if (prepUrgent.length > 0) urgentAlerts.push({ type: 'prep', count: prepUrgent.length, status: 'high' });
        if (tempLogsOutOfRange > 0) urgentAlerts.push({ type: 'templogs', count: tempLogsOutOfRange, status: 'high' });
        if (sideWorkUrgent.length > 0) urgentAlerts.push({ type: 'sidework', count: sideWorkUrgent.length, status: 'high' });
        if (cashIssues > 0) urgentAlerts.push({ type: 'cash', count: cashIssues, status: 'high' });

        // Dish machine alerts
        const dishFailed = dishLogs.filter(l => l.status === "fail" && !l.corrective_action_resolved).length;
        const dishOverdue = dishMachines.filter(m => {
          if (!m.is_active) return false;
          const mLogs = dishLogs.filter(l => l.machine_id === m.id && l.status === "pass");
          if (mLogs.length === 0) return true;
          const last = mLogs.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0];
          return (Date.now() - new Date(last.logged_at).getTime()) / 3600000 > (m.check_frequency_hours || 4);
        }).length;
        if (dishFailed > 0) urgentAlerts.push({ type: 'dish_failed', count: dishFailed, status: 'critical' });
        else if (dishOverdue > 0) urgentAlerts.push({ type: 'dish_overdue', count: dishOverdue, status: 'high' });

        // Calendar: important events today + next 3 days
        const sevenDaysOut = new Date(); sevenDaysOut.setDate(sevenDaysOut.getDate() + 3);
        const sevenOutStr = sevenDaysOut.toISOString().split("T")[0];
        const upcomingCal = calendarEvents.filter(e => e.date >= todayStr && e.date <= sevenOutStr &&
          ["private_event","catering","reservation_buyout","maintenance","inspection"].includes(e.category)
        );

        setMetrics({ calendar: { upcoming: upcomingCal.slice(0, 3) },
          staffShifts: staffShifts || [],

          prep: { completed: prepCompleted, total: todayPrepItems.length, pending: prepPending.length, urgent: prepUrgent.length },
          sideWork: { completed: sideWorkCompleted, total: sideWork.length, pending: sideWorkPending.length, urgent: sideWorkUrgent.length },
          tempLogs: { outOfRange: tempLogsOutOfRange, total: tempLogs.length },
          maintenance: { open: maintenance.length, urgent: maintenanceUrgent, list: maintenance.slice(0, 3) },
          incidents: { open: incidents.length, urgent: incidentsUrgent, list: incidents.slice(0, 3) },
          vendors: { total: Math.ceil(vendors.length / 3) },
          preShift: { done: preShift.length > 0 },
          cash: { issues: cashIssues, total: cashDrawers.length },
          photoReview: { pending: photoPending },
          latestHandoff,
          urgentAlerts: urgentAlerts.slice(0, 4),
        });
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Command Center</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
        <Button onClick={() => navigate("/prep-lists")} size="sm" className="gap-1.5 h-8 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Task
        </Button>
      </div>

      {/* Quick Actions — horizontal scroll pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {[
          { label: "Pre-Shift",   icon: Utensils,      path: "/pre-shift" },
          { label: "Handoff",     icon: TrendingUp,    path: "/shift-handoff" },
          { label: "Side Work",   icon: CheckCircle2,  path: "/side-work" },
          { label: "Photos",      icon: Camera,        path: "/photo-review" },
          { label: "Log Issue",   icon: ShieldAlert,   path: "/maintenance" },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card text-xs font-semibold text-foreground whitespace-nowrap hover:bg-secondary active:scale-95 transition-all">
            <a.icon className="h-3.5 w-3.5 text-primary" />{a.label}
          </button>
        ))}
      </div>

      {/* Urgent Alerts */}
      {metrics.urgentAlerts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">⚡ Needs Attention</p>
          {metrics.urgentAlerts.map((alert, i) => {
            const config = {
              incidents:    { icon: AlertTriangle, label: 'Critical Incident',   path: '/incidents' },
              dish_failed:  { icon: Droplet,       label: 'Dish Machine Failed', path: '/dish-machines' },
              dish_overdue: { icon: Droplet,       label: 'Dish Machine Overdue',path: '/dish-machines' },
              maintenance:  { icon: Wrench,        label: 'Urgent Maintenance',  path: '/maintenance' },
              prep:         { icon: ClipboardList, label: 'High-Priority Prep',  path: '/prep-lists' },
              templogs:     { icon: Thermometer,   label: 'Temp Alert',          path: '/temp-logs' },
              sidework:     { icon: Camera,        label: 'Overdue Side Work',   path: '/side-work' },
              cash:         { icon: DollarSign,    label: 'Cash Variance',       path: '/cash' },
            }[alert.type];
            const Icon = config.icon;
            const isCrit = alert.status === 'critical';
            return (
              <button key={i} onClick={() => navigate(config.path)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left active:scale-[0.98] transition-transform",
                  isCrit ? "bg-red-500/10 border-red-500/40" : "bg-yellow-500/8 border-yellow-500/30")}>
                <Icon className={cn("h-4 w-4 shrink-0", isCrit ? "text-red-400" : "text-yellow-400")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{config.label}</p>
                  <p className="text-[11px] text-muted-foreground">{alert.count} item{alert.count !== 1 ? 's' : ''} need action</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Dashboard Cards */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Today's Status</p>
        <div className="grid grid-cols-2 gap-2">
          <CompactCard icon={ClipboardList} title="Prep" count={`${metrics.prep.completed}/${metrics.prep.total}`} done={metrics.prep.completed} total={metrics.prep.total} label={metrics.prep.urgent > 0 ? `${metrics.prep.urgent} overdue` : "On track"} status={metrics.prep.urgent > 0 ? 'high' : 'low'} onClick={() => navigate("/prep-lists")} />
          <CompactCard icon={Camera} title="Side Work" count={`${metrics.sideWork.completed}/${metrics.sideWork.total}`} done={metrics.sideWork.completed} total={metrics.sideWork.total} label={metrics.sideWork.urgent > 0 ? `${metrics.sideWork.urgent} overdue` : "On track"} status={metrics.sideWork.urgent > 0 ? 'high' : 'low'} onClick={() => navigate("/side-work")} />
          <CompactCard icon={Thermometer} title="Temp Logs" count={metrics.tempLogs.outOfRange > 0 ? `${metrics.tempLogs.outOfRange} alerts` : "All OK"} label={`${metrics.tempLogs.total} logged`} status={metrics.tempLogs.outOfRange > 0 ? 'high' : 'low'} onClick={() => navigate("/temp-logs")} />
          <CompactCard icon={Wrench} title="Maintenance" count={`${metrics.maintenance.open} open`} label={metrics.maintenance.urgent > 0 ? `${metrics.maintenance.urgent} urgent` : "No urgent"} status={metrics.maintenance.urgent > 0 ? 'high' : 'low'} onClick={() => navigate("/maintenance")} />
          <CompactCard icon={AlertTriangle} title="Incidents" count={`${metrics.incidents.open} open`} label={metrics.incidents.urgent > 0 ? `${metrics.incidents.urgent} critical` : "All clear"} status={metrics.incidents.urgent > 0 ? 'critical' : 'low'} onClick={() => navigate("/incidents")} />
          <CompactCard icon={DollarSign} title="Cash" count={metrics.cash.issues > 0 ? `${metrics.cash.issues} variance` : "Balanced"} label={`${metrics.cash.total} drawers`} status={metrics.cash.issues > 0 ? 'high' : 'low'} onClick={() => navigate("/cash")} />
          <CompactCard icon={Camera} title="Photos" count={`${metrics.photoReview.pending}`} label="Pending review" status={metrics.photoReview.pending > 0 ? 'medium' : 'low'} onClick={() => navigate("/photo-review")} />
          <CompactCard icon={Truck} title="Vendors" count={`${metrics.vendors.total}`} label="Contacts" onClick={() => navigate("/vendors")} />
        </div>
      </div>

      {/* Calendar Events */}
      {metrics.calendar?.upcoming?.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
            <p className="text-xs font-bold flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-primary" />Upcoming (3 days)</p>
            <button onClick={() => navigate("/calendar")} className="text-[11px] text-primary font-semibold">View all</button>
          </div>
          {metrics.calendar.upcoming.map((ev, i) => (
            <div key={i} className={cn("flex items-center justify-between px-3 py-2.5 text-sm", i < metrics.calendar.upcoming.length - 1 && "border-b border-border/30")}>
              <p className="font-semibold truncate mr-2">{ev.title}</p>
              <p className="text-[11px] text-muted-foreground shrink-0">{ev.date}{ev.time ? ` · ${ev.time}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled Staff */}
      <ScheduledStaffSection shifts={metrics.staffShifts || []} onManage={() => navigate("/schedule-import")} />

      {/* Latest Handoff */}
      {metrics.latestHandoff && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
            <p className="text-xs font-bold flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" />Last Shift Handoff</p>
            <button onClick={() => navigate("/shift-handoff")} className="text-[11px] text-primary font-semibold">View all</button>
          </div>
          <div className="px-3 py-2.5 space-y-1.5">
            {[
              { key: "items_86d",             label: "86'd" },
              { key: "staff_issues",           label: "Staff" },
              { key: "maintenance_problems",   label: "Maint." },
              { key: "notes_for_next_manager", label: "Notes" },
            ].filter(f => metrics.latestHandoff[f.key]).map(f => (
              <p key={f.key} className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{f.label}: </span>
                {metrics.latestHandoff[f.key].substring(0, 60)}{metrics.latestHandoff[f.key].length > 60 ? '…' : ''}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;