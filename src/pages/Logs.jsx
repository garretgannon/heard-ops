import { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileText, Plus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isBefore, addHours } from "date-fns";
import { haptics } from "@/utils/haptics";
import LogsHeader from "@/components/LogsHeader";
import ActiveLogsSummary from "@/components/ActiveLogsSummary";
import ActiveLogCard from "@/components/ActiveLogCard";

const CACHE_TTL = 30_000;

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "foh", label: "FOH" },
  { id: "boh", label: "BOH" },
  { id: "management", label: "Management" },
  { id: "needs_review", label: "Needs Review" },
  { id: "flagged", label: "Flagged" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
];

function getLogStatus(log, logType) {
  if (logType === "temperature") {
    return log.is_above_range || log.is_below_range ? "overdue" : "completed";
  }
  if (logType === "waste") {
    return log.estimatedCost > 50 ? "flagged" : "completed";
  }
  if (logType === "cleaning") {
    return log.status || "not_started";
  }
  if (logType === "prep") {
    return log.status || "not_started";
  }
  if (logType === "side_work") {
    return log.status || "not_started";
  }
  if (logType === "issue") {
    return log.status === "critical" || log.priority === "critical" ? "flagged" : log.status || "not_started";
  }
  if (logType === "manager") {
    return log.status || "needs_review";
  }
  return "not_started";
}

function mapLogToCard(log, logType) {
  const baseCard = {
    id: log.id,
    sourceType: logType,
    lastUpdated: log.logged_at || log.created_date || log.marked_at || log.updated_date,
    priority: log.priority || (log.is_above_range ? "critical" : "normal"),
  };

  switch (logType) {
    case "temperature":
      return {
        ...baseCard,
        type: `Temp Log - ${log.location_name}`,
        department: "BOH",
        location: log.location_name || "Cooler",
        person: log.logged_by,
        role: "Staff",
        status: getLogStatus(log, logType),
        dueTime: log.max_temp ? `${log.temperature}°F (${log.min_temp}-${log.max_temp}°F)` : null,
        routeId: log.id,
        routePath: `/temp-logs`,
      };
    case "waste":
      return {
        ...baseCard,
        type: `Waste Log - ${log.itemName}`,
        department: "BOH",
        location: "Kitchen",
        person: log.wastedBy,
        role: "Staff",
        status: getLogStatus(log, logType),
        dueTime: `$${(log.estimatedCost || 0).toFixed(2)}`,
        routeId: log.id,
        routePath: `/waste-86`,
      };
    case "eighty_six":
      return {
        ...baseCard,
        type: `86'd - ${log.item_name}`,
        department: log.department || "FOH",
        location: log.location || "Line",
        person: log.marked_by,
        role: "Staff",
        status: log.is_active ? "flagged" : "completed",
        dueTime: `${log.quantity} ${log.unit}`,
        routeId: log.id,
        routePath: `/waste-86`,
      };
    case "cleaning":
      return {
        ...baseCard,
        type: `Cleaning - ${log.title}`,
        department: log.department || "BOH",
        location: log.location || "Kitchen",
        person: log.assigned_to,
        role: "Staff",
        status: log.status || "not_started",
        dueTime: log.due_time,
        routeId: log.id,
        routePath: `/cleaning`,
      };
    case "prep":
      return {
        ...baseCard,
        type: `Prep - ${log.title}`,
        department: "BOH",
        location: log.station || "Prep",
        person: log.assigned_to,
        role: "Prep Cook",
        status: log.status || "not_started",
        dueTime: log.due_time,
        routeId: log.id,
        routePath: `/prep-lists`,
      };
    case "side_work":
      return {
        ...baseCard,
        type: `Side Work - ${log.title}`,
        department: log.department || "FOH",
        location: log.station || "Floor",
        person: log.assigned_to,
        role: "Staff",
        status: log.status || "not_started",
        dueTime: log.due_time,
        routeId: log.id,
        routePath: `/side-work`,
      };
    case "issue":
      return {
        ...baseCard,
        type: `Issue - ${log.title}`,
        department: log.department || "Management",
        location: log.location || "Operations",
        person: log.created_by_email,
        role: "Manager",
        status: log.status || "not_started",
        dueTime: log.priority?.toUpperCase(),
        routeId: log.id,
        routePath: `/issues`,
      };
    case "manager":
      return {
        ...baseCard,
        type: `Manager Note - ${log.title}`,
        department: "Management",
        location: "Command",
        person: log.logged_by_name,
        role: "Manager",
        status: log.status || "needs_review",
        dueTime: log.priority?.toUpperCase(),
        routeId: log.id,
        routePath: `/logs`,
      };
    default:
      return null;
  }
}

