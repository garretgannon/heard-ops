import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import { isToday, isYesterday, isThisWeek, subDays, startOfMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Plus, Search, X, RefreshCw, List, LayoutGrid, CalendarDays, Clock, BarChart3, SlidersHorizontal } from "lucide-react";
import { mapLog } from "@/components/activity-logs/logConfig";
import FeedView      from "@/components/activity-logs/FeedView";
import CategoryView  from "@/components/logcenter/LogsCategoryView";
import CalendarView  from "@/components/logcenter/LogsCalendarView";
import ReviewView    from "@/components/logcenter/LogsReviewView";
import AnalyticsView from "@/components/logcenter/LogsAnalyticsView";
import FilterPanel, { EMPTY_FILTERS } from "@/components/activity-logs/FilterPanel";
import LogCreateModal from "@/components/logcenter/LogCreateModal";
import LogsDesktopLayout from "@/components/logcenter/LogsDesktopLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const VIEWS = [
  { id: "feed",      label: "Feed",     icon: List },
  { id: "category",  label: "Category", icon: LayoutGrid },
  { id: "calendar",  label: "Calendar", icon: CalendarDays },
  { id: "review",    label: "Review",   icon: Clock },
  { id: "analytics", label: "Summary",  icon: BarChart3 },
];

const CLOSED_STATUSES = new Set(["completed", "approved", "resolved", "closed"]);
const OPEN_STATUSES   = new Set(["open", "in_progress", "active", "not_started", "pending"]);

