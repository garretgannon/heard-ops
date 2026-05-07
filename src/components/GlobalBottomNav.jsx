import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { haptics } from '@/utils/haptics';
import { Home, Clock, FileText, Users, MoreHorizontal } from 'lucide-react';

const MOBILE_NAV_ROUTES = [
  { label: 'Today', path: '/', icon: Home, id: 'today' },
  { label: 'Shift', path: '/shift', icon: Clock, id: 'shift' },
  { label: 'Logs', path: '/logs', icon: FileText, id: 'logs' },
  { label: 'Team', path: '/team', icon: Users, id: 'team' },
  { label: 'More', path: '/more', icon: MoreHorizontal, id: 'more' },
];

export default function GlobalBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!isMobile) return null;

  // Determine active route
  const getActiveId = () => {
    if (pathname === '/' || pathname === '/today') return 'today';
    if (pathname.startsWith('/shift') || pathname.startsWith('/prep') || pathname.startsWith('/side-work')) return 'shift';
    if (pathname.startsWith('/logs')) return 'logs';
    if (pathname.startsWith('/team')) return 'team';
    if (pathname.startsWith('/more')) return 'more';
    return 'today';
  };

  const activeId = getActiveId();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-end pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Floating Pill Container */}
      <div className="pointer-events-auto mb-4 mx-4 px-2 py-2 rounded-full shadow-lg border border-border/30" style={{
        width: 'calc(100% - 2rem)',
        maxWidth: '100%',
        background: 'rgba(18, 24, 33, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div className="flex justify-around items-center gap-1">
          {MOBILE_NAV_ROUTES.map(({ label, path, icon: Icon, id }) => {
            const isActive = activeId === id;
            return (
              <button
                key={id}
                onClick={() => {
                  haptics.light?.();
                  navigate(path);
                }}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 rounded-full transition-all duration-200 active:scale-95"
                style={{
                  background: isActive ? 'hsl(24, 78%, 51%)' : 'transparent',
                  color: isActive ? 'white' : 'hsl(215, 16%, 65%)',
                }}
              >
                <Icon className="h-5 w-5 transition-colors duration-200" strokeWidth={1.5} />
                <span className="text-[10px] font-bold leading-none mt-0.5">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}