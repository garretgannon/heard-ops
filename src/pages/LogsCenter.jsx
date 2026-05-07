import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import LogsCommandHeader from '@/components/logcenter/LogsCommandHeader';
import LogsCompactFilterBar from '@/components/logcenter/LogsCompactFilterBar';
import LogsViewTabs from '@/components/logcenter/LogsViewTabs';
import AdvancedFilterSheet from '@/components/logcenter/AdvancedFilterSheet';
import LogCard from '@/components/logcenter/LogCard';
import UnifiedLogForm from '@/components/UnifiedLogForm';
import LogsDesktopLayout from '@/components/logcenter/LogsDesktopLayout';

const DEBUG_OVERFLOW = true; // Set to true to enable overflow debugging on mobile

const DebugOverflowCheck = ({ name, children, className }) => {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!DEBUG_OVERFLOW) return;
    const el = ref.current;
    if (!el) return;
    
    const checkOverflow = () => {
      const clientWidth = el.clientWidth;
      const scrollWidth = el.scrollWidth;
      const diff = scrollWidth - clientWidth;
      
      if (diff > 0) {
        console.log(`🔴 OVERFLOW DETECTED: ${name}`, {
          element: name,
          clientWidth,
          scrollWidth,
          difference: diff,
          className: el.className,
          overflow: diff > 1,
        });
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [name]);
  
  return (
    <div
      ref={ref}
      className={className}
      style={DEBUG_OVERFLOW ? { border: '2px dashed rgba(255,100,100,0.5)', position: 'relative' } : {}}
    >
      {DEBUG_OVERFLOW && <div style={{ position: 'absolute', top: '-20px', left: '0', fontSize: '10px', color: 'red', backgroundColor: 'rgba(255,100,100,0.3)', padding: '2px 4px', zIndex: 999 }}>{name}</div>}
      {children}
    </div>
  );
};

export default function LogsCenter() {
  const { user, isAdmin } = useCurrentUser();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('feed');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const isMounted = useRef(true);

  // Debug: log page dimensions on mobile
  useEffect(() => {
    if (!DEBUG_OVERFLOW) return;
    const checkPageWidth = () => {
      const bodyWidth = document.body.clientWidth;
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const windowWidth = window.innerWidth;
      
      console.log('📊 PAGE WIDTH DEBUG:', {
        'window.innerWidth': windowWidth,
        'document.documentElement.clientWidth': docWidth,
        'document.documentElement.scrollWidth': scrollWidth,
        'document.body.clientWidth': bodyWidth,
        'scroll difference': scrollWidth - windowWidth,
      });
    };
    
    setTimeout(checkPageWidth, 100);
    window.addEventListener('resize', checkPageWidth);
    return () => window.removeEventListener('resize', checkPageWidth);
  }, []);

  // Load logs
  useEffect(() => {
    isMounted.current = true;
    const loadLogs = async () => {
      try {
        const allLogs = await base44.entities.UnifiedLog.list('-created_date', 200).catch(() => []);

        // Filter by visibility for non-admins
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

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.UnifiedLog.subscribe((event) => {
      if (event.type === 'create' && isMounted.current) {
        setLogs((prev) => [event.data, ...prev]);
      } else if (event.type === 'update' && isMounted.current) {
        setLogs((prev) => prev.map((l) => (l.id === event.id ? event.data : l)));
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe?.();
    };
  }, [user]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Quick filter (active chip)
    if (activeFilter !== 'all') {
      if (activeFilter === 'needs_review' && !log.requires_review) return false;
      if (activeFilter === 'open' && log.status !== 'open') return false;
      if (activeFilter !== 'needs_review' && activeFilter !== 'open' && log.type !== activeFilter) return false;
    }

    // Advanced filters
    if (advancedFilters.types?.length && !advancedFilters.types.includes(log.type)) return false;
    if (advancedFilters.statuses?.length && !advancedFilters.statuses.includes(log.status)) return false;
    if (advancedFilters.requiresReview && !log.requires_review) return false;
    if (advancedFilters.hasPhoto && (!log.photo_urls || log.photo_urls.length === 0)) return false;
    if (advancedFilters.openFollowUp && (!log.follow_up_required || log.follow_up_due_date <= new Date().toISOString())) return false;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        log.title.toLowerCase().includes(query) ||
        log.description?.toLowerCase().includes(query) ||
        log.location?.toLowerCase().includes(query) ||
        log.employee_name?.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Desktop layout for screens 1024px and above
  if (!isMobile) {
    return (
      <>
        <LogsDesktopLayout
          logs={logs}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          advancedFilters={advancedFilters}
          onApplyAdvancedFilters={(filters) => {
            setAdvancedFilters(filters);
          }}
          onClearAdvancedFilters={() => setAdvancedFilters({})}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onQuickAdd={() => setShowAddModal(true)}
          filteredLogs={filteredLogs}
        />
        {showAddModal && (
          <UnifiedLogForm
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              toast.success('Log created');
            }}
          />
        )}
      </>
    );
  }

  // Mobile layout for screens below 1024px
  return (
    <DebugOverflowCheck name="PAGE_WRAPPER" className="w-full h-full bg-background flex flex-col overflow-hidden">
      {/* Sticky Header Stack */}
      <DebugOverflowCheck name="HEADER_STACK" className="flex-shrink-0 w-full overflow-x-hidden">
        {/* Page Header */}
        <LogsCommandHeader onQuickAdd={() => setShowAddModal(true)} />

        {/* Compact Filter Bar - Search + Button + Chips */}
        <LogsCompactFilterBar
          search={searchQuery}
          onSearch={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onShowAdvanced={() => setShowAdvancedFilters(true)}
        />

        {/* View Tabs */}
        <LogsViewTabs activeView={viewMode} onViewChange={setViewMode} />
      </DebugOverflowCheck>

      {/* Scrollable Content Area */}
      <DebugOverflowCheck name="CONTENT_AREA" className="flex-1 w-full overflow-y-auto overflow-x-hidden box-border">
        <div className="w-full px-4 py-3 box-border">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No logs found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting filters</p>
            </div>
          ) : (
            <DebugOverflowCheck name="LOG_LIST" className="space-y-2">
              {filteredLogs.map((log) => (
                <DebugOverflowCheck name={`LOG_CARD_${log.id.substring(0, 8)}`} className="w-full" key={log.id}>
                  <LogCard
                    log={log}
                    onOpen={(logId) => {
                      toast.info('Log detail view coming soon');
                    }}
                  />
                </DebugOverflowCheck>
              ))}
            </DebugOverflowCheck>
          )}
        </div>
        {/* Bottom padding for fixed nav */}
        <div className="h-32" />
      </DebugOverflowCheck>

      {/* Add Log Modal */}
      {showAddModal && (
        <UnifiedLogForm
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            toast.success('Log created');
          }}
        />
      )}

      {/* Advanced Filter Sheet */}
      <AdvancedFilterSheet
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onApplyFilters={(filters) => {
          setAdvancedFilters(filters);
          setShowAdvancedFilters(false);
        }}
      />
    </DebugOverflowCheck>
  );
}

export const hideBase44Index = true;