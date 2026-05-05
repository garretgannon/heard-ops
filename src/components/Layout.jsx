import { useLocation, Link, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import HelpButton from "./HelpButton";
import FloatingManagerLogButton from "./FloatingManagerLogButton";


import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ChefHat, ClipboardList, BookOpen, UserCircle, CheckSquare, CalendarDays, BarChart2, Camera, Tag, ChevronDown, Thermometer, Droplet, Building2, Users, ShowerHead, Settings, DollarSign, Wrench, Truck, AlertTriangle, Flame, Book, Wine, FileText, TrendingUp, Bell, BookMarked, CalendarPlus, Notebook } from "lucide-react";

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const navSections = {
  dailyOps: {
    label: "Daily Operations",
    items: [
      { path: "/dashboard", label: "Today's Command Center", icon: LayoutDashboard },
      { path: "/prep-lists", label: "Prep Lists", icon: ClipboardList },
      { path: "/shift-handoff", label: "Shift Handoff", icon: TrendingUp },
    ]
  },
  complianceLogs: {
    label: "Compliance & Logs",
    items: [
      { path: "/temp-logs", label: "Temperature Logs", icon: Thermometer },
      { path: "/manager-log", label: "Manager Log", icon: Notebook },
      { path: "/bathroom-checks", label: "Bathroom Checks", icon: ShowerHead },
    ]
  },
  managerTools: {
    label: "Manager Tools",
    items: [
      { path: "/photo-review", label: "Photo Review", icon: Camera },
      { path: "/incidents", label: "Incident Reports", icon: AlertTriangle },
    ]
  },
  admin: {
    label: "Admin",
    items: [
      { path: "/templates", label: "Template Builder", icon: Book },
      { path: "/my-restaurant", label: "My Restaurant", icon: Building2 },
    ]
  },
};

const fohNavItems = [
  { path: "/home", label: "Staff Home", icon: UserCircle },
  { path: "/bar-book", label: "Bar Book", icon: Wine },
  { path: "/side-work", label: "Side Work", icon: CheckSquare },
  { path: "/bathroom-checks", label: "Bathroom Checks", icon: ShowerHead },
  { path: "/cash", label: "Cash", icon: DollarSign },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/profile", label: "My Profile", icon: UserCircle },
];

export default function Layout() {
  const location = useLocation();
  const [expandedDesktopSections, setExpandedDesktopSections] = useState({
    dailyOps: true,
    complianceLogs: true,
    managerTools: true,
    teamTraining: false,
    admin: false,
  });
  const { isAdmin, isFOH } = useCurrentUser();
  const [logoUrl, setLogoUrl] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    base44.entities.Settings.filter({ key: "restaurant_name" }).then(results => {
      if (results.length > 0 && results[0].value) setRestaurantName(results[0].value);
    });
    base44.entities.Settings.filter({ key: "logo_url" }).then(results => {
      if (results.length > 0 && results[0].value) setLogoUrl(results[0].value);
    });
  }, []);

  const toggleDesktopSection = (key) => {
    setExpandedDesktopSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isStationView = location.pathname.startsWith("/station/");
  if (isStationView) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Mobile header — iOS frosted glass */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-end px-4 pb-2"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          height: "calc(52px + env(safe-area-inset-top, 0px))",
          background: "rgba(11, 15, 20, 0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex-1">
          <div className="font-extrabold text-[18px] tracking-tight leading-none" style={{ color: '#FFFFFF' }}>
            Heard<span style={{ color: '#F5A623' }}>OS</span>
          </div>
          <div className="text-[9px] font-bold tracking-widest mt-0.5" style={{ color: '#6B7280', letterSpacing: '0.12em' }}>RESTAURANT OPERATIONS SYSTEM</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="relative h-9 w-9 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Bell style={{ color: '#9CA3AF', width: 18, height: 18 }} />
          </button>
          <Link to="/profile" className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <UserCircle style={{ color: '#9CA3AF', width: 18, height: 18 }} />
          </Link>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border/30 flex-col z-30" style={{ background: 'hsl(var(--sidebar-background))' }}>
        <div className="px-5 py-5 flex items-center gap-3 border-b border-border/30">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-9 w-9 object-cover" />
            ) : (
              <ChefHat className="h-4 w-4 text-primary-foreground" />
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-foreground">Heard<span className="text-primary">OS</span></h1>
            {restaurantName
              ? <p className="text-[11px] text-primary/80 font-semibold tracking-wide uppercase">{restaurantName}</p>
              : <p className="text-[11px] text-muted-foreground tracking-wide uppercase">Restaurant Ops</p>
            }
          </div>
        </div>

        <nav className="flex-1 px-2.5 overflow-y-auto py-3 space-y-0.5">
          {isAdmin ? (
            Object.entries(navSections).map(([key, section]) => (
              <div key={key}>
                <button
                  onClick={() => toggleDesktopSection(key)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all duration-200"
                >
                  <span>{section.label}</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", expandedDesktopSections[key] && "rotate-180")} />
                </button>
                {expandedDesktopSections[key] && section.items.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      location.pathname === item.path
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))
          ) : (
            fohNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            ))
          )}
        </nav>

        <div className="px-3 pb-4">
          <div className="rounded-xl bg-primary/8 border border-primary/15 p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              The daily operating system for restaurants — prep, side work, logs, and manager follow-up.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="lg:pl-64 min-h-screen flex flex-col items-center"
        style={{ paddingTop: "calc(52px + env(safe-area-inset-top, 0px))" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-full max-w-[430px] lg:max-w-none lg:w-full px-4 pt-3 lg:px-8 lg:pb-8 lg:max-w-6xl mx-auto"
            style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <FloatingManagerLogButton />
    </div>
  );
}

export const hideBase44Index = true;