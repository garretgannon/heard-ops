import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

// Status config extracted from design source
const STATUS = {
  on_shift:        { label: 'ON SHIFT',  dot: true,  muted: false },
  off_shift:       { label: 'OFF',       dot: false, muted: true  },
  on_break:        { label: 'BREAK',     dot: false, muted: true, icon: 'local_cafe' },
  scheduled_later: { label: 'LATER',     dot: false, muted: true  },
};

export default function EmployeeCard({ employee, linkedRecords = {}, onSelect }) {
  const initials = (employee.full_name || '?')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const shiftStatus = employee.shiftStatus || 'off_shift';
  const cfg = STATUS[shiftStatus] || STATUS.off_shift;
  const isOnShift = shiftStatus === 'on_shift';

  return (
    <div
      onClick={() => { haptics.light?.(); onSelect?.(employee.id); }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect?.(employee.id)}
      className="relative overflow-hidden flex items-center gap-4 p-4 cursor-pointer transition-colors active:scale-[0.99] select-none"
      style={{
        background: 'rgba(28, 28, 30, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
      }}
    >
      {/* Orange left-edge accent — ON SHIFT only */}
      {isOnShift && (
        <div
          className="absolute top-0 left-0 w-1 h-full bg-[#FF6B00]"
          style={{ boxShadow: '0 0 10px rgba(255,107,0,0.5)' }}
        />
      )}

      {/* Avatar */}
      <div className={cn(
        'w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center',
        cfg.muted && 'grayscale opacity-60'
      )}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {employee.profile_photo_url ? (
          <img
            src={employee.profile_photo_url}
            alt={employee.full_name || 'Employee'}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-white/60">{initials}</span>
        )}
      </div>

      {/* Name + Role */}
      <div className="flex-grow min-w-0">
        <div className={cn(
          'text-[20px] font-bold leading-[1.2] tracking-[-0.01em] truncate text-white',
          cfg.muted && 'opacity-50'
        )}>
          {employee.full_name}
        </div>
        <div className={cn(
          'text-[13px] font-medium leading-[1.5] tracking-[0.02em] text-white/40 truncate mt-0.5',
          cfg.muted && 'opacity-60'
        )}>
          {employee.primary_role || 'Staff'}
        </div>
      </div>

      {/* Status pill */}
      <div className="flex-shrink-0">
        <div
          className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: cfg.muted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
          }}
        >
          {cfg.dot && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse flex-shrink-0" />
          )}
          {cfg.icon && (
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cfg.icon}</span>
          )}
          {cfg.label}
        </div>
      </div>
    </div>
  );
}
