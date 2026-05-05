import { useLocation, Link } from 'react-router-dom';
import { Home, CheckSquare, FileText, BookOpen, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Today', path: '/', icon: Home },
  { label: 'Tasks', path: '/today', icon: CheckSquare },
  { label: 'Logs', path: '/logs', icon: FileText },
  { label: 'Knowledge', path: '/knowledge', icon: BookOpen },
  { label: 'More', path: '/more', icon: MoreHorizontal },
];

export default function GlobalBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex h-20 items-stretch justify-around px-2">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 flex-1 relative text-xs font-medium transition-all duration-200",
                isActive && "text-primary"
              )}
            >
              {/* Glow underline */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full shadow-glow" />
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200 stroke-[1.5]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors duration-200 whitespace-nowrap",
                  isActive ? "text-primary" : "text-muted-foreground"
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