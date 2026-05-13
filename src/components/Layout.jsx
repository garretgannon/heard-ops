import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  PanelLeftClose,
  PanelLeftOpen,
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
import { BRAND_ASSETS } from '@/lib/brandAssets';

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
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
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
    const handler = () => setIsMobile(window.innerWidth < 900);
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
            <div className="flex items-center flex-1">
              <img
                src={BRAND_ASSETS.signalLogoCropped}
                alt="HeardOS"
                className="h-12 w-auto max-w-[220px] object-contain shrink-0"
              />
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
          "hidden lg:flex fixed left-0 top-0 bottom-0 flex-col z-30 transition-all duration-200",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(5,8,14,1) 0%, rgba(4,6,11,1) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.055)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.6), 1px 0 0 rgba(230,106,31,0.04)',
        }}
      >
        {/* Orange brand accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px shrink-0"
          style={{ background: 'linear-gradient(90deg, rgba(230,106,31,0.7) 0%, rgba(230,106,31,0.05) 70%, transparent 100%)' }}
        />

        {/* Logo / Brand */}
        <div className={cn(
          "flex items-center shrink-0 pt-5",
          collapsed ? "px-3 pb-4 justify-center" : "px-5 pb-4 gap-3"
        )}>
          <img
            src={collapsed ? BRAND_ASSETS.appIcon : BRAND_ASSETS.signalLogoCropped}
            alt="HeardOS"
            className={cn(
              "object-contain shrink-0",
              collapsed ? "h-8 w-8 rounded-lg" : "h-14 w-full max-w-[190px]"
            )}
            style={{ filter: 'drop-shadow(0 0 6px rgba(230,106,31,0.5))' }}
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-medium tracking-wide truncate">
                {restaurantName || 'Restaurant Ops'}
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={cn("shrink-0 mb-2", collapsed ? "mx-3" : "mx-4")}
          style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }}
        />

        {/* Nav items — grouped sections */}
        <nav className="flex-1 overflow-y-auto py-1 px-2.5 space-y-0">
          {desktopNavSections.map((section, si) => {
            const visibleItems = section.items.filter(item => !item.perm || can(item.perm));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label} className={cn(si > 0 ? "mt-4" : "")}>
                {!collapsed && (
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] px-3 mb-1.5"
                    style={{ color: 'rgba(148,163,184,0.45)' }}>
                    {section.label}
                  </p>
                )}
                {collapsed && si > 0 && (
                  <div className="mx-auto mb-3 mt-1" style={{ height: '1px', width: '28px', background: 'rgba(255,255,255,0.06)' }} />
                )}
                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                      <div key={item.path} className="relative group/navitem">
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center transition-all duration-150",
                            collapsed
                              ? "justify-center h-9 w-9 mx-auto rounded-xl"
                              : "gap-3 px-3 h-9 rounded-xl w-full",
                            isActive
                              ? "text-white"
                              : "text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04]"
                          )}
                          style={isActive ? {
                            background: 'rgba(230,106,31,0.14)',
                            boxShadow: '0 0 0 1px rgba(230,106,31,0.28), 0 0 16px rgba(230,106,31,0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
                          } : {}}
                        >
                          <Icon
                            className={cn("shrink-0", isActive ? "text-primary" : "")}
                            style={{
                              width: 15,
                              height: 15,
                              filter: isActive ? 'drop-shadow(0 0 4px rgba(230,106,31,0.6))' : undefined,
                            }}
                          />
                          {!collapsed && (
                            <span className="truncate text-[13px] font-semibold">{item.label}</span>
                          )}
                        </Link>
                        {collapsed && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground whitespace-nowrap opacity-0 group-hover/navitem:opacity-100 pointer-events-none transition-opacity z-50"
                            style={{
                              background: 'rgba(10,16,26,0.97)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                            }}
                          >
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

        {/* User info + Collapse */}
        <div className="shrink-0 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* User identity */}
          {user && (
            collapsed ? (
              <div className="flex justify-center py-2.5">
                <Link to="/profile"
                  className="h-8 w-8 rounded-xl flex items-center justify-center transition-all hover:brightness-110"
                  style={{
                    background: 'rgba(230,106,31,0.15)',
                    border: '1px solid rgba(230,106,31,0.3)',
                    boxShadow: '0 0 10px rgba(230,106,31,0.12)',
                  }}
                >
                  <span className="text-[11px] font-black text-primary">
                    {(user.full_name || user.email || '?')[0].toUpperCase()}
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                to="/profile"
                className="flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.04]"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(230,106,31,0.15)',
                    border: '1px solid rgba(230,106,31,0.3)',
                    boxShadow: '0 0 10px rgba(230,106,31,0.1)',
                  }}
                >
                  <span className="text-[10px] font-black text-primary">
                    {(user.full_name || user.email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground truncate leading-none">
                    {user.full_name || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {isAdmin ? 'Manager' : 'Staff'}
                  </p>
                </div>
              </Link>
            )
          )}

          {/* Collapse toggle */}
          <div className="px-2.5 pb-3 pt-1">
            <button
              onClick={toggleCollapsed}
              className={cn(
                "flex items-center rounded-xl text-[11px] font-semibold text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/[0.04] transition-all w-full",
                collapsed ? "justify-center h-8 w-8 mx-auto" : "gap-2 px-3 py-2"
              )}
            >
              {collapsed
                ? <ChevronRightIcon className="h-3.5 w-3.5" />
                : <><ChevronLeft className="h-3.5 w-3.5" /><span>Collapse</span></>
              }
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop top rail */}
      <header
        className={cn(
          "hidden lg:flex fixed top-0 right-0 z-20 h-[72px] items-center justify-between px-8",
          collapsed ? "left-[60px]" : "left-[220px]"
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(5,8,14,0.94) 0%, rgba(5,8,14,0.78) 100%)',
          backdropFilter: 'blur(12px) saturate(140%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="min-w-0">
          <p className="text-[14px] font-black text-foreground truncate leading-none">{restaurantName || 'HeardOS'}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium">{dateStr}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleCollapsed}
            className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4 mx-auto" /> : <PanelLeftClose className="h-4 w-4 mx-auto" />}
          </button>
          <Link
            to="/logs"
            className="relative h-10 w-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <Link
            to="/profile"
            className="h-10 px-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition"
          >
            <UserCircle className="h-4 w-4" />
            <span className="text-[12px] font-semibold">Profile</span>
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <main
        className={cn("min-h-screen transition-all duration-200", collapsed ? "lg:pl-[60px] lg:pt-[72px]" : "lg:pl-[220px] lg:pt-[72px]")}
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
              className="w-full max-w-[430px] mx-auto lg:max-w-[1500px] lg:mx-auto px-4 pt-3 lg:px-8 lg:pt-7 lg:pb-10"
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
