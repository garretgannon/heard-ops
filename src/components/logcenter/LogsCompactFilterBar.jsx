import { Search, SlidersHorizontal } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'needs_review', label: 'Needs Review' },
  { id: 'open', label: 'Open' },
  { id: 'temperature', label: 'Temps' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'incident', label: 'Incidents' },
  { id: 'prep', label: 'Prep' },
  { id: 'cleaning', label: 'Cleaning' },
];

export default function LogsCompactFilterBar({ search, onSearch, activeFilter, onFilterChange, onShowAdvanced }) {
  return (
    <div className="w-full bg-background border-b border-border/20 overflow-x-hidden">
      {/* Search + Filter Button Row - Sticky */}
      <div className="sticky top-12 z-10 bg-background px-4 py-2 flex gap-2 items-center w-full box-border">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none flex-shrink-0" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-3 rounded-lg bg-card border border-border/40 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 box-border"
          />
        </div>
        <button
          onClick={() => { haptics.light?.(); onShowAdvanced(); }}
          className="h-11 w-11 flex-shrink-0 rounded-lg bg-card border border-border/40 text-muted-foreground flex items-center justify-center active:scale-95 transition-all hover:bg-muted/20 hover:border-border/60"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Filter Chips - Internal Scroll Only */}
      <div className="px-4 py-2 overflow-x-auto overflow-y-hidden scrollbar-hide w-full box-border" style={{ overscrollBehavior: 'contain' }}>
        <div className="flex gap-2 w-max">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => { haptics.light?.(); onFilterChange(filter.id); }}
              className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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
    </div>
  );
}