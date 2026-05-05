import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  Bell, AlertTriangle, Thermometer, CheckSquare, Wrench,
  ClipboardList, ShieldAlert, Clock, ChevronRight, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const hideBase44Index = true;

// Build a unified alert list from multiple entities
function buildAlerts({ issues, tempLogs, maintenance, prepItems }) {
  const list = [];

  // Critical issues
  issues.filter(i => i.status === "critical" || i.status === "open").forEach(i => {
    list.push({
      id: `issue-${i.id}`,
      type: i.status === "critical" ? "critical" : "warning",
      icon: ShieldAlert,
      message: i.title,
      sub: `Issue · ${i.category}`,
      time: i.created_date,
      route: "/issues",
      actionLabel: "View",
      read: i.status === "resolved",
    });
  });

  // Temp log danger/warning readings
  tempLogs.filter(t => t.status === "danger" || t.status === "warning").forEach(t => {
    list.push({
      id: `temp-${t.id}`,
      type: t.status === "danger" ? "critical" : "warning",
      icon: Thermometer,
      message: `${t.location_name || "Unit"}: ${t.temperature}°F`,
      sub: `Temp · ${t.status === "danger" ? "Out of range" : "Warning"}`,
      time: t.logged_at || t.created_date,
      route: "/temp-logs",
      actionLabel: "Log",
      read: false,
    });
  });

  // Overdue prep items
  prepItems.filter(p => p.status === "overdue").forEach(p => {
    list.push({
      id: `prep-${p.id}`,
      type: "warning",
      icon: ClipboardList,
      message: `${p.name} — not completed`,
      sub: "Prep · Overdue",
      time: p.overdue_flagged_at || p.created_date,
      route: "/prep-lists",
      actionLabel: "Review",
      read: false,
    });
  });

  // Pending approval prep items
  prepItems.filter(p => p.status === "pending_review").forEach(p => {
    list.push({
      id: `approval-${p.id}`,
      type: "approval",
      icon: CheckSquare,
      message: `${p.name} — awaiting approval`,
      sub: "Prep · Needs sign-off",
      time: p.completed_at || p.created_date,
      route: "/photo-review",
      actionLabel: "Approve",
      read: false,
    });
  });

  // Urgent maintenance
  maintenance.filter(m => m.status !== "resolved" && m.status !== "completed").forEach(m => {
    list.push({
      id: `maint-${m.id}`,
      type: m.priority === "high" || m.priority === "urgent" ? "critical" : "info",
      icon: Wrench,
      message: m.title || m.description || "Maintenance request",
      sub: `Maintenance · ${m.status || "Open"}`,
      time: m.created_date,
      route: "/maintenance",
      actionLabel: "View",
      read: false,
    });
  });

  // Sort: critical first, then by time
  const typeOrder = { critical: 0, approval: 1, warning: 2, info: 3 };
  list.sort((a, b) => {
    if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
    return new Date(b.time || 0) - new Date(a.time || 0);
  });

  return list;
}

const TYPE_STYLE = {
  critical: { dot: "bg-red-500 animate-pulse", row: "border-l-2 border-red-500/40", iconCls: "text-red-400", iconBg: "bg-red-500/10" },
  approval: { dot: "bg-blue-400",              row: "border-l-2 border-blue-500/30",  iconCls: "text-blue-400",  iconBg: "bg-blue-500/10"  },
  warning:  { dot: "bg-amber-500",             row: "border-l-2 border-amber-500/30", iconCls: "text-amber-400", iconBg: "bg-amber-500/10" },
  info:     { dot: "bg-gray-500",              row: "",                               iconCls: "text-gray-500",  iconBg: "bg-[#1A2235]"    },
};

function KPITile({ label, value, color, alert }) {
  return (
    <div className={cn("flex-1 min-w-0 bg-[#111827] rounded-xl border p-2.5 flex flex-col items-center text-center", alert ? "border-red-500/30" : "border-[#1F2937]")}>      
      <p className={cn("text-[20px] font-extrabold leading-none", color)}>{value}</p>
      <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [tempLogs, setTempLogs] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Issue.filter({ status: "open" }),
      base44.entities.Issue.filter({ status: "critical" }),
      base44.entities.TempLogEntry.list("-logged_at", 100),
      base44.entities.MaintenanceRequest.list("-created_date", 50),
      base44.entities.PrepItem.list("-updated_date", 100),
    ]).then(([open, critical, temps, maint, prep]) => {
      setIssues([...open, ...critical]);
      setTempLogs(temps.filter(t => t.status === "danger" || t.status === "warning"));
      setMaintenance(maint);
      setPrepItems(prep);
      setLoading(false);
    });
  }, []);

  const alerts = useMemo(() => buildAlerts({ issues, tempLogs, maintenance, prepItems }), [issues, tempLogs, maintenance, prepItems]);

  const unread = alerts.filter(a => !a.read).length;
  const critical = alerts.filter(a => a.type === "critical").length;
  const approvals = alerts.filter(a => a.type === "approval").length;

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-3 pb-24">

      {/* Header */}
      <div className="pt-1 flex items-center gap-2">
        <Bell className="h-4 w-4 text-[#F5A623]" />
        <h1 className="text-[17px] font-extrabold text-white tracking-tight">Alerts</h1>
        {unread > 0 && (
          <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-[10px] font-extrabold text-white flex items-center justify-center">
            {unread}
          </span>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-1.5">
        <KPITile label="Unread"    value={unread}    color={unread > 0 ? "text-white" : "text-gray-600"}       alert={unread > 0} />
        <KPITile label="Critical"  value={critical}  color={critical > 0 ? "text-red-400" : "text-gray-600"}   alert={critical > 0} />
        <KPITile label="Approvals" value={approvals} color={approvals > 0 ? "text-blue-400" : "text-gray-600"} />
      </div>

      {/* Alert Feed */}
      {alerts.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400/30 mx-auto mb-2" />
          <p className="text-[13px] font-bold text-gray-500">All clear</p>
          <p className="text-[11px] text-gray-700 mt-0.5">No active alerts right now</p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden divide-y divide-[#1A2235]">
          {alerts.map(alert => {
            const s = TYPE_STYLE[alert.type];
            const Icon = alert.icon;
            const timeStr = alert.time
              ? formatDistanceToNow(new Date(alert.time), { addSuffix: true })
              : "";
            return (
              <div key={alert.id} className={cn("flex items-center gap-2.5 px-3 py-2.5", s.row)}>
                {/* Icon */}
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", s.iconBg)}>
                  <Icon className={cn("h-3.5 w-3.5", s.iconCls)} />
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white leading-tight truncate">{alert.message}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-600 truncate">{alert.sub}</span>
                    {timeStr && <><span className="text-gray-700 text-[9px]">·</span><span className="text-[10px] text-gray-700 shrink-0">{timeStr}</span></>}
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => navigate(alert.route)}
                  className={cn(
                    "h-6 px-2 rounded-lg text-[10px] font-bold border shrink-0 active:scale-95 transition-transform",
                    alert.type === "critical" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                    alert.type === "approval" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                    "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}
                >
                  {alert.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}