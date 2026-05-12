import { Phone, Mail, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const SHIFT_STATUS_CONFIG = {
  'on_shift': { label: 'On Shift', color: 'bg-green-500/15 text-green-400', icon: '🟢' },
  'off_shift': { label: 'Off', color: 'bg-slate-500/15 text-slate-400', icon: '⚫' },
  'on_break': { label: 'On Break', color: 'bg-yellow-500/15 text-yellow-400', icon: '🟡' },
  'scheduled_later': { label: 'Scheduled Later', color: 'bg-blue-500/15 text-blue-400', icon: '🔵' },
};

export default function EmployeeCard({ employee, onSelect, canContact, canManage }) {
  const initials = employee.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  const shiftStatus = employee.shiftStatus || 'off_shift';
  const statusConfig = SHIFT_STATUS_CONFIG[shiftStatus];

  return (
    <div
      onClick={() => { haptics.light?.(); onSelect?.(employee.id); }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect?.(employee.id)}
      className="w-full text-left p-4 rounded-xl border border-border/40 card-glass hover:border-border/60 transition-all active:scale-95 cursor-pointer"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-lg bg-primary/20 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate">{employee.full_name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{employee.primary_role || 'Staff'}</p>
          </div>

          {/* Status Badge */}
          <div className={cn('px-2 py-1 rounded-lg text-[10px] font-bold flex-shrink-0', statusConfig.color)}>
            {statusConfig.icon}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {employee.job_code && <span>{employee.job_code}</span>}
          {employee.department && (
            <>
              <span>•</span>
              <span>{employee.department}</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {(canContact || canManage) && (
          <div className="flex gap-2 pt-2 border-t border-border/20">
            {canContact && employee.phone && (
              <a href={`tel:${employee.phone}`} onClick={e => e.stopPropagation()} className="flex-1 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-all active:scale-95 flex items-center justify-center gap-1">
                <Phone className="h-3 w-3" />
                Call
              </a>
            )}
            {canContact && employee.email && (
              <a href={`mailto:${employee.email}`} onClick={e => e.stopPropagation()} className="flex-1 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-all active:scale-95 flex items-center justify-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </a>
            )}
            {canManage && (
              <button onClick={e => { e.stopPropagation(); onSelect?.(employee.id); }} className="flex-1 h-8 rounded-lg border border-border/40 text-muted-foreground font-semibold text-xs hover:bg-secondary transition-all active:scale-95">
                Manage
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}