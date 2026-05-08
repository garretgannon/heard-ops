import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle } from 'lucide-react';

const ROLE_COLORS = {
  manager:      { bg: 'bg-blue-500/25',   border: 'border-l-blue-400',    text: 'text-blue-200',    dot: 'bg-blue-400' },
  server:       { bg: 'bg-pink-500/25',    border: 'border-l-pink-400',    text: 'text-pink-200',    dot: 'bg-pink-400' },
  bartender:    { bg: 'bg-purple-500/25',  border: 'border-l-purple-400',  text: 'text-purple-200',  dot: 'bg-purple-400' },
  cook:         { bg: 'bg-orange-500/25',  border: 'border-l-orange-400',  text: 'text-orange-200',  dot: 'bg-orange-400' },
  'line cook':  { bg: 'bg-orange-500/25',  border: 'border-l-orange-400',  text: 'text-orange-200',  dot: 'bg-orange-400' },
  'prep cook':  { bg: 'bg-yellow-500/25',  border: 'border-l-yellow-400',  text: 'text-yellow-200',  dot: 'bg-yellow-400' },
  prep:         { bg: 'bg-yellow-500/25',  border: 'border-l-yellow-400',  text: 'text-yellow-200',  dot: 'bg-yellow-400' },
  dishwasher:   { bg: 'bg-slate-500/25',   border: 'border-l-slate-400',   text: 'text-slate-200',   dot: 'bg-slate-400' },
  dish:         { bg: 'bg-slate-500/25',   border: 'border-l-slate-400',   text: 'text-slate-200',   dot: 'bg-slate-400' },
  host:         { bg: 'bg-teal-500/25',    border: 'border-l-teal-400',    text: 'text-teal-200',    dot: 'bg-teal-400' },
  busser:       { bg: 'bg-cyan-500/25',    border: 'border-l-cyan-400',    text: 'text-cyan-200',    dot: 'bg-cyan-400' },
  'food runner':{ bg: 'bg-lime-500/25',    border: 'border-l-lime-400',    text: 'text-lime-200',    dot: 'bg-lime-400' },
  'sous chef':  { bg: 'bg-red-500/25',     border: 'border-l-red-400',     text: 'text-red-200',     dot: 'bg-red-400' },
};
const DEFAULT_COLOR = { bg: 'bg-primary/20', border: 'border-l-primary', text: 'text-primary/80', dot: 'bg-primary' };

const STATUS_DOT = {
  published: 'bg-green-400',
  draft: 'bg-amber-400',
  needs_review: 'bg-red-400',
};

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'p' : 'a';
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`;
}

export default function ShiftBlock({ shift, isSelected, onSelect, onMultiSelect, onContextMenu, isDragging, conflicts }) {
  const role = (shift.role || '').toLowerCase();
  const colors = ROLE_COLORS[role] || DEFAULT_COLOR;
  const startFmt = fmtTime(shift.start_time);
  const endFmt = fmtTime(shift.end_time);
  const hasConflicts = conflicts && conflicts.length > 0;
  const hasError = conflicts?.some(c => c.type === 'error');

  return (
    <div
      role="button"
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) onMultiSelect?.();
        else onSelect?.();
      }}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e); }}
      className={cn(
        'relative group w-full text-left rounded-md border-l-[3px] px-2 py-1.5 cursor-pointer select-none transition-all duration-100',
        colors.bg, colors.border,
        isSelected && 'ring-1 ring-white/60 ring-offset-1 ring-offset-transparent brightness-125',
        isDragging && 'opacity-50 scale-95 rotate-1',
        hasError && 'ring-1 ring-red-500/60',
        'hover:brightness-110 active:scale-[0.97]'
      )}
    >
      {/* Status dot */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
        {hasConflicts && (
          hasError
            ? <AlertCircle className="h-2.5 w-2.5 text-red-400" />
            : <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
        )}
        <div className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[shift.status] || STATUS_DOT.draft)} />
      </div>

      {/* Time */}
      {(startFmt || endFmt) && (
        <p className="text-[11px] font-bold text-foreground leading-tight pr-5">
          {startFmt}{startFmt && endFmt ? '–' : ''}{endFmt}
        </p>
      )}

      {/* Role */}
      <p className={cn('text-[10px] font-semibold mt-0.5 capitalize truncate pr-5', colors.text)}>
        {shift.role || '—'}
      </p>

      {/* Station if set */}
      {shift.station && (
        <p className="text-[9px] text-muted-foreground truncate mt-0.5">{shift.station}</p>
      )}
    </div>
  );
}