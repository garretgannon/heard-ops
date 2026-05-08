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
    <div className="px-4 py-3 border-b border-border/20 overflow-x-auto">
      <div className="flex gap-1.5 pb-1 no-scrollbar">
        {FILTERS.map(filter => (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            layout
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0',
              currentFilter === filter.id
                ? 'bg-primary text-white'
                : 'bg-muted border border-border/30 text-muted-foreground hover:bg-secondary'
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