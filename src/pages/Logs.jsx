import { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  Plus, Search, X, AlertTriangle, Thermometer, ClipboardList,
  Utensils, FileText, Wrench, Flame, Wind, ChevronRight,
  CalendarDays, ListFilter, LayoutGrid, Clock, CheckCircle2,
  AlertCircle, Flag, RefreshCw,
} from "lucide-react";
import LogCreateModal from "@/components/LogCreateModal";

// ── Log type config ──────────────────────────────────────────────
const LOG_TYPES = {
  manager:     { label: "Manager Note",   icon: FileText,     color: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-l-blue-500",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  issue:       { label: "Issue",          icon: AlertTriangle,color: "text-red-400",    bg: "bg-red-500/15",    border: "border-l-red-500",    badge: "bg-red-500/20 text-red-300 border-red-500/30" },
  waste:       { label: "Waste",          icon: Flame,        color: "text-amber-400",  bg: "bg-amber-500/15",  border: "border-l-amber-500",  badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  eighty_six:  { label: "86'd",           icon: Utensils,     color: "text-orange-400", bg: "bg-orange-500/15", border: "border-l-orange-500", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  temperature: { label: "Temp Log",       icon: Thermometer,  color: "text-cyan-400",   bg: "bg-cyan-500/15",   border: "border-l-cyan-500",   badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  cleaning:    { label: "Cleaning",       icon: Wind,         color: "text-green-400",  bg: "bg-green-500/15",  border: "border-l-green-500",  badge: "bg-green-500/20 text-green-300 border-green-500/30" },
  prep:        { label: "Prep",           icon: ClipboardList,color: "text-violet-400", bg: "bg-violet-500/15", border: "border-l-violet-500", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  side_work:   { label: "Side Work",      icon: ListFilter,   color: "text-pink-400",   bg: "bg-pink-500/15",   border: "border-l-pink-500",   badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  maintenance: { label: "Maintenance",    icon: Wrench,       color: "text-purple-400", bg: "bg-purple-500/15", border: "border-l-purple-500", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

const STATUS_META = {
  completed:    { label: "Done",         color: "text-green-400",  bg: "bg-green-500/15  border-green-500/30" },
  approved:     { label: "Approved",     color: "text-green-400",  bg: "bg-green-500/15  border-green-500/30" },
  flagged:      { label: "Flagged",      color: "text-red-400",    bg: "bg-red-500/15    border-red-500/30" },
  overdue:      { label: "Overdue",      color: "text-red-400",    bg: "bg-red-500/15    border-red-500/30" },
  needs_review: { label: "Review",       color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30" },
  open:         { label: "Open",         color: "text-amber-400",  bg: "bg-amber-500/15  border-amber-500/30" },
  in_progress:  { label: "In Progress",  color: "text-blue-400",   bg: "bg-blue-500/15   border-blue-500/30" },
  not_started:  { label: "Pending",      color: "text-muted-foreground", bg: "bg-muted border-border" },
};

const PRIORITY_COLORS = {
  critical: "text-red-400",
  high:     "text-orange-400",
  medium:   "text-amber-400",
  low:      "text-muted-foreground",
};

const TYPE_FILTERS = [
  { id: "all",         label: "All" },
  { id: "manager",     label: "Manager" },
  { id: "issue",       label: "Issues" },
  { id: "waste",       label: "Waste" },
  { id: "eighty_six",  label: "86'd" },
  { id: "temperature", label: "Temps" },
  { id: "cleaning",    label: "Cleaning" },
  { id: "prep",        label: "Prep" },
  { id: "side_work",   label: "Side Work" },
];

const STATUS_FILTERS = [
  { id: "all",         label: "All Status" },
  { id: "flagged",     label: "Flagged" },
  { id: "overdue",     label: "Overdue" },
  { id: "needs_review",label: "Needs Review" },
  { id: "open",        label: "Open" },
  { id: "completed",   label: "Completed" },
];

// ── Mapping helpers ──────────────────────────────────────────────
function getStatus(log, type) {
  if (type === "temperature") return (log.is_above_range || log.is_below_range) ? "flagged" : "completed";
  if (type === "waste") return log.estimatedCost > 50 ? "flagged" : "completed";
  if (type === "eighty_six") return log.is_active ? "open" : "completed";
  if (type === "issue") return log.status || "open";
  if (type === "manager") return log.status || "needs_review";
  return log.status || "not_started";
}

function mapLog(raw, type) {
  const ts = raw.logged_at || raw.marked_at || raw.created_date || raw.updated_date;
  let title, subtitle, meta, routePath;

  if (type === "temperature") { title = raw.location_name || "Temperature"; subtitle = `${raw.temperature ?? "—"}°F`; meta = raw.logged_by; routePath = "/temp-logs"; }
  else if (type === "waste") { title = raw.itemName || "Waste Entry"; subtitle = `${raw.quantity ?? ""} ${raw.unit ?? ""} · $${(raw.estimatedCost||0).toFixed(2)}`; meta = raw.wastedBy; routePath = "/waste-86"; }
  else if (type === "eighty_six") { title = raw.item_name || "86 Item"; subtitle = `${raw.quantity ?? ""} ${raw.unit ?? ""}`; meta = raw.marked_by; routePath = "/waste-86"; }
  else if (type === "cleaning") { title = raw.title || "Cleaning Task"; subtitle = raw.location || raw.department || ""; meta = raw.assigned_to; routePath = "/cleaning"; }
  else if (type === "prep") { title = raw.title || raw.itemName || "Prep Task"; subtitle = raw.station || ""; meta = raw.assigned_to; routePath = "/prep-lists"; }
  else if (type === "side_work") { title = raw.title || raw.task_name || "Side Work"; subtitle = raw.station || raw.role || ""; meta = raw.assigned_to; routePath = "/side-work"; }
  else if (type === "issue") { title = raw.title || "Issue"; subtitle = raw.location || raw.department || ""; meta = raw.created_by_email; routePath = "/issues"; }
  else if (type === "manager") { title = raw.title || "Manager Note"; subtitle = raw.department || ""; meta = raw.logged_by_name; routePath = "/logs"; }
  else { title = raw.title || type; subtitle = ""; meta = ""; routePath = "/logs"; }

  return {
    id: raw.id,
    type,
    title,
    subtitle,
    meta,
    ts,
    status: getStatus(raw, type),
    priority: raw.priority || (raw.is_above_range ? "critical" : "normal"),
    department: raw.department || (["temperature","cleaning","prep"].includes(type) ? "BOH" : type === "manager" ? "Management" : "FOH"),
    routePath,
    notes: raw.notes || raw.description || "",
  };
}

// ── Date grouping ────────────────────────────────────────────────
function groupByDate(logs) {
  const groups = {};
  logs.forEach(log => {
    const d = log.ts ? new Date(log.ts) : new Date();
    const key = d.toISOString().split("T")[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}

function dateLabel(dateStr) {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, MMM d");
  } catch { return dateStr; }
}

// ── Sub-components ───────────────────────────────────────────────
function LogCard({ log, onClick }) {
  const cfg = LOG_TYPES[log.type] || LOG_TYPES.manager;
  const Icon = cfg.icon;
  const statusMeta = STATUS_META[log.status] || STATUS_META.not_started;
  const priorityColor = PRIORITY_COLORS[log.priority] || "";
  const timeStr = log.ts ? format(new Date(log.ts), "h:mm a") : "";

  return (
    <button
      onClick={() => onClick(log)}
      className={cn(
        "w-full text-left bg-card border border-border/60 border-l-4 rounded-xl px-3 py-3 flex items-start gap-3 active:scale-[0.98] transition-all hover:border-border",
        cfg.border
      )}
    >
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
        <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-foreground truncate leading-tight">{log.title}</p>
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", statusMeta.bg)}>{statusMeta.label}</span>
        </div>
        {log.subtitle && <p className="text-[11px] text-muted-foreground truncate">{log.subtitle}</p>}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", cfg.badge)}>{cfg.label}</span>
          {log.department && <span className="text-[10px] text-muted-foreground">{log.department}</span>}
          {log.meta && <span className="text-[10px] text-muted-foreground truncate">· {log.meta}</span>}
          {timeStr && <span className="text-[10px] text-muted-foreground ml-auto">{timeStr}</span>}
        </div>
      </div>
    </button>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className={cn("flex flex-col items-center px-3 py-2 rounded-xl border bg-card", color)}>
      <p className="text-lg font-extrabold leading-none">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Logs() {
  const navigate = useNavigate();
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("feed"); // "feed" | "calendar"
  const [showCreate, setShowCreate] = useState(false);
  const scrollRef = useRef(null);

  const fetchAll = async () => {
    const [tempLogs, wasteLogs, eightySixItems, cleaningTasks, prepTasks, sideWorkTasks, issues, managerLogs] = await Promise.all([
      base44.entities.TemperatureLog.list("-logged_at", 80).catch(() => []),
      base44.entities.WasteEntry.list("-created_date", 80).catch(() => []),
      base44.entities.EightySixItem.list("-marked_at", 80).catch(() => []),
      base44.entities.DailyCleaningTask.list("-created_date", 80).catch(() => []),
      base44.entities.DailyPrepTask.list("-created_date", 80).catch(() => []),
      base44.entities.DailySideWorkTask.list("-created_date", 80).catch(() => []),
      base44.entities.Issue.list("-created_date", 80).catch(() => []),
      base44.entities.ManagerLog.list("-created_date", 80).catch(() => []),
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

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allLogs.filter(log => {
      if (typeFilter !== "all" && log.type !== typeFilter) return false;
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (deptFilter !== "all" && log.department !== deptFilter) return false;
      if (q && !log.title.toLowerCase().includes(q) && !(log.subtitle||"").toLowerCase().includes(q) && !(log.notes||"").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allLogs, typeFilter, statusFilter, deptFilter, search]);

  // Stats (today only)
  const stats = useMemo(() => {
    const todayLogs = allLogs.filter(l => l.ts && isToday(new Date(l.ts)));
    return {
      total: todayLogs.length,
      flagged: todayLogs.filter(l => l.status === "flagged" || l.status === "overdue").length,
      review: todayLogs.filter(l => l.status === "needs_review").length,
      done: todayLogs.filter(l => l.status === "completed" || l.status === "approved").length,
    };
  }, [allLogs]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleClick = (log) => {
    haptics.light?.();
    navigate(log.routePath);
  };

  const hasActiveFilters = typeFilter !== "all" || statusFilter !== "all" || deptFilter !== "all" || search;

  return (
    <div ref={scrollRef} className="pb-28 lg:overflow-auto" style={{ maxHeight: 'calc(100vh - 52px)', overscrollBehavior: 'contain' }}>
      {/* ── Header ── */}
      <div className="bg-card/90 border-b border-border/40 px-4 pt-4 pb-3 sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-foreground leading-tight">Logs Center</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Restaurant operations record</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className={cn("h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all", refreshing && "opacity-50 pointer-events-none")}>
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </button>
            <button onClick={() => setView(v => v === "feed" ? "calendar" : "feed")} className={cn("h-8 w-8 rounded-lg border bg-card flex items-center justify-center transition-all active:scale-90", view === "calendar" ? "border-primary/40 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground")}>
              <CalendarDays className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { haptics.medium?.(); setShowCreate(true); }}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 active:scale-95">
              <Plus className="h-3.5 w-3.5" /> New Log
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <StatPill label="Today" value={stats.total} color="border-border/50" />
          <StatPill label="Flagged" value={stats.flagged} color={stats.flagged > 0 ? "border-red-500/30 text-red-400" : "border-border/50"} />
          <StatPill label="Review" value={stats.review} color={stats.review > 0 ? "border-purple-500/30 text-purple-400" : "border-border/50"} />
          <StatPill label="Done" value={stats.done} color="border-green-500/30 text-green-400" />
        </div>

        {/* Search */}
        <div className="relative mb-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-8 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
        </div>

        {/* Type filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TYPE_FILTERS.map(f => {
            const cfg = LOG_TYPES[f.id];
            const Icon = cfg?.icon;
            return (
              <button key={f.id} onClick={() => { haptics.light?.(); setTypeFilter(f.id); }}
                className={cn("flex-shrink-0 h-7 px-2.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all flex items-center gap-1",
                  typeFilter === f.id ? (cfg ? `${cfg.bg} ${cfg.color} border-transparent` : "bg-primary/15 text-primary border-primary/30") : "bg-card border-border text-muted-foreground hover:bg-muted")}>
                {Icon && <Icon className="h-3 w-3" />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Status + dept filter row */}
        <div className="flex gap-2 mt-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="flex-1 h-7 px-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none">
            {STATUS_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="flex-1 h-7 px-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none">
            <option value="all">All Departments</option>
            <option value="BOH">BOH</option>
            <option value="FOH">FOH</option>
            <option value="Bar">Bar</option>
            <option value="Management">Management</option>
          </select>
          {hasActiveFilters && (
            <button onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setDeptFilter("all"); setSearch(""); }} className="h-7 px-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No logs found</p>
            {hasActiveFilters && <p className="text-xs mt-1">Try adjusting your filters</p>}
          </div>
        ) : view === "calendar" ? (
          /* Calendar / grouped view */
          <div className="space-y-5">
            {grouped.map(({ date, items }) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border/40">
                    {dateLabel(date)} · {items.length}
                  </span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="space-y-2">
                  {items.map(log => <LogCard key={`${log.type}-${log.id}`} log={log} onClick={handleClick} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Feed view — flat list */
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {filtered.map(log => <LogCard key={`${log.type}-${log.id}`} log={log} onClick={handleClick} />)}
          </div>
        )}
      </div>

      {/* Floating create button */}
      <button onClick={() => { haptics.medium?.(); setShowCreate(true); }}
        className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-90 transition-all lg:hidden">
        <Plus className="h-6 w-6" />
      </button>

      {showCreate && (
        <LogCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { refresh(); }}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;