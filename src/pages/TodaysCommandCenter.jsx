import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ClipboardList, AlertTriangle, Thermometer, BookOpen, Wrench, DollarSign, AlertCircle, FileText, Truck, ArrowRight, Camera, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MetricCard = ({ icon: Icon, title, completed, total, urgent, color, onClick }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasUrgent = urgent > 0;
  const statusColor = hasUrgent ? "border-red-500/40 bg-red-500/5" : percentage === 100 ? "border-green-500/40 bg-green-500/5" : percentage > 50 ? "border-yellow-500/40 bg-yellow-500/5" : "border-border";

  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card border-2 rounded-xl p-5 text-left hover:shadow-md transition-all group",
        statusColor
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg", color)}>
          <Icon className="h-5 w-5" />
        </div>
        {hasUrgent && <span className="px-2 py-1 bg-red-500/20 text-red-600 text-xs font-bold rounded-md">Urgent {urgent}</span>}
      </div>

      <h3 className="font-bold text-sm mb-0.5">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3">
        {completed} of {total} complete
      </p>

      <div className="mb-3">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-primary">{percentage}%</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
};

const UrgentAlert = ({ icon: Icon, title, message, color, onClick }) => (
  <button
    onClick={onClick}
    className="bg-card border-2 border-red-500/40 rounded-lg p-4 hover:bg-red-500/5 transition-colors text-left group"
  >
    <div className="flex items-start gap-3">
      <div className={cn("p-2.5 rounded-lg mt-0.5", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm mb-0.5">{title}</h4>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-red-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);

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
          preShiftNotes,
          shiftHandoffs,
          cashDrawers,
        ] = await Promise.all([
          base44.entities.PrepList.filter({ date: todayStr }),
          base44.entities.PrepItem.list("-created_date", 300),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }),
          base44.entities.TempLogEntry.filter({ date: todayStr }),
          base44.entities.MaintenanceRequest.filter({ status: "open" }),
          base44.entities.IncidentReport.filter({ status: "open" }),
          base44.entities.Vendor.list(),
          base44.entities.PreShift.filter({ date: todayStr }),
          base44.entities.ShiftHandoff.filter({ date: todayStr }),
          base44.entities.DrawerCount.filter({ date: todayStr }),
        ]);

        const todayPrepItems = prepItems.filter(item => prepLists.some(pl => pl.id === item.prep_list_id));
        const prepCompleted = todayPrepItems.filter(i => i.status === "completed").length;
        const prepUrgent = todayPrepItems.filter(i => i.priority === "high" && i.status !== "completed").length;

        const sideWorkCompleted = sideWork.filter(t => t.status === "completed" || t.status === "approved").length;
        const sideWorkUrgent = sideWork.filter(t => t.priority === "high" && t.status === "pending").length;

        const tempLogsUrgent = tempLogs.filter(tl => tl.is_above_range || tl.is_below_range).length;
        const photoPending = prepItems.filter(pi => pi.status === "completed" && pi.photo_url && !pi.photo_approved).length;

        const maintenanceUrgent = maintenance.filter(m => m.priority === "urgent" || m.priority === "high").length;
        const incidentsUrgent = incidents.filter(i => i.severity === "critical" || i.severity === "high").length;

        const vendorFollowUps = vendors.length > 0 ? Math.ceil(vendors.length / 3) : 0;
        const preShiftCompleted = preShiftNotes.length;
        const latestHandoff = shiftHandoffs.length > 0 ? shiftHandoffs[0] : null;
        const cashIssues = cashDrawers.filter(d => Math.abs(d.variance || 0) > 0).length;

        const urgentAlerts = [
          ...(maintenanceUrgent > 0 ? [{ type: "maintenance", count: maintenanceUrgent }] : []),
          ...(incidentsUrgent > 0 ? [{ type: "incidents", count: incidentsUrgent }] : []),
          ...(prepUrgent > 0 ? [{ type: "prep", count: prepUrgent }] : []),
          ...(sideWorkUrgent > 0 ? [{ type: "sidework", count: sideWorkUrgent }] : []),
          ...(tempLogsUrgent > 0 ? [{ type: "templogs", count: tempLogsUrgent }] : []),
          ...(cashIssues > 0 ? [{ type: "cash", count: cashIssues }] : []),
        ].slice(0, 3);

        setMetrics({
          prep: { completed: prepCompleted, total: todayPrepItems.length, urgent: prepUrgent },
          sideWork: { completed: sideWorkCompleted, total: sideWork.length, urgent: sideWorkUrgent },
          tempLogs: { completed: tempLogs.length, total: Math.max(tempLogs.length || 1, 1), urgent: tempLogsUrgent },
          maintenance: { completed: 0, total: maintenance.length, urgent: maintenanceUrgent },
          incidents: { completed: 0, total: incidents.length, urgent: incidentsUrgent },
          vendors: { completed: 0, total: vendorFollowUps, urgent: 0 },
          preShift: { completed: preShiftCompleted, total: 1, urgent: 0 },
          cash: { completed: cashDrawers.length - cashIssues, total: cashDrawers.length || 1, urgent: cashIssues },
          photoReview: { pending: photoPending },
          latestHandoff,
          urgentAlerts,
          maintenanceRequests: maintenance.slice(0, 3),
          incidentsList: incidents.slice(0, 3),
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Today's Command Center</h1>
          <p className="text-lg text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Urgent Alerts */}
        {metrics.urgentAlerts && metrics.urgentAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-600">Urgent Today</h2>
            <div className="grid grid-cols-1 gap-3">
              {metrics.urgentAlerts.map((alert, i) => {
                if (alert.type === "maintenance") return (
                  <UrgentAlert
                    key={i}
                    icon={Wrench}
                    title={`${alert.count} Urgent Maintenance Request${alert.count > 1 ? 's' : ''}`}
                    message="Equipment or facilities need immediate attention"
                    color="bg-yellow-500/20"
                    onClick={() => navigate("/maintenance")}
                  />
                );
                if (alert.type === "incidents") return (
                  <UrgentAlert
                    key={i}
                    icon={AlertTriangle}
                    title={`${alert.count} High-Severity Incident${alert.count > 1 ? 's' : ''}`}
                    message="Injuries, safety issues, or critical events reported"
                    color="bg-red-500/20"
                    onClick={() => navigate("/incidents")}
                  />
                );
                if (alert.type === "prep") return (
                  <UrgentAlert
                    key={i}
                    icon={ClipboardList}
                    title={`${alert.count} High-Priority Prep Item${alert.count > 1 ? 's' : ''}`}
                    message="Critical prep tasks not yet started"
                    color="bg-blue-500/20"
                    onClick={() => navigate("/prep-lists")}
                  />
                );
                if (alert.type === "sidework") return (
                  <UrgentAlert
                    key={i}
                    icon={BookOpen}
                    title={`${alert.count} Overdue Side Work Task${alert.count > 1 ? 's' : ''}`}
                    message="Front of house assignments pending"
                    color="bg-orange-500/20"
                    onClick={() => navigate("/side-work")}
                  />
                );
                if (alert.type === "templogs") return (
                  <UrgentAlert
                    key={i}
                    icon={Thermometer}
                    title={`${alert.count} Temperature Alert${alert.count > 1 ? 's' : ''}`}
                    message="Readings outside safe range"
                    color="bg-cyan-500/20"
                    onClick={() => navigate("/temp-logs")}
                  />
                );
                if (alert.type === "cash") return (
                  <UrgentAlert
                    key={i}
                    icon={DollarSign}
                    title={`${alert.count} Cash Drawer Variance${alert.count > 1 ? 's' : ''}`}
                    message="Discrepancies found in drawer counts"
                    color="bg-green-500/20"
                    onClick={() => navigate("/cash")}
                  />
                );
                return null;
              })}
            </div>
          </div>
        )}

        {/* Pending Review */}
        {metrics.photoReview?.pending > 0 && (
          <div className="bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-sm">Photos Pending Review</h3>
                  <p className="text-xs text-muted-foreground">{metrics.photoReview.pending} prep photo{metrics.photoReview.pending > 1 ? 's' : ''} awaiting approval</p>
                </div>
              </div>
              <Button onClick={() => navigate("/photo-review")} size="sm" variant="ghost" className="text-yellow-600">Review</Button>
            </div>
          </div>
        )}

        {/* Core Metrics Grid */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Operational Status</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <MetricCard
            icon={ClipboardList}
            title="Prep Status"
            completed={metrics.prep.completed}
            total={metrics.prep.total}
            urgent={metrics.prep.urgent}
            color="bg-blue-500/20"
            onClick={() => navigate("/prep-lists")}
          />
          <MetricCard
            icon={BookOpen}
            title="Side Work"
            completed={metrics.sideWork.completed}
            total={metrics.sideWork.total}
            urgent={metrics.sideWork.urgent}
            color="bg-orange-500/20"
            onClick={() => navigate("/side-work")}
          />
          <MetricCard
            icon={Thermometer}
            title="Temperature Logs"
            completed={metrics.tempLogs.completed}
            total={metrics.tempLogs.total}
            urgent={metrics.tempLogs.urgent}
            color="bg-cyan-500/20"
            onClick={() => navigate("/temp-logs")}
          />
          <MetricCard
            icon={Wrench}
            title="Maintenance Requests"
            completed={metrics.maintenance.completed}
            total={metrics.maintenance.total}
            urgent={metrics.maintenance.urgent}
            color="bg-yellow-500/20"
            onClick={() => navigate("/maintenance")}
          />
          <MetricCard
            icon={AlertTriangle}
            title="Incident Reports"
            completed={metrics.incidents.completed}
            total={metrics.incidents.total}
            urgent={metrics.incidents.urgent}
            color="bg-red-500/20"
            onClick={() => navigate("/incidents")}
          />
          <MetricCard
            icon={DollarSign}
            title="Cash Drawer"
            completed={metrics.cash.completed}
            total={metrics.cash.total}
            urgent={metrics.cash.urgent}
            color="bg-green-500/20"
            onClick={() => navigate("/cash")}
          />
          <MetricCard
            icon={Truck}
            title="Vendor Follow-Ups"
            completed={0}
            total={metrics.vendors.total}
            urgent={0}
            color="bg-purple-500/20"
            onClick={() => navigate("/vendors")}
          />
          <MetricCard
            icon={FileText}
            title="Pre-Shift Notes"
            completed={metrics.preShift.completed}
            total={1}
            urgent={0}
            color="bg-pink-500/20"
            onClick={() => navigate("/pre-shift")}
          />
          <MetricCard
            icon={Camera}
            title="Photo Review"
            completed={metrics.prep.total - (metrics.photoReview?.pending || 0)}
            total={metrics.prep.total || 1}
            urgent={metrics.photoReview?.pending || 0}
            color="bg-purple-500/20"
            onClick={() => navigate("/photo-review")}
          />
        </div>

        {/* Detail Cards */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Maintenance Requests */}
          {metrics.maintenanceRequests && metrics.maintenanceRequests.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-yellow-600" />
                  Open Maintenance
                </h3>
                <span className="text-sm font-bold text-yellow-600">{metrics.maintenanceRequests.length}</span>
              </div>
              <div className="space-y-2">
                {metrics.maintenanceRequests.map(m => (
                  <div key={m.id} className={cn(
                    "p-3 rounded-lg border text-sm",
                    m.priority === "urgent" || m.priority === "high" ? "bg-red-500/10 border-red-500/30" : "bg-muted/30 border-border"
                  )}>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.location}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate("/maintenance")} variant="ghost" size="sm" className="w-full mt-4">View All</Button>
            </div>
          )}

          {/* Incidents */}
          {metrics.incidentsList && metrics.incidentsList.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Incident Reports
                </h3>
                <span className="text-sm font-bold text-red-600">{metrics.incidentsList.length}</span>
              </div>
              <div className="space-y-2">
                {metrics.incidentsList.map(inc => (
                  <div key={inc.id} className={cn(
                    "p-3 rounded-lg border text-sm",
                    inc.severity === "critical" || inc.severity === "high" ? "bg-red-500/10 border-red-500/30" : "bg-muted/30 border-border"
                  )}>
                    <p className="font-medium">{inc.type}</p>
                    <p className="text-xs text-muted-foreground mt-1">{inc.location}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate("/incidents")} variant="ghost" size="sm" className="w-full mt-4">View All</Button>
            </div>
          )}
        </div>

        {/* Latest Shift Handoff */}
        {metrics.latestHandoff && (
          <div className="bg-card border-2 border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Latest Shift Summary
              </h2>
              <Button onClick={() => navigate("/shift-handoff")} variant="ghost" size="sm">View All</Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {metrics.latestHandoff.items_86d && (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">86'd Items</p>
                  <p className="text-sm font-medium">{metrics.latestHandoff.items_86d.substring(0, 60)}...</p>
                </div>
              )}
              {metrics.latestHandoff.staff_issues && (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Staff Issues</p>
                  <p className="text-sm font-medium">{metrics.latestHandoff.staff_issues.substring(0, 60)}...</p>
                </div>
              )}
              {metrics.latestHandoff.maintenance_problems && (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Maintenance Problems</p>
                  <p className="text-sm font-medium">{metrics.latestHandoff.maintenance_problems.substring(0, 60)}...</p>
                </div>
              )}
              {metrics.latestHandoff.notes_for_next_manager && (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Manager Notes</p>
                  <p className="text-sm font-medium">{metrics.latestHandoff.notes_for_next_manager.substring(0, 60)}...</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              onClick={() => navigate("/prep-lists")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Add Task / Start Prep</p>
                <p className="text-xs text-muted-foreground">Create or manage today's prep</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/pre-shift")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Start Pre-Shift</p>
                <p className="text-xs text-muted-foreground">Brief team for the shift</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/photo-review")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Review Photos</p>
                <p className="text-xs text-muted-foreground">Approve completed tasks</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/maintenance")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Log Maintenance Issue</p>
                <p className="text-xs text-muted-foreground">Report equipment or facility problems</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/shift-handoff")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Create Handoff</p>
                <p className="text-xs text-muted-foreground">Document shift and pass to next manager</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/side-work")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Assign Side Work</p>
                <p className="text-xs text-muted-foreground">Task assignments for FOH staff</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}