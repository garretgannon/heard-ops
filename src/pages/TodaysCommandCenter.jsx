import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ClipboardList, AlertTriangle, Thermometer, Wrench, DollarSign, Truck, Camera, TrendingUp, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const StatusIcon = ({ status }) => {
  if (status === 'critical' || status === 'high') return <AlertCircle className="h-4 w-4 text-red-500" />;
  if (status === 'medium') return <Clock className="h-4 w-4 text-yellow-500" />;
  return <CheckCircle2 className="h-4 w-4 text-green-500" />;
};

const DashboardCard = ({ icon: Icon, title, count, status, assigned, onClick, onViewAll }) => {
  const statusColor = status === 'critical' ? 'border-red-500/40 bg-red-500/5' : status === 'high' ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-border';

  return (
    <div className={cn("bg-card border-2 rounded-xl p-4 hover:shadow-md transition-all", statusColor)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        <StatusIcon status={status} />
      </div>

      <div className="space-y-3">
        <div className="text-2xl font-bold text-primary">{count}</div>
        {assigned && <p className="text-xs text-muted-foreground">Assigned: {assigned}</p>}
        <Button onClick={onClick} variant="outline" size="sm" className="w-full">Take Action</Button>
        {onViewAll && <Button onClick={onViewAll} variant="ghost" size="sm" className="w-full">View All</Button>}
      </div>
    </div>
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

        setMetrics({
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard
          icon={ClipboardList}
          title="Prep Progress"
          count={`${metrics.prep.completed}/${metrics.prep.total}`}
          status={metrics.prep.pending === 0 ? 'low' : metrics.prep.urgent > 0 ? 'high' : 'medium'}
          onClick={() => navigate("/prep-lists")}
        />
        <DashboardCard
          icon={Camera}
          title="Side Work"
          count={`${metrics.sideWork.completed}/${metrics.sideWork.total}`}
          status={metrics.sideWork.pending === 0 ? 'low' : metrics.sideWork.urgent > 0 ? 'high' : 'medium'}
          onClick={() => navigate("/side-work")}
        />
        <DashboardCard
          icon={Thermometer}
          title="Temp Logs"
          count={metrics.tempLogs.outOfRange > 0 ? `${metrics.tempLogs.outOfRange} ALERT` : "OK"}
          status={metrics.tempLogs.outOfRange > 0 ? 'high' : 'low'}
          onClick={() => navigate("/temp-logs")}
        />
        <DashboardCard
          icon={Wrench}
          title="Maintenance"
          count={metrics.maintenance.open}
          status={metrics.maintenance.urgent > 0 ? 'high' : 'medium'}
          onClick={() => navigate("/maintenance")}
        />
        <DashboardCard
          icon={AlertTriangle}
          title="Incidents"
          count={metrics.incidents.open}
          status={metrics.incidents.urgent > 0 ? 'critical' : 'medium'}
          onClick={() => navigate("/incidents")}
        />
        <DashboardCard
          icon={DollarSign}
          title="Cash Issues"
          count={metrics.cash.issues}
          status={metrics.cash.issues > 0 ? 'high' : 'low'}
          onClick={() => navigate("/cash")}
        />
        <DashboardCard
          icon={Camera}
          title="Photo Review"
          count={metrics.photoReview.pending}
          status={metrics.photoReview.pending > 0 ? 'medium' : 'low'}
          onClick={() => navigate("/photo-review")}
        />
        <DashboardCard
          icon={Truck}
          title="Vendor Follow-Ups"
          count={metrics.vendors.total}
          onClick={() => navigate("/vendors")}
        />
      </div>

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