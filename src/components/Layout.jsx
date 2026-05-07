import { useLocation, Link, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, UserCircle, ChefHat,
  LayoutDashboard, ClipboardList, Thermometer, CheckSquare,
  Warehouse, Truck, LayoutTemplate, Building2, Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import SwipeTabContainer, { isTabRoute } from "@/components/SwipeTabContainer";

// Desktop sidebar nav — flat primary items per spec
const DESKTOP_NAV_ITEMS = [
  { path: "/", label: "Today", icon: LayoutDashboard },
  { path: "/prep-lists", label: "Prep", icon: ClipboardList },
  { path: "/tasks", label: "Overview", icon: CheckSquare },
  { path: "/temp-logs", label: "Temps", icon: Thermometer },
  { path: "/side-work", label: "Side Work", icon: CheckSquare },
  { path: "/recipes", label: "Recipes", icon: ChefHat },
  { path: "/inventory", label: "Inventory", icon: Warehouse },
  { path: "/vendors", label: "Vendors", icon: Truck },
  { path: "/prep-templates", label: "Templates", icon: LayoutTemplate },
  { path: "/my-restaurant", label: "My Restaurant", icon: Building2 },
  { path: "/profile", label: "Settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const { isAdmin } = useCurrentUser();
  const [logoUrl, setLogoUrl] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

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

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 border-r border-border/30 flex-col z-30" style={{ background: 'hsl(var(--sidebar-background))' }}>
        {/* Logo / Brand */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-border/30">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-9 w-9 object-cover" />
            ) : (
              <ChefHat className="h-4 w-4 text-primary-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-base tracking-tight text-foreground">Heard<span className="text-primary">OS</span></h1>
            {restaurantName
              ? <p className="text-[11px] text-primary/80 font-semibold tracking-wide uppercase truncate">{restaurantName}</p>
              : <p className="text-[11px] text-muted-foreground tracking-wide uppercase">Restaurant Ops</p>
            }
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2.5 overflow-y-auto py-3 space-y-0.5">
          {DESKTOP_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer blurb */}
        <div className="px-3 pb-4">
          <div className="rounded-xl bg-primary/8 border border-primary/15 p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              The daily operating system for restaurants.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main
        className="lg:pl-60 min-h-screen flex flex-col"
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
              className="w-full max-w-[430px] mx-auto lg:max-w-none lg:mx-0 px-4 pt-3 lg:px-8 lg:pt-6 lg:pb-8"
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