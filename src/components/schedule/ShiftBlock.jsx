import { cn } from '@/lib/utils';

const ROLE_COLORS = {
  manager:    { bg: 'bg-blue-500/20',   border: 'border-l-blue-500',   text: 'text-blue-300' },
  server:     { bg: 'bg-pink-500/20',   border: 'border-l-pink-400',   text: 'text-pink-300' },
  bartender:  { bg: 'bg-purple-500/20', border: 'border-l-purple-500', text: 'text-purple-300' },
  cook:       { bg: 'bg-orange-500/20', border: 'border-l-orange-500', text: 'text-orange-300' },
  'line cook': { bg: 'bg-orange-500/20', border: 'border-l-orange-500', text: 'text-orange-300' },
  prep:       { bg: 'bg-yellow-500/20', border: 'border-l-yellow-500', text: 'text-yellow-300' },
  dish:       { bg: 'bg-slate-500/20',  border: 'border-l-slate-400',  text: 'text-slate-300' },
  dishwasher: { bg: 'bg-slate-500/20',  border: 'border-l-slate-400',  text: 'text-slate-300' },
  host:       { bg: 'bg-teal-500/20',   border: 'border-l-teal-500',   text: 'text-teal-300' },
  busser:     { bg: 'bg-cyan-500/20',   border: 'border-l-cyan-500',   text: 'text-cyan-300' },
};

const DEFAULT_COLOR = { bg: 'bg-primary/15', border: 'border-l-primary', text: 'text-primary' };

export default function ShiftBlock({ shift, employee, isSelected, onSelect, onMultiSelect, isDragging }) {
  const role = (shift.role || '').toLowerCase();
  const colors = ROLE_COLORS[role] || DEFAULT_COLOR;

  const fmt = (t) => {
    if (!t) return '';
    // Handle "09:00" → "9:00 AM"
    const [h, m] = t.split(':').map(Number);
    if (!isNaN(h)) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${String(m || 0).padStart(2, '0')} ${ampm}`;
    }
    return t;
  };

  const startDisplay = fmt(shift.start_time) || shift.startTime || '';
  const endDisplay = fmt(shift.end_time) || shift.endTime || '';
  const timeRange = startDisplay && endDisplay ? `${startDisplay} – ${endDisplay}` : startDisplay || '—';

  return (
    <button
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) onMultiSelect?.();
        else onSelect?.();
      }}
      className={cn(
        'w-full text-left rounded-md border-l-[3px] px-2 py-1.5 transition-all',
        colors.bg,
        colors.border,
        isSelected && 'ring-1 ring-primary ring-offset-1 ring-offset-background',
        isDragging && 'opacity-60 scale-95',
        'hover:brightness-110 active:scale-[0.98]'
      )}
    >
      <p className="text-[11px] font-bold text-foreground leading-tight truncate">{timeRange}</p>
      <p className={cn('text-[10px] font-semibold mt-0.5 capitalize truncate', colors.text)}>
        {shift.role || shift.station || ''}
      </p>
    </button>
  );
}