import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import { isToday } from "date-fns";
import {
  Plus, Search, X, RefreshCw, LayoutList, Grid3x3,
  CalendarDays, AlertCircle, BarChart2, Filter,
} from "lucide-react";
import { LOG_TYPE_CONFIG, STATUS_META, TYPE_FILTER_LIST } from "@/components/logcenter/logConfig";
import FeedView from "@/components/activity-logs/FeedView";
import CategoryView from "@/components/activity-logs/CategoryView";
import CalendarView from "@/components/activity-logs/CalendarView";
import ReviewView from "@/components/activity-logs/ReviewView";
import AnalyticsView from "@/components/activity-logs/AnalyticsView";
import FilterPanel from "@/components/activity-logs/FilterPanel";
import LogCreateModal from "@/components/logcenter/LogCreateModal";

// ── Map raw entity records to unified log shape ───────────────────
function getStatus(raw, type) {
  if (type === "temperature") return (raw.is_above_range || raw.is_below_range) ? "flagged" : "completed";
  if (type === "waste") return raw.estimatedCost > 50 ? "flagged" : "completed";
  if (type === "eighty_six") return raw.is_active ? "open" : "completed";
  if (type === "issue") return raw.status || "open";
  if (type === "manager") return raw.status || "needs_review";
  return raw.status || "not_started";
}

function mapLog(raw, type) {
  const ts = raw.logged_at || raw.marked_at || raw.created_date || raw.updated_date;
  let title, subtitle, person, location;

  if (type === "temperature") { title = raw.location_name || "Temp Log"; subtitle = raw.temperature != null ? `${raw.temperature}°F` : ""; person = raw.logged_by; location = raw.location_name; }
  else if (type === "waste") { title = raw.itemName || "Waste Entry"; subtitle = `${raw.quantity ?? ""} ${raw.unit ?? ""}${raw.estimatedCost ? ` · $${Number(raw.estimatedCost).toFixed(2)}` : ""}`; person = raw.wastedBy; location = "Kitchen"; }
  else if (type === "eighty_six") { title = raw.item_name || "86 Item"; subtitle = `${raw.quantity ?? ""} ${raw.unit ?? ""}`; person = raw.marked_by; }
  else if (type === "cleaning") { title = raw.title || "Cleaning Task"; subtitle = raw.location || raw.department || ""; person = raw.assigned_to; location = raw.location; }
  else if (type === "prep") { title = raw.title || raw.itemName || "Prep Task"; subtitle = raw.station || ""; person = raw.assigned_to; location = raw.station; }
  else if (type === "side_work") { title = raw.title || raw.task_name || "Side Work"; subtitle = raw.station || raw.role || ""; person = raw.assigned_to; location = raw.station; }
  else if (type === "issue") { title = raw.title || "Issue"; subtitle = raw.location || raw.department || ""; person = raw.created_by_email; location = raw.location; }
  else if (type === "manager") { title = raw.title || "Manager Note"; subtitle = raw.department || ""; person = raw.logged_by_name; }
  else { title = raw.title || type; subtitle = ""; person = ""; }

  return {
    id: raw.id,
    type,
    title,
    subtitle: subtitle || "",
    person: person || "",
    location: location || "",
    ts,
    status: getStatus(raw, type),
    priority: raw.priority || (raw.is_above_range ? "critical" : "normal"),
    department: raw.department || (["temperature","cleaning","prep"].includes(type) ? "BOH" : type === "manager" ? "Management" : ""),
    notes: raw.notes || raw.description || "",
  };
}

// ── Views config ──────────────────────────────────────────────────
const VIEWS = [
  { id: "feed",      label: "Feed",     icon: LayoutList },
  { id: "category",  label: "Category", icon: Grid3x3 },
  { id: "calendar",  label: "Calendar", icon: CalendarDays },
  { id: "review",    label: "Review",   icon: AlertCircle },
  { id: "analytics", label: "Summary",  icon: BarChart2 },
];

const DEPT_OPTIONS = ["all", "BOH", "FOH", "Bar", "Management"];
const STATUS_FILTER_OPTIONS = [
  { id: "all", label: "All Status" },
  { id: "flagged", label: "Flagged" },
  { id: "overdue", label: "Overdue" },
  { id: "needs_review", label: "Review" },
  { id: "open", label: "Open" },
  { id: "completed", label: "Done" },
];

