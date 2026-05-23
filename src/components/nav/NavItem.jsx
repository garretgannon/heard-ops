import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavItem({ icon: Icon = Home, label, isActive, isAdd, onClick }) {
  if (isAdd) {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className="relative -mt-9 flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90"
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-white"
          style={{
            background: 'linear-gradient(145deg, #FF8A30 0%, #FF6B00 55%, #CC4400 100%)',
            boxShadow: '0 0 24px rgba(255,107,0,0.55), 0 0 6px rgba(255,107,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,140,60,0.5)',
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={2.4} />
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
          style={undefined}
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
