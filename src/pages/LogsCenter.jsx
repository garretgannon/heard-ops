import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { Plus, Download, Settings } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import LogCard from '@/components/logcenter/LogCard';
import LogsMetricsRow from '@/components/logcenter/LogsMetricsRow';
import LogsDetailDrawer from '@/components/logcenter/LogsDetailDrawer';
import LogsFilterSidebar from '@/components/logcenter/LogsFilterSidebar';
import LogsActiveFilters from '@/components/logcenter/LogsActiveFilters';
import LogsReviewQueueView from '@/components/logcenter/LogsReviewQueueView';
import LogTypeSelector from '@/components/logcenter/LogTypeSelector';
import LogsCalendarView from '@/components/logcenter/LogsCalendarView';
import LogsAnalyticsView from '@/components/logcenter/LogsAnalyticsView';
import UnifiedLogForm from '@/components/UnifiedLogForm';

export default function LogsCenter() {
  const { user, isAdmin } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('feed');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const isMounted = useRef(true);

  // Load logs
  useEffect(() => {
    isMounted.current = true;
    const loadLogs = async () => {
      try {
        const allLogs = await base44.entities.UnifiedLog.list('-created_date', 500).catch(() => []);
        const visibleLogs = user?.role === 'admin'
          ? allLogs
          : allLogs.filter((log) => {
              if (log.visibility === 'manager_only') return false;
              if (log.visibility === 'private') return false;
              return true;
            });
        if (isMounted.current) {
          setLogs(visibleLogs);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load logs:', err);
        if (isMounted.current) setLoading(false);
      }
    };
    loadLogs();
    const unsubscribe = base44.entities.UnifiedLog.subscribe((event) => {
      if (event.type === 'create' && isMounted.current) {
        setLogs((prev) => [event.data, ...prev]);
      } else if (event.type === 'update' && isMounted.current) {
        setLogs((prev) => prev.map((l) => (l.id === event.id ? event.data : l)));
        if (selectedLog?.id === event.id) setSelectedLog(event.data);
      }
    });
    return () => {
      isMounted.current = false;
      unsubscribe?.();
    };
  }, [user]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'needs_review' && !log.requires_review) return false;
    if (activeFilter === 'open' && log.status !== 'open') return false;
    if (activeFilter !== 'all' && activeFilter !== 'needs_review' && activeFilter !== 'open' && log.type !== activeFilter) return false;
    if (advancedFilters.types?.length && !advancedFilters.types.includes(log.type)) return false;
    if (advancedFilters.statuses?.length && !advancedFilters.statuses.includes(log.status)) return false;
    if (advancedFilters.requiresReview && !log.requires_review) return false;
    if (advancedFilters.hasPhoto && (!log.photo_urls || log.photo_urls.length === 0)) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        log.title.toLowerCase().includes(query) ||
        log.description?.toLowerCase().includes(query) ||
        log.location?.toLowerCase().includes(query) ||
        log.employee_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const QUICK_FILTER_CHIPS = [
    { id: 'all', label: 'All' },
    { id: 'needs_review', label: 'Needs Review' },
    { id: 'open', label: 'Open' },
    { id: 'temperature', label: 'Temps' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'incident', label: 'Incidents' },
    { id: 'prep', label: 'Prep' },
    { id: 'cleaning', label: 'Cleaning' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/20 px-6 py-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Logs</h1>
              <p className="text-sm text-muted-foreground mt-1">Operations, compliance, issues, and shift notes</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTypeSelector(true)}
                className="h-11 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                New Log
              </button>
              <button className="h-11 w-11 rounded-lg border border-border/40 bg-card text-muted-foreground flex items-center justify-center hover:border-border/60">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Metrics */}
          <LogsMetricsRow logs={logs} onMetricClick={(metricKey) => setActiveFilter(metricKey)} />
        </div>

        {/* View Tabs */}
        <div className="border-b border-border/20 px-6 py-3">
          <div className="flex gap-2">
            {[
              { id: 'feed', label: 'Feed' },
              { id: 'review', label: 'Review Queue' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'analytics', label: 'Analytics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { haptics.light?.(); setViewMode(tab.id); }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  viewMode === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="border-b border-border/20 px-6 py-3 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search logs, employees, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg bg-card border border-border/40 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className={`h-10 px-3 rounded-lg border transition-all flex items-center gap-2 text-sm font-semibold ${
                Object.keys(advancedFilters).length > 0
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-card border-border/40 text-muted-foreground hover:border-border/60'
              }`}
            >
              <Settings className="h-4 w-4" />
              Filters
              {Object.keys(advancedFilters).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary/25 rounded-full text-xs font-bold">
                  {Object.keys(advancedFilters).length}
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => { haptics.light?.(); setActiveFilter(chip.id); }}
                className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === chip.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border/40 text-muted-foreground hover:border-border/60'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          </div>

          {/* Active Filters Row */}
          {Object.keys(advancedFilters).length > 0 && (
          <LogsActiveFilters
           filters={advancedFilters}
           onRemoveFilter={(label) => {
             const newFilters = { ...advancedFilters };
             Object.keys(newFilters).forEach((key) => {
               if (Array.isArray(newFilters[key])) {
                 newFilters[key] = newFilters[key].filter((v) => v.replace(/_/g, ' ') !== label);
               }
             });
             setAdvancedFilters(newFilters);
           }}
           onClearAll={() => setAdvancedFilters({})}
          />
          )}

          {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {viewMode === 'feed' && (
            filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-3">No logs found</p>
                <button
                  onClick={() => { setActiveFilter('all'); setSearchQuery(''); setAdvancedFilters({}); }}
                  className="px-4 py-2 rounded-lg bg-primary/15 text-primary font-semibold text-sm hover:bg-primary/25 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <LogCard
                    key={log.id}
                    log={log}
                    onOpen={(logId) => {
                      const log = filteredLogs.find((l) => l.id === logId);
                      setSelectedLog(log);
                      setShowLogDetail(true);
                    }}
                  />
                ))}
              </div>
            )
          )}

          {viewMode === 'review' && <LogsReviewQueueView logs={filteredLogs} onLogClick={(log) => { setSelectedLog(log); setShowLogDetail(true); }} />}

          {viewMode === 'calendar' && <LogsCalendarView logs={filteredLogs} />}

          {viewMode === 'analytics' && <LogsAnalyticsView logs={filteredLogs} />}
        </div>
      </div>

      {/* Advanced Filters Drawer - Hidden until Filters button clicked */}
      {showAdvancedFilters && (
        <LogsFilterSidebar
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={advancedFilters}
          onFilterChange={(filters) => {
            setAdvancedFilters(filters);
            setShowAdvancedFilters(false);
          }}
        />
      )}

      {/* Modals */}
      <LogTypeSelector
        isOpen={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelect={(logType) => {
          setSelectedLogType(logType);
          setShowAddModal(true);
        }}
      />

      {showAddModal && (
        <UnifiedLogForm
          initialType={selectedLogType}
          onClose={() => { setShowAddModal(false); setSelectedLogType(null); }}
          onSuccess={() => { setShowAddModal(false); setSelectedLogType(null); toast.success('Log created'); }}
        />
      )}

      {/* Detail Drawer */}
      <LogsDetailDrawer
        log={selectedLog}
        isOpen={showLogDetail}
        onClose={() => setShowLogDetail(false)}
        onUpdate={() => setLogs([...logs])}
      />
    </div>
  );
}

export const hideBase44Index = true;