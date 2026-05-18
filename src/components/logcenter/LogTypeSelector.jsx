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
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full lg:max-w-2xl lg:mx-4 max-h-[85vh] overflow-hidden flex flex-col" style={{ background: '#0b1118', borderRadius: '20px 20px 0 0' }} >
        {/* Handle bar (mobile only) */}
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="border-b border-border/20 px-5 py-3 flex items-center justify-between">
          <h2 className="text-[15px] font-black text-foreground">Select Log Type</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-white/[0.06] border border-border/30"
          >
            <X className="h-3.5 w-3.5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-2.5">
            {LOG_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  onSelect?.(type.id);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-border/30 text-left active:scale-95 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-bold text-[13px] text-foreground leading-tight">{type.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}