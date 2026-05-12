import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavItem({ icon: Icon = Home, label, isActive, isAdd, onClick }) {
  if (isAdd) {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className="relative -mt-8 flex flex-1 flex-col items-center justify-center gap-1 rounded-full transition-all duration-200 active:scale-95"
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/45 text-primary-foreground"
          style={{
            background: 'linear-gradient(180deg, rgba(230, 106, 31, 0.82), rgba(154, 61, 16, 0.9))',
            boxShadow: '0 0 0 6px rgba(230, 106, 31, 0.055), 0 0 18px rgba(230, 106, 31, 0.38), inset 0 1px 2px rgba(255,255,255,0.18)',
          }}
        >
          <Icon className="h-7 w-7" strokeWidth={2.2} />
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-1 h-full flex-col items-center justify-center gap-[5px] rounded-lg px-1 transition-all duration-200 active:scale-95',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground/70'
      )}
    >
      <div className="relative">
        <Icon
          className={cn('h-6 w-6 transition-all duration-200', isActive ? 'text-primary' : 'text-muted-foreground')}
          strokeWidth={isActive ? 2.2 : 1.75}
          style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(230, 106, 31, 0.55))' } : undefined}
        />
        {isActive && (
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 nav-active-dot"
            aria-hidden
          />
        )}
      </div>
      <span className={cn('text-[10px] font-semibold leading-none transition-colors duration-200', isActive ? 'text-primary' : 'text-muted-foreground')}>
        {label}
      </span>
    </button>
  );
}
