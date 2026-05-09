import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Home, Activity, FileText, Users, MoreHorizontal, Zap } from 'lucide-react';
import NavItem from '@/components/nav/NavItem';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

const ALL_NAV = [
  { label: 'Today',    path: '/',      icon: Home,            id: 'today',    perm: PERMISSIONS.VIEW_DASHBOARD },
  { label: 'Pulse',    path: '/pulse', icon: Activity,        id: 'pulse',    perm: PERMISSIONS.VIEW_PULSE },
  { label: 'Logs',     path: '/logs',  icon: FileText,        id: 'logs',     perm: PERMISSIONS.VIEW_LOGS },
  { label: 'Team',     path: '/team',  icon: Users,           id: 'team',     perm: PERMISSIONS.VIEW_TEAM },
  { label: 'More',     path: '/more',  icon: MoreHorizontal,  id: 'more',     perm: null },
];

export default function GlobalBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { can } = usePermissions();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  if (!isMobile || !user) return null;

  const navConfig = ALL_NAV.filter(item => !item.perm || can(item.perm)).slice(0, 5);

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
      {/* Premium Floating Glass Dock */}
      <div
        className="pointer-events-auto mb-5 mx-4 px-2 py-3 rounded-3xl border flex justify-center items-center gap-1 transition-all duration-300"
        style={{
          width: 'calc(100% - 2rem)',
          maxWidth: '100%',
          background: 'rgba(11, 15, 20, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'rgba(230, 106, 31, 0.15)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(230, 106, 31, 0.1)',
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