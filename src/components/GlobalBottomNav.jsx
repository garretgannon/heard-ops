import { useLocation, Link } from 'react-router-dom';
import { Home, ClipboardList, Gauge, Thermometer, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Today', path: '/', icon: Home },
  { label: 'Prep', path: '/prep', icon: ClipboardList },
  { label: 'Overview', path: '/overview', icon: Gauge },
  { label: 'Temps', path: '/temps', icon: Thermometer },
  { label: 'More', path: '/more', icon: MoreHorizontal },
];

export default function GlobalBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border safe-area-inset-bottom">
      <div className="flex h-20 max-w-md mx-auto">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 relative text-xs font-medium transition-colors"
            >
              {/* Top indicator pill */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-6 bg-primary rounded-full" />
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive
                    ? 'text-primary stroke-[2]'
                    : 'text-muted-foreground stroke-[1.5]'
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  'text-[11px] font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}