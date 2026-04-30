import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ClipboardList, AlertTriangle, Thermometer, Wrench, DollarSign, BookOpen, TrendingUp, FileText } from "lucide-react";
import ShiftSnapshot from "../components/dashboard/ShiftSnapshot";
import CompletionCard from "../components/dashboard/CompletionCard";
import StatusSection from "../components/dashboard/StatusSection";
import QuickActionBar from "../components/dashboard/QuickActionBar";

export default function StaffTasks() {
  const { user, isAdmin } = useCurrentUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const [prepLists, prepItems, sideWork, tempLogs, maintenanceReqs, incidents, users] = await Promise.all([
          base44.entities.PrepList.filter({ date: todayStr }),
          base44.entities.PrepItem.list("-created_date", 200),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }),
          base44.entities.TempLogEntry.filter({ date: todayStr }),
          base44.entities.MaintenanceRequest.filter({ status: "open" }),
          base44.entities.IncidentReport.filter({ status: "open" }),
          base44.entities.User.list(),
        ]);

        // Filter items by role
        const filteredPrepItems = prepItems.filter(item => {
          if (!prepLists.some(pl => pl.id === item.prep_list_id)) return false;
          if (item.assigned_to_individual === user?.email) return true;
          if (item.role_assignment === user?.role && !item.assigned_to_individual) return true;
          if (item.allow_all_roles && !item.role_assignment && !item.assigned_to_individual) return true;
          return false;
        });

        const filteredSideWork = sideWork.filter(task => {
          if (task.assigned_to_individual && task.assigned_to_email === user?.email) return true;
          if (task.role_assignment === user?.role && !task.assigned_to_individual) return true;
          if (!task.role_assignment && !task.assigned_to_individual) return true;
          return false;
        });

        const prepCompleted = filteredPrepItems.filter(i => i.status === "completed").length;
        const sideWorkCompleted = filteredSideWork.filter(t => t.status === "completed" || t.status === "approved").length;
        const tempLogsDue = tempLogs.length;
        const openIncidents = incidents.filter(i => i.status === "open").length;

        setDashboardData({
          prepCompletion: { completed: prepCompleted, total: filteredPrepItems.length },
          sideWorkCompletion: { completed: sideWorkCompleted, total: filteredSideWork.length },
          tempLogsDue,
          openIncidents,
          maintenanceRequests: maintenanceReqs.filter(r => r.status === "open"),
          incidents: incidents.filter(i => i.status === "open"),
          staffCount: users.length,
          shiftsStarting: 0,
          alerts: openIncidents,
        });
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) load();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl lg:text-3xl font-bold tracking-tight">Operations Command Center</h1>
        <p className="text-muted-foreground mt-2 text-lg lg:text-base">
          The daily operating system for restaurants — prep, side work, logs, vendors, cash, maintenance, and manager follow-up in one place.
        </p>
      </div>

      {isAdmin ? (
        <>
          {/* Shift Snapshot */}
          <ShiftSnapshot
            data={{
              staffCount: dashboardData.staffCount,
              shiftsStarting: dashboardData.shiftsStarting,
              alertCount: dashboardData.alerts,
            }}
          />

          {/* Completion Metrics */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Task Completion</h2>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
              <CompletionCard
                title="Prep"
                completed={dashboardData.prepCompletion.completed}
                total={dashboardData.prepCompletion.total}
                icon={ClipboardList}
                color="text-blue-500"
              />
              <CompletionCard
                title="Side Work"
                completed={dashboardData.sideWorkCompletion.completed}
                total={dashboardData.sideWorkCompletion.total}
                icon={BookOpen}
                color="text-orange-500"
              />
              <CompletionCard
                title="Temp Logs"
                completed={dashboardData.tempLogsDue}
                total={Math.max(dashboardData.tempLogsDue, 1)}
                icon={Thermometer}
                color="text-cyan-500"
              />
              <CompletionCard
                title="Issues"
                completed={dashboardData.openIncidents}
                total={Math.max(dashboardData.openIncidents, 1)}
                icon={AlertTriangle}
                color="text-red-500"
              />
            </div>
          </div>

          {/* Status Sections Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <StatusSection
              title="Open Maintenance"
              items={dashboardData.maintenanceRequests}
              icon={Wrench}
              emptyMessage="No open maintenance requests"
            />
            <StatusSection
              title="Incident Reports"
              items={dashboardData.incidents}
              icon={AlertTriangle}
              emptyMessage="No open incidents"
            />
          </div>

          {/* Quick Actions */}
          <QuickActionBar isAdmin={true} />
        </>
      ) : (
        /* Non-admin view */
        <div className="space-y-6">
          <div className="bg-card rounded-xl border-2 border-border p-6 text-center">
            <h2 className="text-lg font-bold mb-2">Welcome to Heard Operations</h2>
            <p className="text-muted-foreground">Access your assigned tasks and workflows from the navigation menu.</p>
          </div>
          <QuickActionBar isAdmin={false} />
        </div>
      )}
    </div>
  );
}