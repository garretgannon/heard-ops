import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'prep', label: 'Prep' },
  { id: 'temperature', label: 'Temps' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'employee', label: 'Employees' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'waste', label: 'Inventory' },
];

export default function ApprovalFilters({ currentFilter, onFilterChange }) {
  return (
    <div className="overflow-x-auto pb-1 pt-4 pl-1">
      <div className="flex gap-1.5">
        {FILTERS.map(filter => (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            layout
            className={cn(
              'flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
              currentFilter === filter.id
                ? 'glow-active'
                : 'card-glass border border-border/40 text-muted-foreground glow-interactive'
            )}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
