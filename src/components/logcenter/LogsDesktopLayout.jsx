import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Search, X, Calendar, List } from 'lucide-react';
import LogsFeedView from './LogsFeedView';
import LogsCalendarView from './LogsCalendarView';
import LogsFilterSidebar from './LogsFilterSidebar';
import LogsQuickActionsSidebar from './LogsQuickActionsSidebar';

const EMPTY_FILTERS = { types: [], statuses: [], priorities: [], datePreset: null, dateFrom: null, dateTo: null, station: null, area: null, equipment: null, requiresReview: false, hasPhoto: false, assignedToMe: false };

export default function LogsDesktopLayout({ 
  logs, 
  loading, 
  onLogClick, 
  filters, 
  onFiltersChange,
  search,
  onSearchChange,
  onCreateLog,
  currentUser
}) {
  const [activeView, setActiveView] = useState('feed');
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const VIEWS = [
    { id: 'feed', label: 'Feed', icon: List },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  useMemo(() => {
    let count = 0;
    if (filters.types?.length) count++;
    if (filters.statuses?.length) count++;
    if (filters.priorities?.length) count++;
    if (filters.datePreset || filters.dateFrom || filters.dateTo) count++;
    if (filters.station || filters.area || filters.equipment) count++;
    if (filters.requiresReview || filters.hasPhoto || filters.assignedToMe) count++;
    setActiveFilterCount(count);
  }, [filters]);

  return (
    <div className="flex gap-4 h-[calc(100vh-80px)] bg-background">
      {/* LEFT SIDEBAR - FILTERS */}
      <LogsFilterSidebar
        filters={filters}
        onChange={onFiltersChange}
        currentUser={currentUser}
      />

      {/* CENTER - MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Logs</h1>
              <p className="text-sm text-muted-foreground">Track every operational record, issue, checklist, and shift note</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onCreateLog}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 active:scale-95">
                <Plus className="h-4 w-4" /> New Log
              </button>
            </div>
          </div>

          {/* View selector */}
          <div className="flex items-center gap-2">
            {VIEWS.map(v => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                    activeView === v.id
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  )}>
                  <Icon className="h-3.5 w-3.5" /> {v.label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs, equipment, notes, tags…"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full h-10 pl-10 pr-10 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.types?.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/30">
                  {t}
                  <button onClick={() => onFiltersChange({ ...filters, types: filters.types.filter(x => x !== t) })}><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => onFiltersChange(EMPTY_FILTERS)}
                  className="text-xs font-bold text-red-400 hover:text-red-300">
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeView === 'feed' && <LogsFeedView logs={logs} onLogClick={onLogClick} />}
              {activeView === 'calendar' && <LogsCalendarView logs={logs} onLogClick={onLogClick} />}
            </>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - QUICK ACTIONS */}
      <LogsQuickActionsSidebar
        logs={logs}
        onLogClick={onLogClick}
        onCreateLog={onCreateLog}
        currentUser={currentUser}
      />
    </div>
  );
}