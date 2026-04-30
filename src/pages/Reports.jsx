import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Download, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
];

function dateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(14);
  const [prepItems, setPrepItems] = useState([]);
  const [sideWork, setSideWork] = useState([]);
  const [tempLogs, setTempLogs] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const [pi, sw, tl, maint, inc, ph] = await Promise.all([
          base44.entities.PrepItem.list("-created_date", 2000),
          base44.entities.SideWorkAssignment.list("-created_date", 1000),
          base44.entities.TempLogEntry.list("-created_date", 500),
          base44.entities.MaintenanceRequest.list("-created_date", 500),
          base44.entities.IncidentReport.list("-created_date", 500),
          base44.entities.PrepItem.list("-created_date", 500),
        ]);
        setPrepItems(pi);
        setSideWork(sw);
        setTempLogs(tl);
        setMaintenance(maint);
        setIncidents(inc);
        setPhotos(ph.filter(p => p.photo_url));
        setLoading(false);
      } catch (err) {
        console.error("Load error:", err);
        setLoading(false);
      }
    };
    init();
  }, []);

  const cutoff = dateNDaysAgo(range);

  // Filter data by date range
  const filteredPrep = prepItems.filter(p => p.completed_at && p.completed_at.split("T")[0] >= cutoff);
  const filteredSideWork = sideWork.filter(s => s.completed_at && s.completed_at.split("T")[0] >= cutoff);
  const filteredTempLogs = tempLogs.filter(t => t.date >= cutoff);
  const filteredMaintenance = maintenance.filter(m => m.date >= cutoff);
  const filteredIncidents = incidents.filter(i => i.date >= cutoff);
  const filteredPhotos = photos.filter(p => p.completed_at && p.completed_at.split("T")[0] >= cutoff);

  // Calculate metrics
  const prepCompleted = filteredPrep.filter(p => p.status === "completed").length;
  const prepCompletionRate = filteredPrep.length > 0 ? Math.round((prepCompleted / filteredPrep.length) * 100) : 0;

  const sideworkCompleted = filteredSideWork.filter(s => s.status === "completed" || s.status === "approved").length;
  const sideworkCompletionRate = filteredSideWork.length > 0 ? Math.round((sideworkCompleted / filteredSideWork.length) * 100) : 0;

  const tempLogsWithStatus = filteredTempLogs.filter(t => t.status !== undefined);
  const tempLogsPassed = tempLogsWithStatus.filter(t => t.status === true).length;
  const tempLogPassRate = tempLogsWithStatus.length > 0 ? Math.round((tempLogsPassed / tempLogsWithStatus.length) * 100) : 0;

  const maintenanceCompleted = filteredMaintenance.filter(m => m.status === "resolved").length;
  const avgMaintenanceTime = filteredMaintenance.length > 0
    ? Math.round(filteredMaintenance.filter(m => m.follow_up_date).reduce((sum, m) => {
      const created = new Date(m.created_date);
      const resolved = new Date(m.follow_up_date || m.created_date);
      return sum + (resolved - created) / (1000 * 60 * 60 * 24);
    }, 0) / filteredMaintenance.length)
    : 0;

  const photoRejections = filteredPhotos.filter(p => p.completion_status === "rejected").length;
  const photoRejectionRate = filteredPhotos.length > 0 ? Math.round((photoRejections / filteredPhotos.length) * 100) : 0;

  // Late tasks
  const lateTasks = filteredSideWork.filter(s => s.completion_status === "late");
  const lateByEmployee = {};
  lateTasks.forEach(t => {
    const emp = t.assigned_to_email || "Unknown";
    lateByEmployee[emp] = (lateByEmployee[emp] || 0) + 1;
  });
  const topLateEmployees = Object.entries(lateByEmployee).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top issues
  const topIssues = [];
  if (tempLogsPassed < tempLogsWithStatus.length) {
    topIssues.push({ type: "Temp Log Failures", count: tempLogsWithStatus.length - tempLogsPassed, severity: "high" });
  }
  if (photoRejectionRate > 15) {
    topIssues.push({ type: "Photo Rejections", count: photoRejections, severity: "medium" });
  }
  if (filteredIncidents.length > 0) {
    topIssues.push({ type: "Incidents Reported", count: filteredIncidents.length, severity: "high" });
  }
  if (prepCompletionRate < 80) {
    topIssues.push({ type: "Incomplete Prep", count: filteredPrep.length - prepCompleted, severity: "medium" });
  }

  const handleExport = () => {
    const data = [
      ["Operational Dashboard Report"],
      [`Date Range: ${range} days`],
      [""],
      ["METRIC", "VALUE"],
      ["Prep Completion Rate", `${prepCompletionRate}%`],
      ["Side Work Completion Rate", `${sideworkCompletionRate}%`],
      ["Temp Log Pass Rate", `${tempLogPassRate}%`],
      ["Photo Rejection Rate", `${photoRejectionRate}%`],
      ["Avg Maintenance Response (days)", avgMaintenanceTime],
      ["Incidents", filteredIncidents.length],
    ];
    const csv = data.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Operational Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Manager insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.days}
                onClick={() => setRange(opt.days)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                  range === opt.days ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">PREP COMPLETION</p>
          <p className="text-3xl font-bold text-primary">{prepCompletionRate}%</p>
          <p className="text-xs text-muted-foreground">{prepCompleted} of {filteredPrep.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">SIDE WORK COMPLETION</p>
          <p className="text-3xl font-bold text-primary">{sideworkCompletionRate}%</p>
          <p className="text-xs text-muted-foreground">{sideworkCompleted} of {filteredSideWork.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">TEMP LOG PASS RATE</p>
          <p className={cn("text-3xl font-bold", tempLogPassRate < 95 ? "text-red-600" : "text-green-600")}>{tempLogPassRate}%</p>
          <p className="text-xs text-muted-foreground">{tempLogsPassed} of {tempLogsWithStatus.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">PHOTO REJECTION RATE</p>
          <p className={cn("text-3xl font-bold", photoRejectionRate > 15 ? "text-red-600" : "text-green-600")}>{photoRejectionRate}%</p>
          <p className="text-xs text-muted-foreground">{photoRejections} of {filteredPhotos.length}</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">AVG MAINTENANCE RESPONSE TIME</p>
          <p className="text-3xl font-bold text-primary">{avgMaintenanceTime}</p>
          <p className="text-xs text-muted-foreground">days from report to resolution</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">INCIDENTS</p>
          <p className={cn("text-3xl font-bold", filteredIncidents.length > 0 ? "text-red-600" : "text-green-600")}>{filteredIncidents.length}</p>
          <p className="text-xs text-muted-foreground">reports filed</p>
        </div>
      </div>

      {/* Top Issues */}
      {topIssues.length > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-bold text-red-600">Top Issues This Week</h3>
          </div>
          <div className="space-y-2">
            {topIssues.map((issue, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{issue.type}</span>
                <span className="font-bold text-red-600">{issue.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Late Tasks by Employee */}
      {topLateEmployees.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-bold mb-4">Late Tasks by Employee</h3>
          <div className="space-y-2">
            {topLateEmployees.map(([emp, count], i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-secondary/40 rounded-lg text-sm">
                <span className="text-muted-foreground">{emp}</span>
                <span className="font-bold text-orange-600">{count} late</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold">Detailed Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/30">
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-right px-4 py-3 font-medium">Rate</th>
                <th className="text-right px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3">Prep Items Completed</td>
                <td className="text-right px-4 py-3">{filteredPrep.length}</td>
                <td className="text-right px-4 py-3 font-bold text-primary">{prepCompletionRate}%</td>
                <td className="text-right px-4 py-3"><span className={cn("text-xs px-2 py-1 rounded-full font-semibold", prepCompletionRate >= 80 ? "bg-green-500/15 text-green-600" : "bg-orange-500/15 text-orange-600")}>{prepCompletionRate >= 80 ? "Good" : "Needs Work"}</span></td>
              </tr>
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3">Side Work Tasks</td>
                <td className="text-right px-4 py-3">{filteredSideWork.length}</td>
                <td className="text-right px-4 py-3 font-bold text-primary">{sideworkCompletionRate}%</td>
                <td className="text-right px-4 py-3"><span className={cn("text-xs px-2 py-1 rounded-full font-semibold", sideworkCompletionRate >= 80 ? "bg-green-500/15 text-green-600" : "bg-orange-500/15 text-orange-600")}>{sideworkCompletionRate >= 80 ? "Good" : "Needs Work"}</span></td>
              </tr>
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3">Temp Logs</td>
                <td className="text-right px-4 py-3">{tempLogsWithStatus.length}</td>
                <td className="text-right px-4 py-3 font-bold text-primary">{tempLogPassRate}%</td>
                <td className="text-right px-4 py-3"><span className={cn("text-xs px-2 py-1 rounded-full font-semibold", tempLogPassRate >= 95 ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600")}>{tempLogPassRate >= 95 ? "Compliant" : "Alert"}</span></td>
              </tr>
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3">Photos Submitted</td>
                <td className="text-right px-4 py-3">{filteredPhotos.length}</td>
                <td className="text-right px-4 py-3 font-bold text-primary">{100 - photoRejectionRate}%</td>
                <td className="text-right px-4 py-3"><span className={cn("text-xs px-2 py-1 rounded-full font-semibold", photoRejectionRate <= 15 ? "bg-green-500/15 text-green-600" : "bg-orange-500/15 text-orange-600")}>{photoRejectionRate <= 15 ? "Good" : "Review"}</span></td>
              </tr>
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3">Maintenance Requests</td>
                <td className="text-right px-4 py-3">{filteredMaintenance.length}</td>
                <td className="text-right px-4 py-3 font-bold text-primary">{maintenanceCompleted}/{filteredMaintenance.length}</td>
                <td className="text-right px-4 py-3"><span className={cn("text-xs px-2 py-1 rounded-full font-semibold", maintenanceCompleted === filteredMaintenance.length ? "bg-green-500/15 text-green-600" : "bg-orange-500/15 text-orange-600")}>Resolved</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;