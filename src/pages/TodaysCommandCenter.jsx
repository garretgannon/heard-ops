import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ClipboardList, AlertTriangle, Thermometer, BookOpen, Wrench, DollarSign, AlertCircle, FileText, Truck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MetricCard = ({ icon: Icon, title, completed, total, urgent, color, onClick }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasUrgent = urgent > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card border-2 rounded-xl p-6 text-left hover:bg-secondary/20 transition-all group",
        hasUrgent ? "border-red-500/40" : "border-border"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-lg", color)}>
          <Icon className="h-5 w-5" />
        </div>
        {hasUrgent && <span className="px-2 py-1 bg-red-500/20 text-red-600 text-xs font-bold rounded">Urgent {urgent}</span>}
      </div>

      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {completed} of {total} complete
      </p>

      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary">{percentage}%</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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

        const maintenanceUrgent = maintenance.filter(m => m.priority === "urgent" || m.priority === "high").length;

        const incidentsUrgent = incidents.filter(i => i.severity === "critical" || i.severity === "high").length;

        const vendorFollowUps = vendors.length > 0 ? Math.ceil(vendors.length / 3) : 0;

        const preShiftCompleted = preShiftNotes.length;

        const latestHandoff = shiftHandoffs.length > 0 ? shiftHandoffs[0] : null;

        const cashIssues = cashDrawers.filter(d => Math.abs(d.variance || 0) > 0).length;

        setMetrics({
          prep: { completed: prepCompleted, total: todayPrepItems.length, urgent: prepUrgent },
          sideWork: { completed: sideWorkCompleted, total: sideWork.length, urgent: sideWorkUrgent },
          tempLogs: { completed: tempLogs.length, total: Math.max(tempLogs.length || 1, 1), urgent: tempLogsUrgent },
          maintenance: { completed: 0, total: maintenance.length, urgent: maintenanceUrgent },
          incidents: { completed: 0, total: incidents.length, urgent: incidentsUrgent },
          vendors: { completed: 0, total: vendorFollowUps, urgent: 0 },
          preShift: { completed: preShiftCompleted, total: 1, urgent: 0 },
          cash: { completed: cashDrawers.length - cashIssues, total: cashDrawers.length || 1, urgent: cashIssues },
          latestHandoff,
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
            icon={AlertCircle}
            title="Shift Handoff"
            completed={metrics.latestHandoff ? 1 : 0}
            total={1}
            urgent={metrics.latestHandoff?.tags?.includes("Urgent") ? 1 : 0}
            color="bg-indigo-500/20"
            onClick={() => navigate("/shift-handoff")}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              onClick={() => navigate("/prep-lists")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Start Prep List</p>
                <p className="text-xs text-muted-foreground">Create or manage todays prep</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/shift-handoff")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Log Handoff</p>
                <p className="text-xs text-muted-foreground">Document shift issues and notes</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/manager")}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">Manager Dashboard</p>
                <p className="text-xs text-muted-foreground">View detailed team performance</p>
              </div>
            </Button>
          </div>
        </div>

        {metrics.latestHandoff && (
          <div className="bg-card border-2 border-border rounded-xl p-6">
            <h2 className="font-bold mb-4">Latest Shift Summary</h2>
            <div className="space-y-2 text-sm">
              {metrics.latestHandoff.items_86d && (
                <p><span className="font-semibold">86d Items:</span> {metrics.latestHandoff.items_86d.substring(0, 50)}...</p>
              )}
              {metrics.latestHandoff.staff_issues && (
                <p><span className="font-semibold">Staff Issues:</span> {metrics.latestHandoff.staff_issues.substring(0, 50)}...</p>
              )}
              {metrics.latestHandoff.maintenance_problems && (
                <p><span className="font-semibold">Maintenance:</span> {metrics.latestHandoff.maintenance_problems.substring(0, 50)}...</p>
              )}
              <Button
                onClick={() => navigate("/shift-handoff")}
                variant="ghost"
                size="sm"
                className="mt-3"
              >
                View Full Handoff
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}