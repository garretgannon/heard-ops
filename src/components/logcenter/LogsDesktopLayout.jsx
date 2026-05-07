import { Plus, Download, Settings, Search } from 'lucide-react';
import { useState } from 'react';
import { haptics } from '@/utils/haptics';
import LogsMetricsRow from './LogsMetricsRow';
import LogsAdvancedSidebar from './LogsAdvancedSidebar';
import LogDetailDrawer from './LogDetailDrawer';
import LogCard from './LogCard';

const QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'temperature', label: 'Temperatures' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'incident', label: 'Incidents' },
  { id: 'employee_note', label: 'Employee Notes' },
  { id: 'manager_note', label: 'Manager Notes' },
  { id: 'waste', label: 'Waste' },
  { id: 'eighty_six', label: '86' },
];

export default function LogsDesktopLayout({
  logs,
  searchQuery,
  onSearch,
  activeFilter,
  onFilterChange,
  advancedFilters,
  onApplyAdvancedFilters,
  onClearAdvancedFilters,
  viewMode,
  onViewChange,
  onQuickAdd,
  filteredLogs,
}) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);

  const handleMetricClick = (metric) => {
    // Map metric filters to active filter
    if (metric === 'today') onFilterChange('all');
    else if (metric === 'needs_review') onFilterChange('needs_review');
    else if (metric === 'open') onFilterChange('open');
    else if (metric === 'failed_temps') onFilterChange('temperature');
    else if (metric === 'overdue_followup') onFilterChange('all');
    else if (metric === 'resolved_today') onFilterChange('all');
  };

  const handleLogClick = (logId) => {
    const log = logs.find(l => l.id === logId);
    if (log) {
      setSelectedLog(log);
      setShowDetailDrawer(true);
    }
  };

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* Page Header */}
      <div className="flex-shrink-0 border-b border-border/20 px-8 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">Track every operational record, issue, and shift note</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { haptics.light?.(); onQuickAdd?.(); }}
              className="h-11 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all hover:brightness-110 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Log
            </button>
            <button className="h-11 w-11 rounded-lg bg-card border border-border/40 text-muted-foreground flex items-center justify-center active:scale-95 transition-all hover:border-border/60">
              <Download className="h-4 w-4" />
            </button>
            <button className="h-11 w-11 rounded-lg bg-card border border-border/40 text-muted-foreground flex items-center justify-center active:scale-95 transition-all hover:border-border/60">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit">
          {['feed', 'calendar', 'review', 'analytics'].map((view) => (
            <button
              key={view}
              onClick={() => onViewChange?.(view)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === view
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {view === 'feed' && 'Feed'}
              {view === 'calendar' && 'Calendar'}
              {view === 'review' && 'Review Queue'}
              {view === 'analytics' && 'Analytics'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex-shrink-0 border-b border-border/20 px-8 py-4">
        <LogsMetricsRow logs={logs} onMetricClick={handleMetricClick} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Column - Feed */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Search & Quick Filters */}
          <div className="flex-shrink-0 border-b border-border/20 px-8 py-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search logs, employees, equipment, stations, notes..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border/40 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 box-border"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => { haptics.light?.(); onFilterChange(filter.id); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === filter.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-card border border-border/40 text-muted-foreground hover:border-border/60 hover:bg-muted/20'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Log List */}
          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No logs found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <LogCard
                  key={log.id}
                  log={log}
                  onOpen={handleLogClick}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar - Filters */}
        <LogsAdvancedSidebar
          filters={advancedFilters}
          onApplyFilters={onApplyAdvancedFilters}
          onClearFilters={onClearAdvancedFilters}
        />
      </div>

      {/* Log Detail Drawer */}
      <LogDetailDrawer
        log={selectedLog}
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        onUpdate={(updatedLog) => {
          // Handle log update
          console.log('Update log:', updatedLog);
        }}
      />
    </div>
  );
}