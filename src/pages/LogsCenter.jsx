import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import LogsCommandHeader from '@/components/logcenter/LogsCommandHeader';
import LogsCompactFilterBar from '@/components/logcenter/LogsCompactFilterBar';
import AdvancedFilterSheet from '@/components/logcenter/AdvancedFilterSheet';
import LogCard from '@/components/logcenter/LogCard';
import UnifiedLogForm from '@/components/UnifiedLogForm';

export default function LogsCenter() {
  const { user, isAdmin } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const isMounted = useRef(true);

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

  return (
    <div className="pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      {/* Header */}
      <LogsCommandHeader onQuickAdd={() => setShowAddModal(true)} />

      {/* Compact Filter Bar */}
      <LogsCompactFilterBar
        search={searchQuery}
        onSearch={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onShowAdvanced={() => setShowAdvancedFilters(true)}
      />

      {/* Content */}
      <div className="flex-1 px-4 py-4 lg:px-8 max-w-4xl mx-auto w-full">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No logs found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                onOpen={(logId) => {
                  // TODO: Open log detail modal
                  toast.info('Log detail view coming soon');
                }}
              />
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}

export const hideBase44Index = true;