import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  UserCircle,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import SwipeTabContainer, { isTabRoute } from "@/components/SwipeTabContainer";
import AdminSimulationBar from '@/components/AdminSimulationBar';
import AdminRolePreview from '@/components/AdminRolePreview';
import { usePermissions } from '@/hooks/usePermissions';
import { desktopNavSections, moreNavSections } from '@/lib/routeConfig';

// Build a flat path → label map from all nav sections
const ALL_NAV_ITEMS = [
  ...desktopNavSections.flatMap(s => s.items),
  ...moreNavSections.flatMap(s => s.items),
  // extras not in nav sections
  { path: '/notifications',   label: 'Notifications' },
  { path: '/shift-handoff',   label: 'Shift Handoff' },
  { path: '/station-readiness', label: 'Station Readiness' },
  { path: '/prep-count',      label: 'Prep Count' },
  { path: '/prep-plan',       label: 'Prep Plan' },
  { path: '/schedule-import', label: 'Schedule Import' },
  { path: '/admin/command-center', label: 'Roles & Access' },
  { path: '/admin/role-simulator', label: 'Role Simulator' },
];

const BACK_FALLBACKS = {
  '/reservations': '/more',
};

function getPageTitle(pathname) {
  const match = ALL_NAV_ITEMS.find(i =>
    i.path === pathname || (i.path.length > 1 && pathname.startsWith(i.path + '/'))
  );
  if (match) return match.label;
  // Fallback: format the last path segment
  const seg = pathname.split('/').filter(Boolean).pop() || '';
  return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, user } = useCurrentUser();
  const { can } = usePermissions();
  const [restaurantName, setRestaurantName] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });

  const isSecondary = !isTabRoute(location.pathname);
  const swipeRef = useRef(null);

  const goBack = useCallback(() => {
    haptics.light();
    const fallbackPath = BACK_FALLBACKS[location.pathname] || '/app/overview';
    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === 'number' && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, { replace: true });
  }, [location.pathname, navigate]);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    base44.entities.Settings.filter({ key: "restaurant_name" }).then(results => {
      if (results.length > 0 && results[0].value) setRestaurantName(results[0].value);
    });
  }, []);

  // ── Swipe-back gesture (left-edge only, secondary pages) ─────────────────
  const onSwipeStart = useCallback((e) => {
    if (!isMobile || !isSecondary) return;
    const touch = e.touches[0];
    if (touch.clientX > 24) return;
    swipeRef.current = { startX: touch.clientX, startY: touch.clientY };
  }, [isMobile, isSecondary]);

  const onSwipeEnd = useCallback((e) => {
    if (!swipeRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeRef.current.startX;
    const dy = Math.abs(touch.clientY - swipeRef.current.startY);
    swipeRef.current = null;
    if (dx > 55 && dy < 100) {
      goBack();
    }
  }, [goBack]);

  const isStationView = location.pathname.startsWith("/station/");
  if (isStationView) {
    return <Outlet />;
  }

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="app-screen">
      {/* Admin Tools */}
      <AdminSimulationBar />
      <AdminRolePreview />

      {/* Mobile header — frosted glass */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-end px-3 pb-2"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          height: "calc(56px + env(safe-area-inset-top, 0px))",
          background: "linear-gradient(180deg, rgba(6, 10, 16, 0.97) 0%, rgba(8, 13, 20, 0.94) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 20px rgba(0,0,0,0.5)",
        }}
      >
        {isMobile && isSecondary ? (
          /* Secondary page header: Back | Title | Actions */
          <>
            <button
              onClick={goBack}
              className="flex items-center gap-0.5 h-10 pl-1 pr-3 rounded-xl active:scale-95 transition-all shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
              <span className="text-[13px] font-bold text-muted-foreground">Back</span>
            </button>

            <p className="flex-1 text-center text-[17px] font-extrabold text-foreground truncate px-2">
              {pageTitle}
            </p>

            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to="/logs"
                className="relative h-10 w-10 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: 'rgba(230,106,31,0.08)' }}
              >
                <Bell style={{ color: '#94A3B8', width: 19, height: 19 }} />
              </Link>
              <Link
                to="/profile"
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: 'rgba(230,106,31,0.08)' }}
              >
                <UserCircle style={{ color: '#94A3B8', width: 19, height: 19 }} />
              </Link>
            </div>
          </>
        ) : (
          /* Tab route header: Logo | Actions */
          <>
            <div className="flex items-center gap-2.5 flex-1">
              <img
                src="https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/4d2dcd0d8_HeardOS_pulse_mark.svg"
                alt="HeardOS"
                className="h-7 w-7 object-contain shrink-0"
              />
              <span className="font-extrabold text-[18px] tracking-tight text-foreground">
                Heard<span className="text-primary">OS</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                to="/logs"
                className="relative h-10 w-10 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: 'rgba(230,106,31,0.08)' }}
              >
                <Bell style={{ color: '#94A3B8', width: 19, height: 19 }} />
              </Link>
              <Link
                to="/profile"
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: 'rgba(230,106,31,0.08)' }}
              >
                <UserCircle style={{ color: '#94A3B8', width: 19, height: 19 }} />
              </Link>
            </div>
          </>
        )}
      </header>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 bottom-0 border-r border-border/30 flex-col z-30 transition-all duration-200",
          collapsed ? "w-[56px]" : "w-[180px]"
        )}
        style={{ background: 'hsl(var(--sidebar-background))' }}
      >
        {/* Logo / Brand */}
        <div className={cn("flex items-center border-b border-border/30 shrink-0", collapsed ? "px-3 py-4 justify-center" : "px-4 py-4 gap-3")}>
          <img src="https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/4d2dcd0d8_HeardOS_pulse_mark.svg" alt="HeardOS" className="h-6 object-contain shrink-0" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-[15px] tracking-tight text-foreground">Heard<span className="text-primary">OS</span></h1>
              {restaurantName
                ? <p className="text-[10px] text-muted-foreground font-medium tracking-wide truncate">{restaurantName}</p>
                : <p className="text-[10px] text-muted-foreground tracking-wide">Restaurant Ops</p>
              }
            </div>
          )}
        </div>

        {/* Nav items — grouped sections */}
        <nav className="flex-1 overflow-y-auto py-1 px-2 space-y-0">
          {desktopNavSections.map((section, si) => {
            const visibleItems = section.items.filter(item => !item.perm || can(item.perm));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label} className={cn(si > 0 && !collapsed ? "mt-3" : si > 0 ? "mt-2" : "")}>
                {!collapsed && (
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">{section.label}</p>
                )}
                {collapsed && si > 0 && <div className="mx-2 my-2 border-t border-border/30" />}
                <div className="space-y-0">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                      <div key={item.path} className="relative group/navitem">
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center text-sm font-medium transition-all duration-200",
                            collapsed ? "justify-center h-8 w-8 mx-auto rounded-lg" : "gap-2.5 px-2.5 py-1.5 rounded-lg",
                            isActive
                              ? "text-white"
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          )}
                          style={isActive ? {
                            background: 'rgba(230, 106, 31, 0.16)',
                            boxShadow: '0 0 0 1px rgba(230, 106, 31, 0.3), 0 0 20px rgba(230, 106, 31, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                          } : {}}
                        >
                          <Icon
                            className={cn("shrink-0 h-4 w-4", isActive ? "text-primary" : "")}
                            style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(230, 106, 31, 0.6))' } : undefined}
                          />
                          {!collapsed && <span className="truncate font-semibold text-[13px]">{item.label}</span>}
                        </Link>
                        {collapsed && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover border border-border rounded-md text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover/navitem:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                            {item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-border/20 p-2">
          <button
            onClick={toggleCollapsed}
            className={cn(
              "flex items-center rounded-xl text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all duration-100 w-full",
              collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2 px-3 py-2"
            )}
          >
            {collapsed
              ? <ChevronRightIcon className="h-4 w-4" />
              : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main
        className={cn("min-h-screen transition-all duration-200", collapsed ? "lg:pl-[56px]" : "lg:pl-[180px]")}
        style={isMobile ? { paddingTop: "calc(56px + env(safe-area-inset-top, 0px))" } : {}}
        onTouchStart={onSwipeStart}
        onTouchEnd={onSwipeEnd}
      >
        {isMobile && isTabRoute(location.pathname) ? (
          <div
            className="overflow-hidden"
            style={{ height: "calc(100dvh - 56px - env(safe-area-inset-top, 0px))" }}
          >
            <SwipeTabContainer />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[430px] mx-auto lg:max-w-none lg:mx-0 px-4 pt-3 lg:px-0 lg:pt-0 lg:pb-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export const hideBase44Index = true;
