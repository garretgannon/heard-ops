import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { Zap, Clock, Flame, Users, MoreHorizontal } from 'lucide-react';
import { useRoleVisibility } from '@/hooks/useRoleVisibility';

const MOBILE_NAV_ROUTES = [
  { label: 'Today', path: '/', icon: Zap },
  { label: 'Shift', path: '/shift', icon: Clock },
  { label: 'Logs', path: '/logs', icon: Flame },
  { label: 'Team', path: '/team', icon: Users },
  { label: 'More', path: '/more', icon: MoreHorizontal },
];

export default function GlobalBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { canSee } = useRoleVisibility();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border safe-area-inset-bottom" style={{ background: 'rgba(11,15,20,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="flex h-20 items-stretch justify-around px-2">
        {MOBILE_NAV_ROUTES.filter(route => {
          if (route.path === '/' && !canSee('today_tab')) return false;
          if (route.path === '/shift' && !canSee('shift_tab')) return false;
          if (route.path === '/logs' && !canSee('logs_tab')) return false;
          if (route.path === '/team' && !canSee('team_tab')) return false;
          if (route.path === '/more' && !canSee('more_tab')) return false;
          return true;
        }).map(({ label, path, icon: Icon }) => {
          const isActive = pathname === path;
          return (
            <button
              key={path}
              onClick={() => { haptics.light(); navigate(path); }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 flex-1 relative text-xs font-medium transition-all duration-200 active:scale-95",
                isActive && "text-primary"
              )}
            >
              {/* Active indicator — top pill */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors duration-80 stroke-[1.5]",
                  isActive ? "text-primary" : "text-muted-foreground"
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}