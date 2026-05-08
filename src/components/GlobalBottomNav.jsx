import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Home, Activity, FileText, Users, MoreHorizontal, Zap } from 'lucide-react';
import NavItem from '@/components/nav/NavItem';

const NAV_CONFIG = {
  admin: [
    { label: 'Today', path: '/', icon: Home, id: 'today' },
    { label: 'Pulse', path: '/pulse', icon: Activity, id: 'pulse' },
    { label: 'Logs', path: '/logs', icon: FileText, id: 'logs' },
    { label: 'Team', path: '/team', icon: Users, id: 'team' },
    { label: 'More', path: '/more', icon: MoreHorizontal, id: 'more' },
  ],
  manager: [
    { label: 'Today', path: '/', icon: Home, id: 'today' },
    { label: 'Pulse', path: '/pulse', icon: Activity, id: 'pulse' },
    { label: 'Logs', path: '/logs', icon: FileText, id: 'logs' },
    { label: 'Team', path: '/team', icon: Users, id: 'team' },
    { label: 'More', path: '/more', icon: MoreHorizontal, id: 'more' },
  ],
  cook: [
    { label: 'Today', path: '/', icon: Home, id: 'today' },
    { label: 'Shift', path: '/shift', icon: Zap, id: 'shift' },
    { label: 'Prep', path: '/?tab=prep', icon: FileText, id: 'prep' },
    { label: 'Logs', path: '/logs', icon: Activity, id: 'logs' },
    { label: 'More', path: '/more', icon: MoreHorizontal, id: 'more' },
  ],
};

export default function GlobalBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!isMobile || !user) return null;

  // Determine role-based navigation
  let navConfig = NAV_CONFIG.cook; // default
  if (isAdmin) {
    navConfig = NAV_CONFIG.admin;
  } else if (['manager', 'lead', 'supervisor'].includes(user?.role)) {
    navConfig = NAV_CONFIG.manager;
  }

  // Determine active route
  const getActiveId = () => {
    if (pathname === '/' || pathname.startsWith('/?')) return 'today';
    if (pathname.startsWith('/pulse')) return 'pulse';
    if (pathname.startsWith('/logs')) return 'logs';
    if (pathname.startsWith('/team')) return 'team';
    if (pathname.startsWith('/more')) return 'more';
    if (pathname.startsWith('/shift')) return 'shift';
    if (pathname.startsWith('/prep')) return 'prep';

    return 'today';
  };

  const activeId = getActiveId();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[999] flex justify-center items-end pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Premium Floating Dock Container */}
      <div
        className="pointer-events-auto mb-5 mx-4 px-3 py-3 rounded-2xl border border-border/20 shadow-2xl flex justify-center items-center gap-2"
        style={{
          width: 'calc(100% - 2rem)',
          maxWidth: '100%',
          background: 'rgba(11, 15, 20, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {navConfig.map(({ label, path, icon, id }) => {
          const isActive = activeId === id;
          return (
            <NavItem
              key={id}
              icon={icon}
              label={label}
              isActive={isActive}
              onClick={() => navigate(path)}
            />
          );
        })}
      </div>
    </nav>
  );
}