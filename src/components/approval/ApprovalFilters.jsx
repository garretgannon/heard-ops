import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'timeoff', label: 'Staffing' },
  { id: 'prep', label: 'Prep' },
  { id: 'temperature', label: 'Temps' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'financial', label: 'Financial' },
];

export default function ApprovalFilters({ currentFilter, onFilterChange }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-1">
      <div className="pill-slider-container">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => { haptics.light?.(); onFilterChange(filter.id); }}
            className={cn(
              'glass-pill transition-all active:scale-95',
              currentFilter === filter.id && 'glow-active'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
