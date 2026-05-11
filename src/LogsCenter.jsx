import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { Plus, Settings, Search, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import LogsInboxHeader from '@/components/logcenter/LogsInboxHeader';
import LogsFeedView from '@/components/logcenter/LogsFeedView';
import LogsDetailDrawer from '@/components/logcenter/LogsDetailDrawer';
import LogsFilterSidebar from '@/components/logcenter/LogsFilterSidebar';
import LogsReviewQueueView from '@/components/logcenter/LogsReviewQueueView';
import LogTypeSelector from '@/components/logcenter/LogTypeSelector';
import LogsCalendarView from '@/components/logcenter/LogsCalendarView';
import LogsAnalyticsView from '@/components/logcenter/LogsAnalyticsView';
import UnifiedLogForm from '@/components/UnifiedLogForm';

/**
 * Unified Logs Command Center
 * Single system for all log types: temperature, maintenance, incidents, waste, cleaning, manager notes, etc.
 */
export default function LogsCenter() {
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    const quickAddType = location.state?.quickAddType;
    if (!quickAddType) return;

    setSelectedLogType(quickAddType);
    setShowTypeSelector(false);
    setShowAddModal(true);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  // Load logs with permission filtering
  useEffect(() => {
    isMounted.current = true;
    const loadLogs = async () => {
      try {
        const allLogs = await base44.entities.UnifiedLog.list('-created_date', 100).catch(() => []);
        const visibleLogs = allLogs.filter((log) => {
          // Admin sees all logs
          if (user?.role === 'admin') return true;
          // Manager sees all except private
          if (user?.role === 'manager') {
            return log.visibility !== 'private';
          }
          // Staff see only public logs
          return log.visibility === 'public' || !log.visibility;
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
        // Check if this log is visible to current user
        const isVisible = user?.role === 'admin' ? true : 
          user?.role === 'manager' ? event.data.visibility !== 'private' :
          event.data.visibility === 'public' || !event.data.visibility;
        if (isVisible) setLogs((prev) => [event.data, ...prev]);
      } else if (event.type === 'update' && isMounted.current) {
        setLogs((prev) => prev.map((l) => (l.id === event.id ? event.data : l)));
        if (selectedLog?.id === event.id) setSelectedLog(event.data);
      }
    });
    return () => {
      isMounted.current = false;
      unsubscribe?.();
    };
  }, [user?.role, user?.email]);

  // Filter logs with 'needs_attention' handling
  const filteredLogs = logs.filter((log) => {
    const needsAttention = log.status === 'open' || log.status === 'flagged' || log.requires_review || (log.follow_up_required && !log.follow_up_due_date);
    
    if (activeFilter === 'needs_attention' && !needsAttention) return false;
    if (activeFilter === 'open' && log.status !== 'open') return false;
    if (activeFilter !== 'all' && activeFilter !== 'needs_attention' && activeFilter !== 'open' && log.type !== activeFilter) return false;
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
    { id: 'needs_attention', label: '⚠️ Needs Attention' },
    { id: 'open', label: 'Open' },
    { id: 'temperature', label: '🌡️ Temps' },
    { id: 'maintenance', label: '🔧 Maintenance' },
    { id: 'incident', label: '🚨 Incidents' },
    { id: 'cleaning', label: '🧹 Cleaning' },
    { id: 'waste', label: '♻️ Waste/86' },
    { id: 'manager_note', label: '📝 Manager' },
    { id: 'bathroom', label: '🚽 Bathroom' },
  ];

  const handleLogUpdate = async (logId, updates) => {
    try {
      await base44.entities.UnifiedLog.update(logId, updates);
      setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, ...updates } : l)));
      toast.success('Log updated');
    } catch (err) {
      toast.error('Failed to update log');
    }
  };

  const generateDummyLogs = async () => {
    try {
      haptics.medium?.();
      const res = await base44.functions.invoke('generateDummyLogs', {});
      toast.success(`Created ${res.data.count} test logs`);
      // Reload logs
      setTimeout(() => {
        const loadLogs = async () => {
          const allLogs = await base44.entities.UnifiedLog.list('-created_date', 100).catch(() => []);
          setLogs(allLogs);
        };
        loadLogs();
      }, 500);
    } catch (err) {
      toast.error('Failed to generate logs: ' + err.message);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden pb-40 lg:pb-0">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Inbox Header with Stats */}
        <LogsInboxHeader
          logs={logs}
          onStatClick={(statId) => {
            const filterMap = {
              today: 'all',
              review: 'needs_attention',
              temp_failed: 'temperature',
              issues: 'incident',
            };
            setActiveFilter(filterMap[statId] || 'all');
          }}
        />

        {/* View Tabs */}
        <div className="border-b border-border/20 px-4 py-2.5 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {[
            { id: 'feed', label: 'Feed' },
            { id: 'review', label: 'Review' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { haptics.light?.(); setViewMode(tab.id); }}
              className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200',
              viewMode === tab.id ? 'glow-active' : 'text-muted-foreground hover:text-foreground'
            )}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={generateDummyLogs}
            className="glow-interactive hidden lg:flex h-8 px-3 rounded-lg border border-border/60 bg-card text-foreground font-bold text-xs active:scale-95 transition-all items-center gap-1 flex-shrink-0"
            title="Generate test logs"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Test Data
          </button>
          <button
            onClick={() => setShowTypeSelector(true)}
            className="btn-primary h-8 px-3 text-xs flex items-center gap-1 flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="border-b border-border/20 px-4 py-2.5 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-card border border-border/40 text-foreground text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className={`h-8 px-2 rounded-lg border transition-all flex items-center gap-1 text-xs font-semibold ${
                Object.keys(advancedFilters).length > 0
                  ? 'glow-active'
                  : 'bg-card border-border/40 text-muted-foreground glow-interactive'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => { haptics.light?.(); setActiveFilter(chip.id); }}
                className={cn(
                  'flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  activeFilter === chip.id ? 'glow-active' : 'bg-card border border-border/40 text-muted-foreground glow-interactive'
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {viewMode === 'feed' && (
            <LogsFeedView
              logs={filteredLogs}
              onLogClick={(logId) => {
                const log = filteredLogs.find((l) => l.id === logId);
                setSelectedLog(log);
                setShowLogDetail(true);
              }}
              onLogUpdate={handleLogUpdate}
            />
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
