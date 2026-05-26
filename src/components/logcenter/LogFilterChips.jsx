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
    <div className="sticky top-12 z-10 w-full bg-background border-b border-border/20 overflow-x-auto no-scrollbar">
      <div className="px-4 lg:px-8 py-2">
        <div className="pill-slider-container">
          {FILTER_OPTIONS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { haptics.light?.(); onFilterChange?.(id); }}
              className={cn(
                'glass-pill transition-all active:scale-95',
                activeFilter === id && 'glow-active'
              )}
            >
              <span className="text-sm">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}