export default function Logs() {
  const navigate = useNavigate();
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("feed");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [showCreate, setShowCreate] = useState(false);

  const fetchAll = async () => {
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

    const collected = [
      ...tempLogs.map(l => mapLog(l, "temperature")),
      ...wasteLogs.map(l => mapLog(l, "waste")),
      ...eightySixItems.map(l => mapLog(l, "eighty_six")),
      ...cleaningTasks.map(l => mapLog(l, "cleaning")),
      ...prepTasks.map(l => mapLog(l, "prep")),
      ...sideWorkTasks.map(l => mapLog(l, "side_work")),
      ...issues.map(l => mapLog(l, "issue")),
      ...managerLogs.map(l => mapLog(l, "manager")),
    ].sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));

    setAllLogs(collected);
  };

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    haptics.light?.();
    await fetchAll();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allLogs.filter(log => {
      if (typeFilter !== "all" && log.type !== typeFilter) return false;
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (deptFilter !== "all" && log.department !== deptFilter) return false;
      if (q && !log.title.toLowerCase().includes(q) && !(log.subtitle).toLowerCase().includes(q) && !(log.notes).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allLogs, typeFilter, statusFilter, deptFilter, search]);

  const todayStats = useMemo(() => {
    const today = allLogs.filter(l => { try { return l.ts && isToday(new Date(l.ts)); } catch { return false; } });
    return {
      total: today.length,
      flagged: today.filter(l => l.status === "flagged" || l.status === "overdue").length,
      review: allLogs.filter(l => l.status === "needs_review").length,
      done: today.filter(l => l.status === "completed" || l.status === "approved").length,
    };
  }, [allLogs]);

  const hasFilters = typeFilter !== "all" || statusFilter !== "all" || deptFilter !== "all" || search;
  const handleLogClick = (log) => { haptics.light?.(); navigate(LOG_TYPE_CONFIG[log.type]?.routePath || "/logs"); };

  return (
    <div className="pb-28" style={{ maxHeight: 'calc(100vh - 52px)', overscrollBehavior: 'contain' }}>
      {/* ── Header ── */}
      <div className="bg-card/95 border-b border-border/40 px-4 pt-3 pb-2 sticky top-0 z-20 backdrop-blur space-y-2.5">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-foreground leading-tight">Logs Center</h1>
            <p className="text-[10px] text-muted-foreground">Restaurant operations record</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={refresh} className={cn("h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all", refreshing && "opacity-50 pointer-events-none")}>
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </button>
            <button onClick={() => { haptics.medium?.(); setShowCreate(true); }}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 active:scale-95 transition-all">
              <Plus className="h-3.5 w-3.5" />New
            </button>
          </div>
        </div>

        {/* Stats pills */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Today",   value: todayStats.total,   cls: "" },
            { label: "Flagged", value: todayStats.flagged, cls: todayStats.flagged > 0 ? "text-red-400" : "" },
            { label: "Review",  value: todayStats.review,  cls: todayStats.review > 0 ? "text-purple-400" : "" },
            { label: "Done",    value: todayStats.done,    cls: "text-green-400" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-card border border-border/50 rounded-xl px-2 py-1.5 text-center">
              <p className={cn("text-base font-extrabold leading-none", cls)}>{value}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* View tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {VIEWS.map(v => {
            const Icon = v.icon;
            return (
              <button key={v.id} onClick={() => { haptics.light?.(); setView(v.id); }}
                className={cn("flex-shrink-0 h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all",
                  view === v.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-muted")}>
                <Icon className="h-3 w-3" />{v.label}
                {v.id === "review" && todayStats.review + todayStats.flagged > 0 && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {todayStats.review + todayStats.flagged}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + filter (only for feed/category) */}
        {(view === "feed" || view === "category") && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-7 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none" />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
              </div>
              <button onClick={() => setShowFilters(f => !f)}
                className={cn("h-8 w-8 rounded-lg border flex items-center justify-center transition-all active:scale-90",
                  (hasFilters || showFilters) ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
                <Filter className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Type chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {TYPE_FILTER_LIST.map(f => {
                const cfg = LOG_TYPE_CONFIG[f.id];
                const Icon = cfg?.icon;
                return (
                  <button key={f.id} onClick={() => { haptics.light?.(); setTypeFilter(f.id); }}
                    className={cn("flex-shrink-0 h-6 px-2 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all flex items-center gap-1",
                      typeFilter === f.id
                        ? (cfg ? `${cfg.bg} ${cfg.text} border-transparent` : "bg-primary/15 text-primary border-primary/30")
                        : "bg-card border-border text-muted-foreground hover:bg-muted")}>
                    {Icon && <Icon className="h-2.5 w-2.5" />}{f.label}
                  </button>
                );
              })}
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="flex gap-2">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="flex-1 h-7 px-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none">
                  {STATUS_FILTER_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                  className="flex-1 h-7 px-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none">
                  {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d === "all" ? "All Depts" : d}</option>)}
                </select>
                {hasFilters && (
                  <button onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setDeptFilter("all"); setSearch(""); }}
                    className="h-7 px-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-1">
                    <X className="h-3 w-3" />Clear
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-3">
        {view === "feed" && <FeedView logs={filtered} onLogClick={handleLogClick} loading={loading} />}
        {view === "category" && <CategoryView logs={filtered} onLogClick={handleLogClick} loading={loading} />}
        {view === "calendar" && <CalendarView logs={allLogs} onLogClick={handleLogClick} />}
        {view === "review" && <ReviewView logs={allLogs} onLogClick={handleLogClick} loading={loading} />}
        {view === "analytics" && <AnalyticsView logs={allLogs} />}
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