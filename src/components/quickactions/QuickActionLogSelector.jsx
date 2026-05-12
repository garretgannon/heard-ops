import { X } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const LOG_CATEGORIES = [
  { id: 'temperature', label: 'Temperature', icon: '🌡️', description: 'Temperature check' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧', description: 'Equipment issue' },
  { id: 'incident', label: 'Incident', icon: '⚠️', description: 'Safety or guest issue' },
  { id: 'waste', label: 'Waste / 86', icon: '🗑️', description: 'Item discarded or unavailable' },
  { id: 'employee_note', label: 'Employee Note', icon: '👥', description: 'Coaching or praise' },
  { id: 'manager_note', label: 'Manager Note', icon: '📝', description: 'Notes for team' },
  { id: 'bathroom', label: 'Bathroom Check', icon: '🚻', description: 'Restroom inspection' },
  { id: 'custom', label: 'Custom', icon: '✏️', description: 'Other log type' },
];

export default function QuickActionLogSelector({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full lg:max-w-lg card-glass border border-border rounded-t-2xl lg:rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/30 shrink-0">
          <h2 className="text-lg font-bold text-foreground">What would you like to log?</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
          {LOG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                haptics.light();
                onSelect(cat.id);
              }}
              className="p-3 rounded-lg border border-border/40 card-glass hover:bg-secondary/30 active:scale-95 transition-all text-left"
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <h3 className="text-sm font-bold text-foreground">{cat.label}</h3>
              <p className="text-xs text-muted-foreground">{cat.description}</p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/30">
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
