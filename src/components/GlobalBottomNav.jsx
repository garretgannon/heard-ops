import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Home, CalendarDays, Plus, Map, MoreHorizontal } from 'lucide-react';
import NavItem from '@/components/nav/NavItem';
import QuickAddSheet from '@/components/QuickAddSheet';
import QuickActionModal from '@/components/quickactions/QuickActionModal';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

const ALL_NAV = [
  { label: 'Dashboard', path: '/app/overview', icon: Home, id: 'today', perm: PERMISSIONS.VIEW_DASHBOARD },
  { label: 'Schedule', path: '/schedule', icon: CalendarDays, id: 'schedule', perm: PERMISSIONS.VIEW_SCHEDULE },
  { label: 'Add', path: '/logs', icon: Plus, id: 'add', perm: PERMISSIONS.VIEW_LOGS, isAdd: true },
  { label: 'Stations', path: '/operational-map', icon: Map, id: 'stations', perm: null },
  { label: 'More', path: '/more', icon: MoreHorizontal, id: 'more', perm: null },
];

export default function GlobalBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState(null);
  const { user, isAdmin } = useCurrentUser();
  const { can } = usePermissions();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMobile || !user) return null;

  const navConfig = ALL_NAV
    .map(item => (
      item.id === 'today' && !isAdmin
        ? { ...item, label: 'Shift', path: '/station-shift' }
        : item
    ))
    .filter(item => !item.perm || can(item.perm))
    .slice(0, 5);

  // Determine active route
  const getActiveId = () => {
    if (pathname === '/' || pathname === '/app/overview' || pathname === '/dashboard' || pathname.startsWith('/station-shift')) return 'today';
    if (pathname.startsWith('/schedule') || pathname.startsWith('/my-shifts')) return 'schedule';
    if (pathname.startsWith('/operational-map') || pathname.startsWith('/stations')) return 'stations';
    if (pathname.startsWith('/more')) return 'more';
    if (pathname.startsWith('/logs')) return 'add';

    return 'today';
  };

  const activeId = getActiveId();

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[999] flex justify-center items-end pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="pointer-events-auto mx-0 px-4 pt-2 border-t flex justify-between items-end gap-1 transition-all duration-300"
          style={{
            width: '100%',
            minHeight: '68px',
            background: 'linear-gradient(180deg, rgba(3, 7, 10, 0.86), rgba(0, 3, 6, 0.98))',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: 'rgba(230, 106, 31, 0.13)',
            boxShadow: '0 -18px 44px rgba(0, 0, 0, 0.72), 0 -1px 16px rgba(230, 106, 31, 0.09)',
          }}
        >
          {navConfig.map(({ label, path, icon, id, isAdd }) => {
            const isActive = activeId === id;
            return (
              <NavItem
                key={id}
                icon={icon}
                label={label}
                isActive={isActive}
                isAdd={isAdd}
                onClick={() => isAdd ? setShowQuickAdd(true) : navigate(path)}
              />
            );
          })}
        </div>
      </nav>

      <QuickAddSheet
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAction={(actionType) => setActiveQuickAction(actionType)}
      />

      {activeQuickAction && (
        <QuickActionModal
          actionType={activeQuickAction}
          onClose={() => setActiveQuickAction(null)}
          onSuccess={() => setActiveQuickAction(null)}
        />
      )}
    </>
  );
}