export default function Logs() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [pullRefresh, setPullRefresh] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const collected = [];
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        // Fetch all log types in parallel
        const [tempLogs, wasteLogs, eightySixItems, cleaningTasks, prepTasks, sideWorkTasks, issues, managerLogs] = await Promise.all([
          base44.entities.TemperatureLog.list("-logged_at", 50).catch(() => []),
          base44.entities.WasteEntry.list("-created_date", 50).catch(() => []),
          base44.entities.EightySixItem.list("-marked_at", 50).catch(() => []),
          base44.entities.DailyCleaningTask.list("-created_date", 50).catch(() => []),
          base44.entities.DailyPrepTask.list("-created_date", 50).catch(() => []),
          base44.entities.DailySideWorkTask.list("-created_date", 50).catch(() => []),
          base44.entities.Issue.list("-created_date", 50).catch(() => []),
          base44.entities.ManagerLog.list("-created_date", 50).catch(() => []),
        ]);

        // Map and collect all logs
        tempLogs.forEach(log => {
          const card = mapLogToCard(log, "temperature");
          if (card) collected.push(card);
        });
        wasteLogs.forEach(log => {
          const card = mapLogToCard(log, "waste");
          if (card) collected.push(card);
        });
        eightySixItems.forEach(log => {
          const card = mapLogToCard(log, "eighty_six");
          if (card) collected.push(card);
        });
        cleaningTasks.forEach(log => {
          const card = mapLogToCard(log, "cleaning");
          if (card) collected.push(card);
        });
        prepTasks.forEach(log => {
          const card = mapLogToCard(log, "prep");
          if (card) collected.push(card);
        });
        sideWorkTasks.forEach(log => {
          const card = mapLogToCard(log, "side_work");
          if (card) collected.push(card);
        });
        issues.forEach(log => {
          const card = mapLogToCard(log, "issue");
          if (card) collected.push(card);
        });
        managerLogs.forEach(log => {
          const card = mapLogToCard(log, "manager");
          if (card) collected.push(card);
        });

        // Sort by priority and last updated
        const sorted = collected.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, normal: 2 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        });

        setAllLogs(sorted);
        setLastUpdated(Date.now());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  // Filter logs based on active filter
  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return allLogs.filter(log => {
      if (activeFilter === "all") return true;
      if (activeFilter === "today") {
        const logDate = new Date(log.lastUpdated);
        return logDate >= todayStart;
      }
      if (activeFilter === "foh") return log.department === "FOH";
      if (activeFilter === "boh") return log.department === "BOH";
      if (activeFilter === "management") return log.department === "Management";
      if (activeFilter === "needs_review") return log.status === "needs_review";
      if (activeFilter === "flagged") return log.status === "flagged";
      if (activeFilter === "overdue") return log.status === "overdue";
      if (activeFilter === "completed") return log.status === "completed";
      return true;
    });
  }, [allLogs, activeFilter]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayLogs = allLogs.filter(log => new Date(log.lastUpdated) >= todayStart);

    return {
      totalActive: todayLogs.filter(log => log.status !== "completed").length,
      overdue: todayLogs.filter(log => log.status === "overdue").length,
      needsReview: todayLogs.filter(log => log.status === "needs_review").length,
      completed: todayLogs.filter(log => log.status === "completed").length,
    };
  }, [allLogs]);

  const handleLogAction = (log) => {
    navigate(log.routePath, { state: { activeLogId: log.id } });
  };

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    if (scrollTop <= 0) {
      setPullRefresh(Math.min(100, Math.abs(scrollTop) * 0.5));
    }
  };
  const handleTouchEnd = () => {
    if (pullRefresh > 50) {
      haptics.medium?.();
      const load = async () => {
        const collected = [];
        const now = new Date();
        const [tempLogs, wasteLogs, eightySixItems, cleaningTasks, prepTasks, sideWorkTasks, issues, managerLogs] = await Promise.all([
          base44.entities.TemperatureLog.list("-logged_at", 50).catch(() => []),
          base44.entities.WasteEntry.list("-created_date", 50).catch(() => []),
          base44.entities.EightySixItem.list("-marked_at", 50).catch(() => []),
          base44.entities.DailyCleaningTask.list("-created_date", 50).catch(() => []),
          base44.entities.DailyPrepTask.list("-created_date", 50).catch(() => []),
          base44.entities.DailySideWorkTask.list("-created_date", 50).catch(() => []),
          base44.entities.Issue.list("-created_date", 50).catch(() => []),
          base44.entities.ManagerLog.list("-created_date", 50).catch(() => []),
        ]);
        tempLogs.forEach(log => { const card = mapLogToCard(log, "temperature"); if (card) collected.push(card); });
        wasteLogs.forEach(log => { const card = mapLogToCard(log, "waste"); if (card) collected.push(card); });
        eightySixItems.forEach(log => { const card = mapLogToCard(log, "eighty_six"); if (card) collected.push(card); });
        cleaningTasks.forEach(log => { const card = mapLogToCard(log, "cleaning"); if (card) collected.push(card); });
        prepTasks.forEach(log => { const card = mapLogToCard(log, "prep"); if (card) collected.push(card); });
        sideWorkTasks.forEach(log => { const card = mapLogToCard(log, "side_work"); if (card) collected.push(card); });
        issues.forEach(log => { const card = mapLogToCard(log, "issue"); if (card) collected.push(card); });
        managerLogs.forEach(log => { const card = mapLogToCard(log, "manager"); if (card) collected.push(card); });
        const sorted = collected.sort((a, b) => { const priorityOrder = { critical: 0, high: 1, normal: 2 }; const aPriority = priorityOrder[a.priority] || 2; const bPriority = priorityOrder[b.priority] || 2; if (aPriority !== bPriority) return aPriority - bPriority; return new Date(b.lastUpdated) - new Date(a.lastUpdated); });
        setAllLogs(sorted);
        setLastUpdated(Date.now());
      };
      load();
    }
    setPullRefresh(0);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onTouchEnd={handleTouchEnd}
      className="pb-24 lg:overflow-auto"
      style={{ maxHeight: 'calc(100vh - 52px)', overscrollBehavior: 'contain' }}
    >
      {pullRefresh > 0 && (
        <div className="sticky top-0 z-30 flex items-center justify-center h-12 bg-primary/10">
          <div
            className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent transition-transform"
            style={{ transform: `rotate(${pullRefresh * 3.6}deg)` }}
          />
        </div>
      )}
      <LogsHeader onNotifications={() => navigate("/today")} />
      <ActiveLogsSummary stats={stats} />

      <div className="lg:flex lg:items-start">
        {/* Desktop filter sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-52 lg:shrink-0 border-r border-border/30 px-3 py-4 space-y-1 lg:sticky lg:top-0 min-h-[50vh]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">Filters</p>
          {FILTER_OPTIONS.map(filter => (
            <button
              key={filter.id}
              onClick={() => { haptics.light?.(); setActiveFilter(filter.id); }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all",
                activeFilter === filter.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex-1 px-4 py-3 space-y-3">
          {/* Mobile Filter Tabs */}
          <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2">
            {FILTER_OPTIONS.map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  haptics.light?.();
                  setActiveFilter(filter.id);
                }}
                className={cn(
                  "flex-shrink-0 h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5",
                  activeFilter === filter.id
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-card border-border text-secondary-text hover:bg-muted"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Active Logs Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {filtered.map(log => (
                <ActiveLogCard
                  key={`${log.sourceType}-${log.id}`}
                  log={log}
                  onAction={handleLogAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-secondary-text text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted" />
              <p>No active logs</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          haptics.medium?.();
          navigate("/today");
        }}
        className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-glow-lg transition-all active:scale-90"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

export const hideBase44Index = true;