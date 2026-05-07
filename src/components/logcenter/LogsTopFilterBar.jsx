import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const SAVED_VIEWS = [
  { id: 'all', label: 'All Logs', filters: {} },
  { id: 'needs_review', label: 'Needs Review', filters: { requiresReview: true } },
  { id: 'failed_temps', label: 'Failed Temps', filters: { types: ['temperature'], passFail: 'failed' } },
  { id: 'open_maintenance', label: 'Open Maintenance', filters: { types: ['maintenance'], openClosed: 'open' } },
  { id: 'incidents', label: 'Incidents', filters: { types: ['incident'] } },
  { id: 'employee_logs', label: 'Employee Logs', filters: { types: ['employee'] } },
  { id: 'today', label: 'Today', filters: { datePreset: 'today' } },
  { id: 'assigned_to_me', label: 'My Assigned', filters: { assignedToMe: true } },
  { id: 'manager_only', label: 'Manager Only', filters: { visibility: 'manager_only' } },
];

export default function LogsTopFilterBar({ search, onSearchChange, filters, onFiltersChange, onShowAdvanced }) {
  const [activeView, setActiveView] = useState('all');

  const handleViewClick = (viewId) => {
    const view = SAVED_VIEWS.find(v => v.id === viewId);
    if (view) {
      setActiveView(viewId);
      onFiltersChange(view.filters);
    }
  };

  const activeFilterCount = (() => {
    let n = 0;
    if (filters.types?.length) n++;
    if (filters.statuses?.length) n++;
    if (filters.datePreset || filters.dateFrom || filters.dateTo) n++;
    if (filters.requiresReview) n++;
    if (filters.hasPhoto) n++;
    if (filters.assignedToMe) n++;
    if (filters.openClosed) n++;
    if (filters.passFail) n++;
    return n;
  })();

  return (
    <div className="bg-card/50 border-b border-border/40 sticky top-14 sm:top-16 z-10">
      {/* Search + Quick Filters Row */}
      <div className="px-4 sm:px-6 py-3 flex gap-2 items-center border-b border-border/20">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs, equipment, notes…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full h-8 pl-9 pr-8 bg-background border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none"
          />
          {search && (
            <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Dropdowns */}
        <select
          value={filters.types?.[0] || ''}
          onChange={e => onFiltersChange({ ...filters, types: e.target.value ? [e.target.value] : [] })}
          className="h-8 px-2 text-xs font-bold bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none">
          <option value="">All Types</option>
          <option value="temperature">Temperature</option>
          <option value="waste">Waste</option>
          <option value="incident">Incident</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="maintenance">Maintenance</option>
          <option value="cleaning">Cleaning</option>
          <option value="eighty_six">86 Item</option>
        </select>

        <select
          value={filters.statuses?.[0] || ''}
          onChange={e => onFiltersChange({ ...filters, statuses: e.target.value ? [e.target.value] : [] })}
          className="h-8 px-2 text-xs font-bold bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="needs_review">Needs Review</option>
          <option value="flagged">Flagged</option>
        </select>

        <select
          value={filters.datePreset || ''}
          onChange={e => onFiltersChange({ ...filters, datePreset: e.target.value })}
          className="h-8 px-2 text-xs font-bold bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none">
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="last_7">Last 7 Days</option>
          <option value="this_month">This Month</option>
        </select>

        <button
          onClick={onShowAdvanced}
          className={cn(
            'h-8 px-2.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all',
            activeFilterCount > 0
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-background border-border text-muted-foreground hover:bg-muted'
          )}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {activeFilterCount > 0 && (
            <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Saved Views Row */}
      <div className="px-4 sm:px-6 py-2.5 overflow-x-auto no-scrollbar flex gap-1.5 items-center border-t border-border/20">
        {SAVED_VIEWS.map(view => (
          <button
            key={view.id}
            onClick={() => handleViewClick(view.id)}
            className={cn(
              'flex-shrink-0 h-7 px-3 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap',
              activeView === view.id
                ? 'bg-primary/25 text-primary border-primary/50 shadow-sm'
                : 'bg-card border-border/40 text-muted-foreground hover:border-border/60 hover:bg-muted/20'
            )}>
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}