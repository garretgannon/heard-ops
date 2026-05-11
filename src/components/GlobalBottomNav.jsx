import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import NavItem from '@/components/nav/NavItem';
import QuickAddSheet from '@/components/QuickAddSheet';
import QuickActionModal from '@/components/quickactions/QuickActionModal';
import { usePermissions } from '@/hooks/usePermissions';
import { bottomNavRoutes } from '@/lib/routeConfig';

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

  const navConfig = bottomNavRoutes
    .map(item => (
      item.id === 'today' && !isAdmin
        ? { ...item, label: item.staffLabel || item.label, path: item.staffPath || item.path }
        : item
    ))
    .filter(item => !item.adminOnly || isAdmin)
    .filter(item => !item.perm || can(item.perm))
    .slice(0, 5);

  // Determine active route
  const getActiveId = () => {
    const active = navConfig.find(item => (
      item.activePaths?.some(activePath => (
        activePath === '/' ? pathname === '/' : pathname.startsWith(activePath)
      ))
    ));
    if (active) return active.id;

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
