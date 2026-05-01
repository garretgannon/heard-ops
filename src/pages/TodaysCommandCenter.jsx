import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ClipboardList, AlertTriangle, Thermometer, Wrench, DollarSign, Truck, Camera, TrendingUp, Plus, CheckCircle2, Clock, AlertCircle, Droplet, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CompactCard = ({ icon: Icon, title, count, done, total, label, urgentCount, status, onClick }) => {
  const progress = total > 0 ? Math.round((done / total) * 100) : null;
  const borderColor = status === 'critical' ? 'border-red-500/50' : status === 'high' ? 'border-yellow-500/40' : 'border-border';
  const progressColor = status === 'critical' ? 'bg-red-500' : status === 'high' ? 'bg-yellow-400' : 'bg-primary';

  return (
    <button
      onClick={onClick}
      className={cn("bg-card border rounded-xl p-3 flex flex-col justify-between text-left active:scale-95 transition-transform w-full", borderColor)}
      style={{ minHeight: 96, maxHeight: 110 }}
    >
      {/* Top row: icon + title */}
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground truncate">{title}</span>
      </div>

      {/* Middle: main count */}
      <div className="text-xl font-bold leading-tight my-1">{count}</div>

      {/* Bottom: progress bar + label */}
      <div className="space-y-1">
        {progress !== null && (
          <div className="h-1 w-full bg-border rounded-full overflow-hidden">
            <div className={cn("h-1 rounded-full transition-all", progressColor)} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Today's Command Center</h1>
        <p className="text-lg text-muted-foreground mt-2">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Button onClick={() => navigate("/prep-lists")} variant="outline" className="h-auto py-3"><Plus className="h-4 w-4 mr-2" />Add Task</Button>
          <Button onClick={() => navigate("/pre-shift")} variant="outline" className="h-auto py-3">Start Pre-Shift</Button>
          <Button onClick={() => navigate("/photo-review")} variant="outline" className="h-auto py-3">Review Photos</Button>
          <Button onClick={() => navigate("/maintenance")} variant="outline" className="h-auto py-3">Log Issue</Button>
          <Button onClick={() => navigate("/shift-handoff")} variant="outline" className="h-auto py-3">Create Handoff</Button>
          <Button onClick={() => navigate("/side-work")} variant="outline" className="h-auto py-3">Assign Tasks</Button>
        </div>
      </div>

      {/* Urgent Alerts Section */}
      {metrics.urgentAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-600">🚨 Urgent Today</h2>
          <div className="grid gap-3">
            {metrics.urgentAlerts.map((alert, i) => {
              const config = {
                incidents: { icon: AlertTriangle, label: 'Critical Incident', path: '/incidents' },
                dish_failed: { icon: Droplet, label: 'Dish Machine Failed', path: '/dish-machines' },
                dish_overdue: { icon: Droplet, label: 'Dish Machine Overdue', path: '/dish-machines' },
                maintenance: { icon: Wrench, label: 'Urgent Maintenance', path: '/maintenance' },
                prep: { icon: ClipboardList, label: 'High-Priority Prep', path: '/prep-lists' },
                templogs: { icon: Thermometer, label: 'Temp Alert', path: '/temp-logs' },
                sidework: { icon: Camera, label: 'Overdue Side Work', path: '/side-work' },
                cash: { icon: DollarSign, label: 'Cash Variance', path: '/cash' },
              }[alert.type];

              const Icon = config.icon;
              return (
                <div key={i} className="bg-red-500/10 border-l-4 border-red-500 rounded-r-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{alert.count} item{alert.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate(config.path)} size="sm" variant="ghost" className="text-red-600">Review</Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Dashboard Cards */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">What Needs Attention?</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CompactCard
          icon={ClipboardList}
          title="Prep"
          count={`${metrics.prep.completed}/${metrics.prep.total} done`}
          done={metrics.prep.completed}
          total={metrics.prep.total}
          label={metrics.prep.urgent > 0 ? `${metrics.prep.urgent} overdue` : "On track"}
          status={metrics.prep.urgent > 0 ? 'high' : 'low'}
          onClick={() => navigate("/prep-lists")}
        />
        <CompactCard
          icon={Camera}
          title="Side Work"
          count={`${metrics.sideWork.completed}/${metrics.sideWork.total} done`}
          done={metrics.sideWork.completed}
          total={metrics.sideWork.total}
          label={metrics.sideWork.urgent > 0 ? `${metrics.sideWork.urgent} overdue` : "On track"}
          status={metrics.sideWork.urgent > 0 ? 'high' : 'low'}
          onClick={() => navigate("/side-work")}
        />
        <CompactCard
          icon={Thermometer}
          title="Temp Logs"
          count={metrics.tempLogs.outOfRange > 0 ? `${metrics.tempLogs.outOfRange} alerts` : "All OK"}
          label={`${metrics.tempLogs.total} logged today`}
          status={metrics.tempLogs.outOfRange > 0 ? 'high' : 'low'}
          onClick={() => navigate("/temp-logs")}
        />
        <CompactCard
          icon={Wrench}
          title="Maintenance"
          count={`${metrics.maintenance.open} open`}
          label={metrics.maintenance.urgent > 0 ? `${metrics.maintenance.urgent} urgent` : "No urgent items"}
          status={metrics.maintenance.urgent > 0 ? 'high' : 'low'}
          onClick={() => navigate("/maintenance")}
        />
        <CompactCard
          icon={AlertTriangle}
          title="Incidents"
          count={`${metrics.incidents.open} open`}
          label={metrics.incidents.urgent > 0 ? `${metrics.incidents.urgent} critical` : "No critical items"}
          status={metrics.incidents.urgent > 0 ? 'critical' : 'low'}
          onClick={() => navigate("/incidents")}
        />
        <CompactCard
          icon={DollarSign}
          title="Cash"
          count={metrics.cash.issues > 0 ? `${metrics.cash.issues} variance` : "Balanced"}
          label={`${metrics.cash.total} drawers counted`}
          status={metrics.cash.issues > 0 ? 'high' : 'low'}
          onClick={() => navigate("/cash")}
        />
        <CompactCard
          icon={Camera}
          title="Photos"
          count={`${metrics.photoReview.pending} pending`}
          label="Awaiting review"
          status={metrics.photoReview.pending > 0 ? 'medium' : 'low'}
          onClick={() => navigate("/photo-review")}
        />
        <CompactCard
          icon={Truck}
          title="Vendors"
          count={`${metrics.vendors.total} contacts`}
          label="Tap to view"
          onClick={() => navigate("/vendors")}
        />
      </div>

      {/* Upcoming Calendar Events */}
      {metrics.calendar?.upcoming?.length > 0 && (
        <div className="bg-card border-2 border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming Events (Next 3 Days)
            </h2>
            <Button onClick={() => navigate("/calendar")} variant="ghost" size="sm" className="text-xs">View All</Button>
          </div>
          <div className="space-y-2">
            {metrics.calendar.upcoming.map((ev, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.date}{ev.time ? ` · ${ev.time}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Shift Handoff */}
      {metrics.latestHandoff && (
        <div className="bg-card border-2 border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Last Shift Summary
            </h2>
            <Button onClick={() => navigate("/shift-handoff")} variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {metrics.latestHandoff.items_86d && <p className="text-muted-foreground"><span className="font-semibold">86'd:</span> {metrics.latestHandoff.items_86d.substring(0, 50)}</p>}
            {metrics.latestHandoff.staff_issues && <p className="text-muted-foreground"><span className="font-semibold">Staff:</span> {metrics.latestHandoff.staff_issues.substring(0, 50)}</p>}
            {metrics.latestHandoff.maintenance_problems && <p className="text-muted-foreground"><span className="font-semibold">Maintenance:</span> {metrics.latestHandoff.maintenance_problems.substring(0, 50)}</p>}
            {metrics.latestHandoff.notes_for_next_manager && <p className="text-muted-foreground"><span className="font-semibold">Notes:</span> {metrics.latestHandoff.notes_for_next_manager.substring(0, 50)}</p>}
          </div>
        </div>
      )}

    </div>
  );
}

export const hideBase44Index = true;