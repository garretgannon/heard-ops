import { useLocation, Link, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, UserCircle, ChefHat,
  LayoutDashboard, ClipboardList,
  Warehouse, Truck, LayoutTemplate, Building2, Settings,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  FileText, CalendarDays, Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import SwipeTabContainer, { isTabRoute } from "@/components/SwipeTabContainer";
import AdminSimulationBar from '@/components/AdminSimulationBar';
import AdminRolePreview from '@/components/AdminRolePreview';

// Grouped desktop nav: 6 main navigation items
const DESKTOP_SECTIONS = [
  {
    label: "Main",
    items: [
      { path: "/overview", label: "Overview", icon: LayoutDashboard },
      { path: "/", label: "Today", icon: LayoutDashboard },
      { path: "/shift", label: "Shift", icon: ClipboardList },
      { path: "/logs", label: "Logs", icon: FileText },
      { path: "/team", label: "Team", icon: Users },
      { path: "/more", label: "More", icon: LayoutTemplate },
    ],
  },
];

export default function Layout() {
  const location = useLocation();
  const { isAdmin, user } = useCurrentUser();
  const [logoUrl, setLogoUrl] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });

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
    base44.entities.Settings.filter({ key: "logo_url" }).then(results => {
      if (results.length > 0 && results[0].value) setLogoUrl(results[0].value);
    });
  }, []);

  const isStationView = location.pathname.startsWith("/station/");
  if (isStationView) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Tools */}
      <AdminSimulationBar />
      <AdminRolePreview />

      {/* Mobile header — frosted glass */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-end px-4 pb-2"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          height: "calc(52px + env(safe-area-inset-top, 0px))",
          background: "rgba(11, 15, 20, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #2A3441",
        }}
      >
        <div className="flex-1">
          <div className="font-extrabold text-[18px] tracking-tight leading-none" style={{ color: '#F8FAFC' }}>
            Heard<span style={{ color: '#E66A1F' }}>OS</span>
          </div>
          <div className="text-[9px] font-bold tracking-widest mt-0.5" style={{ color: '#94A3B8', letterSpacing: '0.12em' }}>RESTAURANT OPERATIONS SYSTEM</div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link to="/logs" className="relative h-9 w-9 flex items-center justify-center rounded-xl transition-colors" style={{ background: 'rgba(230,106,31,0.08)' }}>
            <Bell style={{ color: '#94A3B8', width: 18, height: 18 }} />
          </Link>
          <Link to="/profile" className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors" style={{ background: 'rgba(230,106,31,0.08)' }}>
            <UserCircle style={{ color: '#94A3B8', width: 18, height: 18 }} />
          </Link>
        </div>
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
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-8 w-8 object-cover" />
            ) : (
              <ChefHat className="h-4 w-4 text-primary-foreground" />
            )}
          </div>
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
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0">
          {DESKTOP_SECTIONS.map((section, si) => (
            <div key={section.label} className={cn(si > 0 && !collapsed ? "mt-3" : si > 0 ? "mt-2" : "")}>
              {!collapsed && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">{section.label}</p>
              )}
              {collapsed && si > 0 && <div className="mx-2 my-2 border-t border-border/30" />}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <div key={item.path} className="relative group/navitem">
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center text-sm font-medium transition-all duration-100",
                          collapsed ? "justify-center h-9 w-9 mx-auto rounded-lg" : "gap-3 px-3 py-2 rounded-xl",
                          isActive
                            ? "bg-primary text-white shadow-sm shadow-primary/30"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("shrink-0 h-4 w-4", isActive ? "text-white" : "")} />
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
          ))}
        </nav>

        {/* Bottom info card */}
        {!collapsed && (
          <div className="mx-2 mb-2 p-3 rounded-xl bg-white/4 border border-border/30">
            <p className="text-[11px] font-semibold text-foreground/70 leading-relaxed">The daily operating system for restaurants.</p>
          </div>
        )}

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
        style={{ paddingTop: "calc(52px + env(safe-area-inset-top, 0px))" }}
      >
        {isMobile && isTabRoute(location.pathname) ? (
          /* Mobile swipe carousel for the 5 main tabs — pages own their own padding */
          <div style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
            <SwipeTabContainer />
          </div>
        ) : (
          /* Desktop + non-tab pages: normal routed outlet */
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full max-w-[430px] mx-auto lg:max-w-none lg:mx-0 px-4 pt-3 lg:px-0 lg:pt-0 lg:pb-8"
              style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
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