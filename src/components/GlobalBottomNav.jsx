import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { bottomNavRoutes } from '@/lib/routeConfig';

export default function GlobalBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex h-20 items-stretch justify-around px-2">
        {bottomNavRoutes.map(({ label, path, icon: Icon }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => haptics.light()}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 flex-1 relative text-xs font-medium transition-all duration-200 active:scale-95 animate-tab-switch",
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
                  "h-5 w-5 transition-colors duration-80 stroke-[1.5]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors duration-80 whitespace-nowrap",
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