async function fetchAllLogs() {
  const [tempLogs, wasteLogs, eightySixItems, cleaningTasks, prepTasks, sideWorkTasks, issues, managerLogs] = await Promise.all([
    base44.entities.TemperatureLog.list("-logged_at",    100).catch(() => []),
    base44.entities.WasteEntry.list("-created_date",     100).catch(() => []),
    base44.entities.EightySixItem.list("-marked_at",     100).catch(() => []),
    base44.entities.DailyCleaningTask.list("-created_date", 100).catch(() => []),
    base44.entities.DailyPrepTask.list("-created_date",  100).catch(() => []),
    base44.entities.DailySideWorkTask.list("-created_date", 100).catch(() => []),
    base44.entities.Issue.list("-created_date",          100).catch(() => []),
    base44.entities.ManagerLog.list("-created_date",     100).catch(() => []),
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

function applyFilters(logs, search, filters, currentUserEmail) {
  const q = search.toLowerCase().trim();

  return logs.filter(log => {
    // ── Search ──
    if (q) {
      const haystack = [
        log.title, log.subtitle, log.notes,
        log.equipment, log.person, log.area, log.station,
        ...(log.tags || []),
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // ── Type ──
    if (filters.types?.length && !filters.types.includes(log.type)) return false;

    // ── Status ──
    if (filters.statuses?.length && !filters.statuses.includes(log.status)) return false;

    // ── Priority ──
    if (filters.priorities?.length && !filters.priorities.includes(log.priority)) return false;

    // ── Date ──
    const ts = log.ts ? new Date(log.ts) : null;
    if (ts) {
      if (filters.datePreset) {
        const now = new Date();
        if (filters.datePreset === "today"      && !isToday(ts))                return false;
        if (filters.datePreset === "yesterday"  && !isYesterday(ts))            return false;
        if (filters.datePreset === "this_week"  && !isThisWeek(ts, { weekStartsOn: 1 })) return false;
        if (filters.datePreset === "last_7"     && ts < subDays(now, 7))        return false;
        if (filters.datePreset === "this_month" && ts < startOfMonth(now))      return false;
      }
      if (filters.dateFrom) {
        try { if (ts < startOfDay(parseISO(filters.dateFrom))) return false; } catch {}
      }
      if (filters.dateTo) {
        try { if (ts > endOfDay(parseISO(filters.dateTo))) return false; } catch {}
      }
    }

    // ── Pass / Fail ──
    if (filters.passFail === "failed" && log.status !== "flagged" && log.status !== "failed") return false;
    if (filters.passFail === "passed" && !["completed", "approved", "passed"].includes(log.status)) return false;

    // ── Open / Closed ──
    if (filters.openClosed === "open"   && !OPEN_STATUSES.has(log.status))   return false;
    if (filters.openClosed === "closed" && !CLOSED_STATUSES.has(log.status)) return false;

    // ── Requires Review ──
    if (filters.requiresReview && !log.requiresReview) return false;

    // ── Has Photo ──
    if (filters.hasPhoto && !log.hasPhoto) return false;

    // ── Assigned to Me ──
    if (filters.assignedToMe && log.assignedTo !== currentUserEmail && log.person !== currentUserEmail) return false;

    // ── Tags ──
    if (filters.tags?.length) {
      const logTagIds = (log.tags || []).map(t => typeof t === 'string' ? t : t.id);
      const filterTagIds = filters.tags.map(t => t.id);
      const hasAllTags = filterTagIds.every(fId => logTagIds.includes(fId));
      if (!hasAllTags) return false;
    }

    // ── People text fields ──
    if (filters.createdBy  && !log.person?.toLowerCase().includes(filters.createdBy.toLowerCase()))    return false;
    if (filters.assignedTo && !log.assignedTo?.toLowerCase().includes(filters.assignedTo.toLowerCase())) return false;
    if (filters.employee   && !log.person?.toLowerCase().includes(filters.employee.toLowerCase()))     return false;
    if (filters.role       && !log.department?.toLowerCase().includes(filters.role.toLowerCase()))     return false;

    // ── Location ──
    if (filters.station   && log.station   !== filters.station)                                          return false;
    if (filters.area      && log.area      !== filters.area)                                             return false;
    if (filters.equipment && !log.equipment?.toLowerCase().includes(filters.equipment.toLowerCase()))   return false;

    return true;
  });
}

function countActiveFilters(filters) {
  let n = 0;
  if (filters.types?.length)      n++;
  if (filters.statuses?.length)   n++;
  if (filters.priorities?.length) n++;
  if (filters.datePreset || filters.dateFrom || filters.dateTo) n++;
  if (filters.createdBy)    n++;
  if (filters.assignedTo)   n++;
  if (filters.role)         n++;
  if (filters.station)      n++;
  if (filters.area)         n++;
  if (filters.equipment)    n++;
  if (filters.employee)     n++;
  if (filters.passFail)     n++;
  if (filters.openClosed)   n++;
  if (filters.requiresReview) n++;
  if (filters.hasPhoto)     n++;
  if (filters.assignedToMe) n++;
  return n;
}

export default function Logs() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [allLogs,    setAllLogs]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState("feed");
  const [search,     setSearch]     = useState("");
  const [filters,    setFilters]    = useState(EMPTY_FILTERS);
  const [showPanel,  setShowPanel]  = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isDesktop, setIsDesktop]   = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setAllLogs(await fetchAllLogs()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const filteredLogs = useMemo(
    () => applyFilters(allLogs, search, filters, user?.email),
    [allLogs, search, filters, user?.email]
  );

  const todayStats = useMemo(() => {
    const filteredByAll = applyFilters(allLogs, "", filters, user?.email);
    const t = filteredByAll.filter(l => l.ts && isToday(new Date(l.ts)));
    return {
      total:   allLogs.filter(l => l.ts && isToday(new Date(l.ts))).length,
      flagged: t.filter(l => l.status === "flagged" || l.priority === "critical").length,
      review:  t.filter(l => l.status === "needs_review").length,
      done:    t.filter(l => CLOSED_STATUSES.has(l.status)).length,
    };
  }, [allLogs, filters, user?.email])

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const hasActiveFilters  = activeFilterCount > 0 || !!search;

  const handleLogClick = (log) => navigate(log.routePath);
  const handleCreateLog = () => setShowCreate(true);

  // Which logs to pass to each view (Feed uses filtered, others use full set filtered by everything except search for context)
  const viewLogs = activeView === "feed" ? filteredLogs : applyFilters(allLogs, "", filters, user?.email);

  // Desktop layout
  if (isDesktop) {
    return (
      <>
        <LogsDesktopLayout
          logs={filteredLogs}
          loading={loading}
          onLogClick={handleLogClick}
          filters={filters}
          onFiltersChange={setFilters}
          search={search}
          onSearchChange={setSearch}
          onCreateLog={handleCreateLog}
          currentUser={user}
        />
        {showCreate && <LogCreateModal onClose={() => setShowCreate(false)} onCreated={refresh} />}
      </>
    );
  }

  // Mobile layout
  return (
    <div className="pb-28 min-h-screen">
      {/* ── Sticky header ── */}
      <div className="bg-card/95 border-b border-border/40 px-4 pt-4 pb-3 sticky top-0 z-20 backdrop-blur space-y-3">

        {/* Title + actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-foreground leading-tight">Logs Center</h1>
            <p className="text-[10px] text-muted-foreground">
              {hasActiveFilters ? `${filteredLogs.length} of ${allLogs.length} logs` : `${allLogs.length} total logs`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh}
              className={cn("h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all", refreshing && "opacity-50 pointer-events-none")}>
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 active:scale-95">
              <Plus className="h-3.5 w-3.5" /> New Log
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Today",   value: todayStats.total,   cls: "border-border/50 text-foreground" },
            { label: "Flagged", value: todayStats.flagged,  cls: todayStats.flagged > 0 ? "border-red-500/40 text-red-400" : "border-border/50 text-foreground" },
            { label: "Review",  value: todayStats.review,   cls: todayStats.review > 0 ? "border-purple-500/40 text-purple-400" : "border-border/50 text-foreground" },
            { label: "Done",    value: todayStats.done,     cls: "border-green-500/40 text-green-400" },
          ].map(s => (
            <div key={s.label} className={cn("flex flex-col items-center px-2 py-2 rounded-xl border bg-card", s.cls)}>
              <p className="text-base font-extrabold leading-none">{s.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* View tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {VIEWS.map(v => {
            const Icon = v.icon;
            return (
              <button key={v.id} onClick={() => setActiveView(v.id)}
                className={cn(
                  "flex-shrink-0 h-7 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1",
                  activeView === v.id ? "bg-primary/15 text-primary border-primary/30" : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}>
                <Icon className="h-3 w-3" />{v.label}
              </button>
            );
          })}
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs, equipment, notes, tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-8 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowPanel(true)}
            className={cn(
              "h-8 px-2.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all",
              activeFilterCount > 0
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-card border-border text-muted-foreground hover:bg-muted"
            )}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
              className="h-8 px-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filters.types?.map(t => (
              <span key={t} className="flex items-center gap-1 h-5 px-2 rounded-full bg-primary/15 text-primary text-[10px] font-bold border border-primary/30">
                {t}
                <button onClick={() => setFilters(f => ({ ...f, types: f.types.filter(x => x !== t) }))}><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
            {filters.statuses?.map(s => (
              <span key={s} className="flex items-center gap-1 h-5 px-2 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border border-border">
                {s}
                <button onClick={() => setFilters(f => ({ ...f, statuses: f.statuses.filter(x => x !== s) }))}><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
            {filters.datePreset && (
              <span className="flex items-center gap-1 h-5 px-2 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border border-border">
                {filters.datePreset}
                <button onClick={() => setFilters(f => ({ ...f, datePreset: "" }))}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {filters.station && (
              <span className="flex items-center gap-1 h-5 px-2 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border border-border">
                {filters.station}
                <button onClick={() => setFilters(f => ({ ...f, station: "" }))}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {filters.requiresReview && (
              <span className="flex items-center gap-1 h-5 px-2 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-bold border border-purple-500/30">
                Needs Review
                <button onClick={() => setFilters(f => ({ ...f, requiresReview: false }))}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
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
            {activeView === "category"  && <CategoryView  logs={viewLogs}     onLogClick={handleLogClick} />}
            {activeView === "calendar"  && <CalendarView  logs={viewLogs}     onLogClick={handleLogClick} />}
            {activeView === "review"    && <ReviewView    logs={viewLogs}     onLogClick={handleLogClick} />}
            {activeView === "analytics" && <AnalyticsView logs={viewLogs} />}
          </>
        )}
      </div>

      {/* FAB */}
      <button onClick={handleCreateLog}
        className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-90 transition-all lg:hidden">
        <Plus className="h-6 w-6" />
      </button>

      {/* Filter panel */}
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        currentUser={user}
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
      />

      {showCreate && <LogCreateModal onClose={() => setShowCreate(false)} onCreated={refresh} />}
    </div>
  );
}

export const hideBase44Index = true;