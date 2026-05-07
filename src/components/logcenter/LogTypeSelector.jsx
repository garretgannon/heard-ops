import { X } from 'lucide-react';

const LOG_TYPES = [
  { id: 'temperature', label: 'Temperature Log', icon: '🌡️' },
  { id: 'cleaning', label: 'Cleaning Log', icon: '🧹' },
  { id: 'maintenance', label: 'Maintenance Request', icon: '🔧' },
  { id: 'incident', label: 'Incident Report', icon: '⚠️' },
  { id: 'waste', label: 'Waste / 86 Item', icon: '🗑️' },
  { id: 'employee_note', label: 'Employee Note', icon: '👤' },
  { id: 'manager_note', label: 'Manager Note', icon: '📝' },
  { id: 'shift_handoff', label: 'Shift Handoff', icon: '🔄' },
  { id: 'prep', label: 'Prep Log', icon: '👨‍🍳' },
  { id: 'sidework', label: 'Side Work Log', icon: '🧹' },
];

export default function LogTypeSelector({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Select Log Type</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {LOG_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  onSelect?.(type.id);
                  onClose();
                }}
                className="p-4 rounded-lg border border-border/40 bg-background hover:border-primary hover:bg-primary/5 transition-all active:scale-95 text-left"
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-semibold text-sm text-foreground">{type.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}