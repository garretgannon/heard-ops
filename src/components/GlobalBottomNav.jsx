import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import NavItem from '@/components/nav/NavItem';
import QuickAddSheet from '@/components/QuickAddSheet';
import QuickAddPrepModal from '@/components/QuickAddPrepModal';
import QuickAddTaskModal from '@/components/QuickAddTaskModal';
import QuickAddWasteModal from '@/components/QuickAddWasteModal';
import QuickAddEightySixModal from '@/components/QuickAddEightySixModal';
import QuickActionModal from '@/components/quickactions/QuickActionModal';
import { usePermissions } from '@/hooks/usePermissions';
import { bottomNavRoutes } from '@/lib/routeConfig';

export default function GlobalBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'prep' | 'task' | 'waste' | 'eighty_six'
  const [activeQuickAction, setActiveQuickAction] = useState(null); // legacy template actions
  const { user, isAdmin } = useCurrentUser();
  const { can } = usePermissions();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
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

  const getActiveId = () => {
    const active = navConfig.find(item => (
      item.activePaths?.some(activePath => (
        activePath === '/' ? pathname === '/' : pathname.startsWith(activePath)
      ))
    ));
    return active?.id ?? 'today';
  };

  const activeId = getActiveId();

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[999] pointer-events-none"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="px-4 pointer-events-auto">
          <div
            className="liquid-nav flex justify-between items-center px-3"
            style={{ height: '62px' }}
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
        </div>
      </nav>

      <QuickAddSheet
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAction={(id) => {
          if (id === 'prep' || id === 'task') setActiveModal(id);
          else if (id === 'add_waste') setActiveModal('waste');
          else if (id === 'add_eighty_six') setActiveModal('eighty_six');
          else setActiveQuickAction(id);
        }}
      />

      <QuickAddPrepModal
        open={activeModal === 'prep'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => setActiveModal(null)}
      />

      <QuickAddTaskModal
        open={activeModal === 'task'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => setActiveModal(null)}
      />

      <QuickAddWasteModal
        open={activeModal === 'waste'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => setActiveModal(null)}
      />

      <QuickAddEightySixModal
        open={activeModal === 'eighty_six'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => setActiveModal(null)}
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
