import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { Plus, Settings, Search, Wand2, Download, ClipboardList, CheckSquare, AlertCircle, ShieldCheck, Thermometer, AlertTriangle, Wrench, Trash2, MessageSquare, ArrowRightLeft, Wind, ChevronRight, Zap, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
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
  const [activeFilter, setActiveFilter] = useState(() => new URLSearchParams(location.search).get('type') || 'all');
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

  useEffect(() => {
    setActiveFilter(new URLSearchParams(location.search).get('type') || 'all');
  }, [location.search]);

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
    { id: 'needs_attention', label: 'Needs Attention' },
    { id: 'open', label: 'Open' },
    { id: 'temperature', label: 'Temps' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'incident', label: 'Incidents' },
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'waste', label: 'Waste/86' },
    { id: 'shift_handoff', label: 'Handoffs' },
    { id: 'manager_note', label: 'Manager' },
    { id: 'bathroom', label: 'Bathroom' },
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

  function handleExport() {
    if (!filteredLogs.length) { toast.error('No logs to export'); return; }
    const headers = ['Title','Type','Status','Created By','Date','Location','Notes'];
    const rows = filteredLogs.map(l => [
      l.title || '',
      l.type || '',
      l.status || '',
      l.employee_name || '',
      l.created_date ? new Date(l.created_date).toLocaleDateString() : '',
      l.location || '',
      (l.description || '').replace(/\n/g,' '),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function openQuickLog(type) {
    setSelectedLogType(type);
    setShowAddModal(true);
  }

  const todayDate = new Date();
  const todayStr = todayDate.toDateString();
  const yd = new Date(todayDate); yd.setDate(todayDate.getDate()-1);
  const yesterdayStr = yd.toDateString();

  const todaysLogs    = logs.filter(l => l.created_date && new Date(l.created_date).toDateString() === todayStr);
  const yesterdaysLogs = logs.filter(l => l.created_date && new Date(l.created_date).toDateString() === yesterdayStr);
  const needsReviewLogs = logs.filter(l => l.requires_review).slice(0, 5);
  const openIssues    = logs.filter(l => (l.type === 'incident' || l.type === 'maintenance') && l.status === 'open');
  const todayTemps    = todaysLogs.filter(l => l.type === 'temperature');
  const failedTemps   = todayTemps.filter(l => l.status === 'failed' || l.status === 'flagged');

  function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="flex flex-col bg-background lg:h-screen lg:overflow-hidden pb-40 lg:pb-0">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:overflow-hidden">
        {/* Desktop page header — inline (no sticky) since parent is overflow-hidden flex column */}
        <div
          className="hidden lg:flex items-center justify-between shrink-0 -mx-8 px-8 h-10"
          style={{ background: 'rgba(5,8,14,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-bold text-foreground/90 tracking-wide">Logs</h1>
            <span className="text-muted-foreground/30 text-sm">·</span>
            <p className="text-[13px] text-muted-foreground/60">All operational records in one place</p>
          </div>
          <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={generateDummyLogs}
              className="glow-interactive h-8 px-3 rounded-lg border border-border/60 card-glass text-foreground font-bold text-xs active:scale-95 transition-all flex items-center gap-1"
              title="Generate test logs"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Test Data
            </button>
          )}
          <button
            onClick={handleExport}
            className="h-8 px-3 rounded-lg border border-border/60 card-glass text-foreground font-bold text-xs active:scale-95 transition-all flex items-center gap-1"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={() => setShowTypeSelector(true)}
            className="btn-primary h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> New Log
          </button>
          </div>
        </div>
        {/* Desktop Summary Cards */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-3 px-8 py-4 shrink-0 border-b border-border/20">
          {[
            {
              id: 'today',
              icon: ClipboardList,
              label: "Today's Logs",
              value: todaysLogs.length,
              detail: yesterdaysLogs.length > 0
                ? (todaysLogs.length >= yesterdaysLogs.length
                    ? `↑ ${todaysLogs.length - yesterdaysLogs.length} vs yesterday`
                    : `↓ ${yesterdaysLogs.length - todaysLogs.length} vs yesterday`)
                : 'No data yesterday',
              iconBg: 'bg-blue-500/10 border-blue-500/20',
              iconColor: 'text-blue-400',
              filter: 'all',
            },
            {
              id: 'review',
              icon: CheckSquare,
              label: 'Needs Review',
              value: logs.filter(l => l.requires_review || l.status === 'open').length,
              detail: logs.filter(l => l.requires_review || l.status === 'open').length > 0
                ? `Across ${new Set(logs.filter(l => l.requires_review || l.status === 'open').map(l => l.type)).size} categories`
                : 'All caught up',
              iconBg: 'bg-amber-500/10 border-amber-500/20',
              iconColor: 'text-amber-400',
              filter: 'needs_attention',
            },
            {
              id: 'issues',
              icon: AlertCircle,
              label: 'Open Issues',
              value: openIssues.length,
              detail: openIssues.length > 0 ? 'Require attention' : 'None open',
              iconBg: 'bg-red-500/10 border-red-500/20',
              iconColor: 'text-red-400',
              filter: 'incident',
            },
            {
              id: 'food_safety',
              icon: ShieldCheck,
              label: 'Food Safety',
              value: todayTemps.length,
              detail: failedTemps.length > 0 ? `${failedTemps.length} failed` : todayTemps.length > 0 ? 'Temp logs in range' : 'No temps today',
              iconBg: failedTemps.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20',
              iconColor: failedTemps.length > 0 ? 'text-red-400' : 'text-emerald-400',
              filter: 'temperature',
            },
          ].map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setActiveFilter(card.filter)}
                className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/50 hover:border-border/70 transition-colors text-left"
              >
                <div className={cn('h-10 w-10 rounded-xl border flex items-center justify-center shrink-0', card.iconBg)}>
                  <Icon className={cn('h-5 w-5', card.iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-black text-foreground tabular-nums leading-tight">{card.value}</p>
                  <p className="text-[11px] text-muted-foreground/70 truncate">{card.detail}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile stat chips */}
        <div className="lg:hidden grid grid-cols-4 gap-2 px-4 py-3 border-b border-border/20">
          {[
            { id: 'all',             icon: Clock,         label: 'Today',  value: todaysLogs.length,                                                   color: 'text-blue-400'  },
            { id: 'needs_attention', icon: CheckSquare,   label: 'Review', value: logs.filter(l => l.requires_review || l.status === 'open').length,    color: 'text-amber-400' },
            { id: 'temperature',     icon: Thermometer,   label: 'Temps',  value: todayTemps.length,                                                    color: 'text-red-400'   },
            { id: 'incident',        icon: AlertTriangle, label: 'Issues', value: openIssues.length,                                                    color: 'text-red-400'   },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.id}
                onClick={() => setActiveFilter(stat.id)}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border/20 active:scale-95 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-sm font-black text-foreground">{stat.value}</p>
                <p className="text-[9px] font-bold text-muted-foreground text-center leading-tight">{stat.label}</p>
              </button>
            );
          })}
        </div>

        {/* View Tabs */}
        <div className="border-b border-border/20 px-4 pt-4 pb-2.5 flex items-center gap-1 overflow-x-auto scrollbar-hide">
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
          <div className="flex-1 lg:hidden" />
          <button
            onClick={() => setShowTypeSelector(true)}
            className="lg:hidden btn-primary h-8 px-3 text-xs flex items-center gap-1 flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>

        {/* Search & Filters — mobile only */}
        <div className="lg:hidden border-b border-border/20 px-4 py-2.5 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg card-glass border border-border/40 text-foreground text-xs focus:outline-none focus:border-primary"
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
          <div className="flex gap-1.5 overflow-x-auto pb-1 pt-4 pl-1 scrollbar-hide">
            {QUICK_FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => { haptics.light?.(); setActiveFilter(chip.id); }}
                className={cn(
                  'flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  activeFilter === chip.id ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content + Sidebar row */}
        <div className="flex-1 flex lg:overflow-hidden">

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* Desktop search & filters — inline in scrollable area */}
            <div className="hidden lg:flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-lg card-glass border border-border/40 text-foreground text-xs focus:outline-none focus:border-primary"
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
            <div className="hidden lg:flex gap-1.5 overflow-x-auto pb-3 mb-1 pt-4 pl-1 scrollbar-hide">
              {QUICK_FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => { haptics.light?.(); setActiveFilter(chip.id); }}
                  className={cn(
                    'flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                    activeFilter === chip.id ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {viewMode === 'feed' && (
              filteredLogs.length === 0 && (activeFilter !== 'all' || searchQuery.trim()) ? (
                <div className="text-center py-16 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center mx-auto">
                    <Search className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">No logs match this filter</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a different filter or clear your search</p>
                  </div>
                  <button
                    onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 text-sm font-bold text-muted-foreground hover:bg-muted/30 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <LogsFeedView
                  logs={filteredLogs}
                  onLogClick={(logId) => {
                    const log = filteredLogs.find((l) => l.id === logId);
                    setSelectedLog(log);
                    setShowLogDetail(true);
                  }}
                  onLogUpdate={handleLogUpdate}
                />
              )
            )}

            {viewMode === 'review' && <LogsReviewQueueView logs={filteredLogs} onLogClick={(log) => { setSelectedLog(log); setShowLogDetail(true); }} />}

            {viewMode === 'calendar' && <LogsCalendarView logs={filteredLogs} />}

            {viewMode === 'analytics' && <LogsAnalyticsView logs={filteredLogs} />}
          </div>

          {/* Right Sidebar - desktop only */}
          <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l border-border/20 overflow-y-auto bg-card/20">

            {/* Quick Log */}
            <div className="p-4 border-b border-border/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Quick Log</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { type: 'temperature',  label: 'Temp Log',     icon: Thermometer,    color: 'text-cyan-400   bg-cyan-500/8   border-cyan-500/20   hover:border-cyan-500/40'   },
                  { type: 'incident',     label: 'Incident',     icon: AlertTriangle,  color: 'text-red-400    bg-red-500/8    border-red-500/20    hover:border-red-500/40'    },
                  { type: 'waste',        label: 'Waste/86',     icon: Trash2,         color: 'text-yellow-400 bg-yellow-500/8 border-yellow-500/20 hover:border-yellow-500/40' },
                  { type: 'manager_note', label: 'Manager Note', icon: MessageSquare,  color: 'text-orange-400 bg-orange-500/8 border-orange-500/20 hover:border-orange-500/40' },
                  { type: 'maintenance',  label: 'Maintenance',  icon: Wrench,         color: 'text-amber-400  bg-amber-500/8  border-amber-500/20  hover:border-amber-500/40'  },
                  { type: 'shift_handoff',label: 'Handoff',      icon: ArrowRightLeft, color: 'text-purple-400 bg-purple-500/8 border-purple-500/20 hover:border-purple-500/40' },
                ].map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => openQuickLog(type)}
                    className={cn('flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-bold transition-colors', color)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Needs Review */}
            <div className="p-4 border-b border-border/20 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Needs Review</p>
                {needsReviewLogs.length > 0 && (
                  <button onClick={() => setViewMode('review')} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                    All <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              {needsReviewLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 py-2">Nothing needs review</p>
              ) : (
                <div className="space-y-2">
                  {needsReviewLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-2 py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{log.title}</p>
                        <p className="text-[10px] text-muted-foreground/60">{log.employee_name} · {fmtTime(log.created_date)}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedLog(log); setShowLogDetail(true); }}
                        className="text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors shrink-0"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today at a Glance */}
            <div className="p-4 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Today at a Glance</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Temps Logged',       type: 'temperature',   icon: Thermometer,   color: 'text-cyan-400'   },
                  { label: 'Waste Recorded',      type: 'waste',         icon: Trash2,        color: 'text-yellow-400' },
                  { label: 'Maintenance Logs',    type: 'maintenance',   icon: Wrench,        color: 'text-amber-400'  },
                  { label: 'Cleanings Completed', type: 'cleaning',      icon: Wind,          color: 'text-green-400'  },
                  { label: 'Handoffs Completed',  type: 'shift_handoff', icon: ArrowRightLeft, color: 'text-purple-400' },
                ].map(({ label, type, icon: Icon, color }) => {
                  const count = todaysLogs.filter(l => l.type === type).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type)}
                      className="w-full flex items-center justify-between hover:bg-muted/20 rounded-lg px-1 py-0.5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-3.5 w-3.5', color)} />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-xs font-black text-foreground tabular-nums">{count}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setViewMode('analytics')}
                className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View full analytics <ChevronRight className="h-3 w-3" />
              </button>
            </div>

          </aside>

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
