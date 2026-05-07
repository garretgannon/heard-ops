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
{ id: 'manager_only', label: 'Manager Only', filters: { visibility: 'manager_only' } }];


export default function LogsTopFilterBar({ search, onSearchChange, filters, onFiltersChange, onShowAdvanced }) {
  const [activeView, setActiveView] = useState('all');

  const handleViewClick = (viewId) => {
    const view = SAVED_VIEWS.find((v) => v.id === viewId);
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
      







































































      

      {/* Saved Views Row */}
      <div className="px-4 sm:px-6 py-2 overflow-x-auto scrollbar-hide flex gap-1 items-center border-t border-border/20" style={{ overscrollBehavior: 'contain' }}>
        {SAVED_VIEWS.map((view) =>
        <button
          key={view.id}
          onClick={() => handleViewClick(view.id)}
          className={cn(
            'flex-shrink-0 h-6 px-2.5 rounded-full text-[9px] font-bold border transition-all whitespace-nowrap',
            activeView === view.id ?
            'bg-primary/25 text-primary border-primary/50 shadow-sm' :
            'bg-card border-border/40 text-muted-foreground hover:border-border/60 hover:bg-muted/20'
          )}>
            {view.label}
          </button>
        )}
      </div>
    </div>);

}