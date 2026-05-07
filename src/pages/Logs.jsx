import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import { isToday } from "date-fns";
import {
  Plus, Search, X, RefreshCw,
  List, LayoutGrid, CalendarDays, Clock, BarChart3,
} from "lucide-react";
import { mapLog } from "@/components/activity-logs/logConfig.js";
import FeedView       from "@/components/activity-logs/FeedView";
import CategoryView   from "@/components/activity-logs/CategoryView";
import CalendarView   from "@/components/activity-logs/CalendarView";
import ReviewView     from "@/components/activity-logs/ReviewView";
import AnalyticsView  from "@/components/activity-logs/AnalyticsView";
import LogCreateModal from "@/components/LogCreateModal";

const VIEWS = [
  { id: "feed",      label: "Feed",     icon: List },
  { id: "category",  label: "Category", icon: LayoutGrid },
  { id: "calendar",  label: "Calendar", icon: CalendarDays },
  { id: "review",    label: "Review",   icon: Clock },
  { id: "analytics", label: "Summary",  icon: BarChart3 },
];

const DEPT_FILTERS = ["all", "BOH", "FOH", "Bar", "Management"];
const STATUS_FILTERS = [
  { id: "all",          label: "All Status" },
  { id: "flagged",      label: "Flagged" },
  { id: "overdue",      label: "Overdue" },
  { id: "needs_review", label: "Review" },
  { id: "open",         label: "Open" },
  { id: "completed",    label: "Done" },
];

async function fetchAllLogs() {
  const [tempLogs, wasteLogs, eightySixItems, cleaningTasks, prepTasks, sideWorkTasks, issues, managerLogs] = await Promise.all([
    base44.entities.TemperatureLog.list("-logged_at", 100).catch(() => []),
    base44.entities.WasteEntry.list("-created_date", 100).catch(() => []),
    base44.entities.EightySixItem.list("-marked_at", 100).catch(() => []),
    base44.entities.DailyCleaningTask.list("-created_date", 100).catch(() => []),
    base44.entities.DailyPrepTask.list("-created_date", 100).catch(() => []),
    base44.entities.DailySideWorkTask.list("-created_date", 100).catch(() => []),
    base44.entities.Issue.list("-created_date", 100).catch(() => []),
    base44.entities.ManagerLog.list("-created_date", 100).catch(() => []),
  ]);

  return [
    ...tempLogs.map(l => mapLog(l, "temperature")),
    ...wasteLogs.map(l => mapLog(l, "waste")),
    ...eightySixItems.map(l => mapLog(l, "eighty_six")),
    ...cleaningTasks.map(l => mapLog(l, "cleaning")),
    ...prepTasks.map(l => mapLog(l, "prep")),
    ...sideWorkTasks.map(l => mapLog(l, "side_work")),
    ...issues.map(l => mapLog(l, "issue")),
    ...managerLogs.map(l => mapLog(l, "manager")),
  ].sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
}

export default function Logs() {
  const navigate = useNavigate();
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState("feed");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setAllLogs(await fetchAllLogs()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    haptics.light?.();
    await load(true);
    setRefreshing(false);
  };

  // Filters only applied to Feed view (other views do their own thing with full allLogs)
  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return allLogs.filter(log => {
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (deptFilter !== "all" && log.department !== deptFilter) return false;
      if (q && !log.title.toLowerCase().includes(q) && !(log.subtitle || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allLogs, search, statusFilter, deptFilter]);

  // Stats for header strip
  const todayStats = useMemo(() => {
    const t = allLogs.filter(l => l.ts && isToday(new Date(l.ts)));
    return {
      total:   t.length,
      flagged: t.filter(l => l.status === "flagged" || l.priority === "critical").length,
      review:  t.filter(l => l.status === "needs_review").length,
      done:    t.filter(l => l.status === "completed" || l.status === "approved").length,
    };
  }, [allLogs]);

  const handleLogClick = (log) => {
    haptics.light?.();
    navigate(log.routePath);
  };

  const hasFilters = search || statusFilter !== "all" || deptFilter !== "all";
  const showFilters = activeView === "feed";

  return (
    <div className="pb-28 min-h-screen" style={{ overscrollBehavior: "contain" }}>
      {/* ── Sticky header ── */}
      <div className="bg-card/95 border-b border-border/40 px-4 pt-4 pb-3 sticky top-0 z-20 backdrop-blur space-y-3">

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-foreground leading-tight">Logs Center</h1>
            <p className="text-[10px] text-muted-foreground">Restaurant operations record</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh}
              className={cn("h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all", refreshing && "opacity-50 pointer-events-none")}>
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </button>
            <button onClick={() => { haptics.medium?.(); setShowCreate(true); }}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 active:scale-95">
              <Plus className="h-3.5 w-3.5" /> New Log
            </button>
          </div>
        </div>

        {/* Today stats strip */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Today",   value: todayStats.total,   cls: "border-border/50" },
            { label: "Flagged", value: todayStats.flagged,  cls: todayStats.flagged > 0 ? "border-red-500/40 text-red-400" : "border-border/50" },
            { label: "Review",  value: todayStats.review,   cls: todayStats.review > 0 ? "border-purple-500/40 text-purple-400" : "border-border/50" },
            { label: "Done",    value: todayStats.done,     cls: "border-green-500/40 text-green-400" },
          ].map(s => (
            <div key={s.label} className={cn("flex flex-col items-center px-2 py-2 rounded-xl border bg-card", s.cls)}>
              <p className="text-base font-extrabold leading-none">{s.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* View tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {VIEWS.map(v => {
            const Icon = v.icon;
            return (
              <button key={v.id} onClick={() => { haptics.light?.(); setActiveView(v.id); }}
                className={cn(
                  "flex-shrink-0 h-7 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1",
                  activeView === v.id
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}>
                <Icon className="h-3 w-3" />
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Feed-only filters */}
        {showFilters && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-8 pl-9 pr-8 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="flex-1 h-7 px-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none">
                {STATUS_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="flex-1 h-7 px-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none">
                {DEPT_FILTERS.map(d => <option key={d} value={d}>{d === "all" ? "All Depts" : d}</option>)}
              </select>
              {hasFilters && (
                <button onClick={() => { setSearch(""); setStatusFilter("all"); setDeptFilter("all"); }}
                  className="h-7 px-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeView === "feed"      && <FeedView      logs={filteredLogs} onLogClick={handleLogClick} />}
            {activeView === "category"  && <CategoryView  logs={allLogs}      onLogClick={handleLogClick} />}
            {activeView === "calendar"  && <CalendarView  logs={allLogs}      onLogClick={handleLogClick} />}
            {activeView === "review"    && <ReviewView    logs={allLogs}      onLogClick={handleLogClick} />}
            {activeView === "analytics" && <AnalyticsView logs={allLogs} />}
          </>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { haptics.medium?.(); setShowCreate(true); }}
        className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-90 transition-all lg:hidden">
        <Plus className="h-6 w-6" />
      </button>

      {showCreate && (
        <LogCreateModal onClose={() => setShowCreate(false)} onCreated={refresh} />
      )}
    </div>
  );
}

export const hideBase44Index = true;