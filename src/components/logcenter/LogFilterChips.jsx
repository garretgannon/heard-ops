import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'temperature', label: 'Temperature', icon: '🌡️' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { id: 'incident', label: 'Incidents', icon: '⚠️' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'waste', label: 'Waste / 86', icon: '🗑️' },
  { id: 'employee_note', label: 'Employee Notes', icon: '👤' },
  { id: 'shift_handoff', label: 'Handoffs', icon: '🔄' },
  { id: 'equipment', label: 'Equipment', icon: '⚙️' },
  { id: 'guest_issue', label: 'Guest Issues', icon: '👥' },
];

export default function LogFilterChips({ activeFilter, onFilterChange }) {
  return (
    <div className="px-4 lg:px-8 py-4 border-b border-border/20 overflow-x-auto">
      <div className="flex gap-2 min-w-max lg:flex-wrap">
        {FILTER_OPTIONS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => { haptics.light?.(); onFilterChange?.(id); }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold text-xs whitespace-nowrap transition-all active:scale-95',
              activeFilter === id
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border/40 bg-card text-muted-foreground hover:border-border/60'
            )}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}