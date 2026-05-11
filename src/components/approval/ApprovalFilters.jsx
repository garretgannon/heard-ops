import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'urgent', label: 'Urgent', icon: '⚡' },
  { id: 'prep', label: 'Prep', icon: '🔪' },
  { id: 'temperature', label: 'Temps', icon: '🌡️' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'employee', label: 'Employees', icon: '👤' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'waste', label: 'Inventory', icon: '📦' },
];

export default function ApprovalFilters({ currentFilter, onFilterChange }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-2 no-scrollbar">
        {FILTERS.map(filter => (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            layout
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
              currentFilter === filter.id
                ? 'glow-active'
                : 'border border-border/40 bg-black/25 text-muted-foreground glow-interactive'
            )}
          >
            <span className="text-sm">{filter.icon}</span>
            {filter.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
