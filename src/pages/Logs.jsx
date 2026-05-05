import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Thermometer, Droplet, AlertTriangle, FileText, Plus, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { haptics } from "@/utils/haptics";
import LogsHeader from "@/components/LogsHeader";
import { useToast } from "@/hooks/useToast";

const FILTER_TABS = [
  { id: "temps", label: "Temps", icon: Thermometer },
  { id: "waste", label: "Waste", icon: Droplet },
  { id: "86d", label: "86'd", icon: AlertTriangle },
  { id: "issues", label: "Issues", icon: AlertTriangle },
  { id: "manager", label: "Manager", icon: FileText },
  { id: "handoff", label: "Handoff", icon: FileText },
];

function LogCard({ icon: Icon, iconBg, title, value, unit, time, user: userName, status, statusColor }) {
  return (
    <button className="w-full text-left bg-card border border-border rounded-lg p-3 flex items-center gap-3 active:scale-95 transition-all duration-100">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className="h-4 w-4 stroke-[1.5] text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{title}</p>
        <div className="flex items-center gap-1.5 text-[9px] text-secondary-text mt-0.5">
          {time && (
            <>
              <Clock className="h-3 w-3 stroke-[1.5]" />
              <span>{time}</span>
            </>
          )}
          {time && userName && <span>·</span>}
          {userName && (
            <>
              <User className="h-3 w-3 stroke-[1.5]" />
              <span className="truncate">{userName}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {value !== undefined && (
          <p className="text-base font-bold text-foreground">
            {value}
            {unit && <span className="text-xs text-secondary-text ml-1">{unit}</span>}
          </p>
        )}
        {status && (
          <span className={cn("text-[9px] font-bold px-2 py-1 rounded-full border whitespace-nowrap", statusColor)}>
            {status}
          </span>
        )}
      </div>
    </button>
  );
}

function DateGroup({ date, children }) {
  let label = "";
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    if (isToday(parsedDate)) label = "Today";
    else if (isYesterday(parsedDate)) label = "Yesterday";
    else label = format(parsedDate, "MMM d");
  } catch {
    label = "Other";
  }
  return (
    <div className="mt-4 first:mt-0">
      <p className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-2">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function Logs() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("temps");
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const allLogs = [];

        // Temperature Logs
        if (activeTab === "temps" || activeTab === "all") {
          const tempLogs = await base44.entities.TemperatureLog.list("-logged_at", 50).catch(() => []);
          tempLogs.forEach(log => {
            const isOutOfRange = log.is_above_range || log.is_below_range;
            const status = isOutOfRange ? "danger" : log.value > (log.max_temp - 5) || log.value < (log.min_temp + 5) ? "warning" : "ok";
            const statusLabel = isOutOfRange ? "OUT OF RANGE" : status === "warning" ? "WARNING" : "IN RANGE";
            const statusColor = isOutOfRange
              ? "bg-red-500/15 text-red-400 border-red-500/30"
              : status === "warning"
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-green-500/15 text-green-400 border-green-500/30";

            // Auto-create issue for out-of-range temps
            if (isOutOfRange && !log.created_issue_id) {
              base44.entities.Issue.create({
                title: `Temperature Out of Range: ${log.location_name}`,
                description: `${log.temperature}°F (Range: ${log.min_temp}-${log.max_temp}°F)`,
                category: "safety",
                status: "open",
                priority: "critical",
                location_id: log.location_id,
                source: "log_out_of_range",
                created_from_log_id: log.id,
              }).catch(e => console.error("Failed to create issue", e));
            }

            allLogs.push({
              id: log.id,
              type: "temps",
              date: log.logged_at ? log.logged_at.split("T")[0] : todayStr,
              time: log.logged_at ? new Date(log.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.location_name || "Temperature Log",
              value: log.temperature,
              unit: "°F",
              user: log.logged_by,
              status: statusLabel,
              statusColor,
              icon: Thermometer,
              iconBg: "bg-blue-500/15",
            });
          });
        }

        // Waste Logs
        if (activeTab === "waste" || activeTab === "all") {
          const wasteLogs = await base44.entities.WasteEntry.list("-logged_at", 50).catch(() => []);
          wasteLogs.forEach(log => {
            allLogs.push({
              id: log.id,
              type: "waste",
              date: log.logged_at ? log.logged_at.split("T")[0] : todayStr,
              time: log.logged_at ? new Date(log.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.item_name || "Waste Entry",
              value: `$${log.dollar_value || 0}`,
              user: log.reported_by,
              status: log.dollar_value > 50 ? "HIGH VALUE" : "LOGGED",
              statusColor: log.dollar_value > 50 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30",
              icon: Droplet,
              iconBg: "bg-amber-500/15",
            });
          });
        }

        // 86'd Items
        if (activeTab === "86d" || activeTab === "all") {
          const eightySixItems = await base44.entities.EightySixItem.list("-marked_at", 50).catch(() => []);
          eightySixItems.forEach(log => {
            allLogs.push({
              id: log.id,
              type: "86d",
              date: log.marked_at ? log.marked_at.split("T")[0] : todayStr,
              time: log.marked_at ? new Date(log.marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.item_name || "86'd Item",
              value: log.quantity,
              unit: log.unit,
              user: log.marked_by,
              status: log.is_active ? "ACTIVE" : "RESOLVED",
              statusColor: log.is_active ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-green-500/15 text-green-400 border-green-500/30",
              icon: AlertTriangle,
              iconBg: "bg-red-500/15",
            });
          });
        }

        // Issues
        if (activeTab === "issues" || activeTab === "all") {
          const issues = await base44.entities.Issue.list("-created_date", 50).catch(() => []);
          issues.forEach(log => {
            allLogs.push({
              id: log.id,
              type: "issues",
              date: log.created_date ? log.created_date.split("T")[0] : todayStr,
              time: log.created_date ? new Date(log.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.title || "Issue",
              value: log.priority?.toUpperCase(),
              user: log.created_by_email,
              status: log.status?.toUpperCase() || "OPEN",
              statusColor: log.status === "critical" || log.priority === "critical"
                ? "bg-red-500/15 text-red-400 border-red-500/30"
                : log.status === "in_progress"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-green-500/15 text-green-400 border-green-500/30",
              icon: AlertTriangle,
              iconBg: "bg-yellow-500/15",
            });
          });
        }

        // Manager Logs
        if (activeTab === "manager" || activeTab === "all") {
          const managerLogs = await base44.entities.ManagerLog.list("-created_date", 50).catch(() => []);
          managerLogs.forEach(log => {
            allLogs.push({
              id: log.id,
              type: "manager",
              date: log.created_date ? log.created_date.split("T")[0] : todayStr,
              time: log.created_date ? new Date(log.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.title || "Manager Note",
              value: log.priority?.toUpperCase(),
              user: log.logged_by_name,
              status: log.status?.toUpperCase() || "OPEN",
              statusColor: log.priority === "critical"
                ? "bg-red-500/15 text-red-400 border-red-500/30"
                : log.priority === "high"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-slate-500/15 text-slate-400 border-slate-500/30",
              icon: FileText,
              iconBg: "bg-purple-500/15",
            });
          });
        }

        // Group by date
        const grouped = {};
        allLogs.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
          if (!grouped[log.date]) grouped[log.date] = [];
          grouped[log.date].push(log);
        });

        setLogs(grouped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab]);

  return (
    <div className="pb-24">
      <LogsHeader onNotifications={() => navigate("/today")} />

      <div className="px-4 py-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                haptics.light();
                setActiveTab(tab.id);
              }}
              className={cn(
                "flex-shrink-0 h-9 px-3 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5",
                activeTab === tab.id
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card border-border text-secondary-text hover:bg-muted"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Logs Grouped by Date */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : Object.keys(logs).length > 0 ? (
          <div>
            {Object.entries(logs).map(([date, dateLogs]) => (
              <DateGroup key={date} date={date}>
                {dateLogs.map(log => (
                  <LogCard
                    key={log.id}
                    icon={log.icon}
                    iconBg={log.iconBg}
                    title={log.title}
                    value={log.value}
                    unit={log.unit}
                    time={log.time}
                    user={log.user}
                    status={log.status}
                    statusColor={log.statusColor}
                  />
                ))}
              </DateGroup>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-secondary-text text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted" />
            <p>No logs yet</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          haptics.medium();
          navigate("/new-log");
        }}
        className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-glow-lg transition-all active:scale-90"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

export const hideBase44Index = true;