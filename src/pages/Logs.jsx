import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import { isToday, isYesterday, isThisWeek, subDays, startOfMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { RefreshCw, List, CalendarDays, Clock } from "lucide-react";
import { mapLog } from "@/components/activity-logs/logConfig";
import FeedView from "@/components/activity-logs/FeedView";
import CalendarView from "@/components/logcenter/LogsCalendarView";
import ReviewView from "@/components/logcenter/LogsReviewView";
import LogCreateModal from "@/components/logcenter/LogCreateModal";
import LogsPageHeader from "@/components/logcenter/LogsPageHeader";
import LogsTopFilterBar from "@/components/logcenter/LogsTopFilterBar";
import LogsAttentionQueue from "@/components/logcenter/LogsAttentionQueue";
import LogsAdvancedFilterDrawer from "@/components/logcenter/LogsAdvancedFilterDrawer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const EMPTY_FILTERS = {
  types: [],
  statuses: [],
  priorities: [],
  datePreset: '',
  dateFrom: '',
  dateTo: '',
  createdBy: '',
  assignedTo: '',
  role: '',
  station: '',
  area: '',
  equipment: '',
  employee: '',
  requiresReview: false,
  hasPhoto: false,
  assignedToMe: false,
  openClosed: '',
  passFail: '',
  tags: [],
};

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
    if (q) {
      const haystack = [log.title, log.subtitle, log.notes, log.equipment, log.person, log.area, log.station, ...(log.tags || [])].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.types?.length && !filters.types.includes(log.type)) return false;
    if (filters.statuses?.length && !filters.statuses.includes(log.status)) return false;
    if (filters.priorities?.length && !filters.priorities.includes(log.priority)) return false;

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

    if (filters.passFail === "failed" && log.status !== "flagged" && log.status !== "failed") return false;
    if (filters.passFail === "passed" && !["completed", "approved", "passed"].includes(log.status)) return false;

    if (filters.openClosed === "open"   && !OPEN_STATUSES.has(log.status))   return false;
    if (filters.openClosed === "closed" && !CLOSED_STATUSES.has(log.status)) return false;

    if (filters.requiresReview && !log.requiresReview) return false;
    if (filters.hasPhoto && !log.hasPhoto) return false;
    if (filters.assignedToMe && log.assignedTo !== currentUserEmail && log.person !== currentUserEmail) return false;

    if (filters.tags?.length) {
      const logTagIds = (log.tags || []).map(t => typeof t === 'string' ? t : t.id);
      const filterTagIds = filters.tags.map(t => t.id);
      const hasAllTags = filterTagIds.every(fId => logTagIds.includes(fId));
      if (!hasAllTags) return false;
    }

    if (filters.createdBy  && !log.person?.toLowerCase().includes(filters.createdBy.toLowerCase()))    return false;
    if (filters.assignedTo && !log.assignedTo?.toLowerCase().includes(filters.assignedTo.toLowerCase())) return false;
    if (filters.employee   && !log.person?.toLowerCase().includes(filters.employee.toLowerCase()))     return false;
    if (filters.role       && !log.department?.toLowerCase().includes(filters.role.toLowerCase()))     return false;

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
  const { user, isAdmin } = useCurrentUser();
  const [allLogs,      setAllLogs]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeView,   setActiveView]   = useState("feed");
  const [search,       setSearch]       = useState("");
  const [filters,      setFilters]      = useState(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [createType,   setCreateType]   = useState(null);
  const [isDesktop,    setIsDesktop]    = useState(window.innerWidth >= 1024);

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

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const hasActiveFilters  = activeFilterCount > 0 || !!search;

  const handleLogClick = (log) => navigate(log.routePath);
  const handleCreateLog = (type) => { setCreateType(type); setShowCreate(true); };

  // Desktop layout
  if (isDesktop) {
    return (
      <>
        <LogsPageHeader onCreateClick={handleCreateLog} onViewChange={setActiveView} activeView={activeView} />
        <LogsTopFilterBar search={search} onSearchChange={setSearch} filters={filters} onFiltersChange={setFilters} onShowAdvanced={() => setShowAdvanced(true)} />
        <div className="grid grid-cols-[1fr_280px] gap-8 px-8 py-6 h-[calc(100vh-240px)]">
          {/* Main feed */}
          <div className="min-w-0 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {activeView === "feed" && <FeedView logs={filteredLogs} onLogClick={handleLogClick} />}
                {activeView === "calendar" && <CalendarView logs={applyFilters(allLogs, "", filters, user?.email)} onLogClick={handleLogClick} />}
                {activeView === "review" && <ReviewView logs={applyFilters(allLogs, "", filters, user?.email)} onLogClick={handleLogClick} />}
              </>
            )}
          </div>
          {/* Right attention queue */}
          <div className="border-l border-border/20 pl-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</p>
              <button onClick={refresh} className={cn("h-5 w-5 text-muted-foreground hover:text-foreground", refreshing && "animate-spin")}>
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <LogsAttentionQueue logs={filteredLogs} onFilterClick={f => setFilters(f)} isAdmin={isAdmin} />
          </div>
        </div>
        <LogsAdvancedFilterDrawer isOpen={showAdvanced} onClose={() => setShowAdvanced(false)} filters={filters} onFiltersChange={setFilters} currentUser={user} />
        {showCreate && <LogCreateModal createType={createType} onClose={() => { setShowCreate(false); setCreateType(null); }} onCreated={refresh} />}
      </>
    );
  }

  // Mobile layout
  return (
    <div className="pb-32 min-h-screen">
      <LogsPageHeader onCreateClick={handleCreateLog} onViewChange={setActiveView} activeView={activeView} />
      <LogsTopFilterBar search={search} onSearchChange={setSearch} filters={filters} onFiltersChange={setFilters} onShowAdvanced={() => setShowAdvanced(true)} />
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeView === "feed" && <FeedView logs={filteredLogs} onLogClick={handleLogClick} />}
            {activeView === "calendar" && <CalendarView logs={applyFilters(allLogs, "", filters, user?.email)} onLogClick={handleLogClick} />}
            {activeView === "review" && <ReviewView logs={applyFilters(allLogs, "", filters, user?.email)} onLogClick={handleLogClick} />}
          </>
        )}
      </div>
      <LogsAdvancedFilterDrawer isOpen={showAdvanced} onClose={() => setShowAdvanced(false)} filters={filters} onFiltersChange={setFilters} currentUser={user} />
      {showCreate && <LogCreateModal createType={createType} onClose={() => { setShowCreate(false); setCreateType(null); }} onCreated={refresh} />}
    </div>
  );
}

export const hideBase44Index = true;