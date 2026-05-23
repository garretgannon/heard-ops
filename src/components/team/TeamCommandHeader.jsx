import { Plus, Search } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function TeamCommandHeader({ onSearch, onAddEmployee, searchQuery, canAdd, employeeCount }) {
  return (
    <div className="px-5 pt-6 pb-4 flex flex-col gap-5">
      {/* Page title row */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 style={{
            fontSize: '40px',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.95)',
          }}>
            Team
          </h1>
          {employeeCount != null && (
            <p style={{
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '4px',
            }}>
              {employeeCount} member{employeeCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {canAdd && (
          <button
            onClick={() => { haptics.light?.(); onAddEmployee?.(); }}
            className="flex items-center gap-2 active:scale-95 transition-all flex-shrink-0"
            style={{
              height: '44px',
              paddingLeft: '20px',
              paddingRight: '20px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            <Plus style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
            Add Member
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.3)' }} />
        <input
          type="text"
          placeholder="Name, role, department..."
          value={searchQuery}
          onChange={e => onSearch?.(e.target.value)}
          style={{
            width: '100%',
            height: '44px',
            paddingLeft: '40px',
            paddingRight: '16px',
            borderRadius: '14px',
            background: 'rgba(28, 28, 30, 0.6)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}
