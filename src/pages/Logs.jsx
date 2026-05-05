import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Thermometer, Droplet, AlertTriangle, FileText, Plus, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import StandardPageShell from "@/components/StandardPageShell";

const TABS = [
  { id: "temps", label: "Temps", icon: Thermometer },
  { id: "waste", label: "Waste", icon: Droplet },
  { id: "86d", label: "86'd", icon: AlertTriangle },
  { id: "issues", label: "Issues", icon: AlertTriangle },
  { id: "manager", label: "Manager", icon: FileText },
];

function LogCard({ icon: Icon, iconBg, title, meta, time, user: userName, status, statusLabel }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className="h-4 w-4 stroke-[1.5] text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{title}</p>
        {meta && <p className="text-xs text-secondary-text mt-0.5 truncate">{meta}</p>}
        <div className="flex items-center gap-1.5 text-[9px] text-secondary-text mt-1">
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
      {status && (
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap",
            status === "ok" ? "bg-green-500/15 text-green-400 border-green-500/30" :
            status === "warning" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
            status === "critical" ? "bg-red-500/15 text-red-400 border-red-500/30" :
            "bg-muted text-secondary-text border-border"
          )}>
            {statusLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function GroupLabel({ date }) {
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
    <div className="mt-4 mb-2 first:mt-0">
      <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">{label}</p>
    </div>
  );
}

export default function Logs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("temps");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const allLogs = [];

        if (activeTab === "temps" || activeTab === "all") {
          const tempLogs = await base44.entities.TempLogEntry.list("-logged_at", 50).catch(() => []);
          tempLogs.forEach(log => {
            const status = log.is_above_range || log.is_below_range ? "critical" : log.value > (log.max_temp - 5) || log.value < (log.min_temp + 5) ? "warning" : "ok";
            allLogs.push({
              id: log.id,
              type: "temps",
              date: log.logged_at ? log.logged_at.split("T")[0] : todayStr,
              time: log.logged_at ? new Date(log.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.location_name || "Temperature Log",
              meta: `${log.temperature}°F`,
              user: log.logged_by,
              status,
              statusLabel: status === "critical" ? "OUT OF RANGE" : status === "warning" ? "WARNING" : "OK",
              icon: Thermometer,
              iconBg: "bg-blue-500/15",
            });
          });
        }

        if (activeTab === "waste" || activeTab === "all") {
          const wasteLogs = await base44.entities.WasteEntry.list("-logged_at", 50).catch(() => []);
          wasteLogs.forEach(log => {
            allLogs.push({
              id: log.id,
              type: "waste",
              date: log.logged_at ? log.logged_at.split("T")[0] : todayStr,
              time: log.logged_at ? new Date(log.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.item_name || "Waste Entry",
              meta: `${log.quantity} ${log.unit} · ${log.reason}`,
              user: log.reported_by,
              status: log.dollar_value > 50 ? "critical" : "warning",
              statusLabel: `$${log.dollar_value}`,
              icon: Droplet,
              iconBg: "bg-amber-500/15",
            });
          });
        }

        if (activeTab === "86d" || activeTab === "all") {
          const eightysixtabs = await base44.entities.EightySixItem.list("-marked_at", 50).catch(() => []);
          eightysixtabs.forEach(log => {
            allLogs.push({
              id: log.id,
              type: "86d",
              date: log.marked_at ? log.marked_at.split("T")[0] : todayStr,
              time: log.marked_at ? new Date(log.marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.item_name || "86'd Item",
              meta: `${log.category} · ${log.reason}`,
              user: log.marked_by,
              status: log.severity === "high" ? "critical" : "warning",
              statusLabel: log.is_active ? "ACTIVE" : "RESOLVED",
              icon: AlertTriangle,
              iconBg: "bg-red-500/15",
            });
          });
        }

        if (activeTab === "issues" || activeTab === "all") {
          const issues = await base44.entities.Issue.list("-created_date", 50).catch(() => []);
          issues.forEach(log => {
            allLogs.push({
              id: log.id,
              type: "issues",
              date: log.created_date ? log.created_date.split("T")[0] : todayStr,
              time: log.created_date ? new Date(log.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.title || "Issue",
              meta: log.category,
              user: log.logged_by,
              status: log.status === "critical" ? "critical" : log.status === "in_progress" ? "warning" : "ok",
              statusLabel: log.status?.toUpperCase() || "OPEN",
              icon: AlertTriangle,
              iconBg: "bg-yellow-500/15",
            });
          });
        }

        if (activeTab === "manager" || activeTab === "all") {
          const managerLogs = await base44.entities.ManagerLog.list("-created_date", 50).catch(() => []);
          managerLogs.forEach(log => {
            allLogs.push({
              id: log.id,
              type: "manager",
              date: log.created_date ? log.created_date.split("T")[0] : todayStr,
              time: log.created_date ? new Date(log.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              title: log.title || "Manager Note",
              meta: log.category,
              user: log.logged_by_name,
              status: log.priority === "critical" ? "critical" : log.priority === "high" ? "warning" : "ok",
              statusLabel: log.status?.toUpperCase() || "OPEN",
              icon: FileText,
              iconBg: "bg-purple-500/15",
            });
          });
        }

        // Sort by date descending, group
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
    <StandardPageShell title="Logs">
      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(logs).length > 0 ? (
        <div>
          {Object.entries(logs).map(([date, groupLogs]) => (
            <div key={date}>
              <GroupLabel date={date} />
              <div className="space-y-2">
                {groupLogs.map(log => (
                  <LogCard
                    key={log.id}
                    icon={log.icon}
                    iconBg={log.iconBg}
                    title={log.title}
                    meta={log.meta}
                    time={log.time}
                    user={log.user}
                    status={log.status}
                    statusLabel={log.statusLabel}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-secondary-text text-sm">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted" />
          No logs yet
        </div>
      )}

    </StandardPageShell>
  );
}

export const hideBase44Index = true;