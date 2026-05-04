import { useLocation, Link, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import HelpButton from "./HelpButton";
import BottomNav from "./BottomNav";
import FloatingQuickActions from "./FloatingQuickActions";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ChefHat, ClipboardList, UtensilsCrossed, Menu, X, BookOpen, UserCircle, CheckSquare, CalendarDays, BarChart2, Camera, Tag, ChevronDown, Thermometer, Droplet, Building2, NotebookPen, Users, ShowerHead, Settings, DollarSign, Wrench, CalendarSearch, Truck, AlertTriangle, Flame, Book, Wine, FileText, TrendingUp, Bell, BookMarked, CalendarPlus } from "lucide-react";

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const navSections = {
  dailyOps: {
    label: "Daily Operations",
    items: [
      { path: "/", label: "Today's Command Center", icon: LayoutDashboard },
      { path: "/prep-lists", label: "Prep Lists", icon: ClipboardList },
      { path: "/side-work", label: "Side Work", icon: CheckSquare },
      { path: "/pre-shift", label: "Service Line-Up", icon: Flame },
      { path: "/shift-handoff", label: "Shift Handoff", icon: TrendingUp },
    ]
  },
  complianceLogs: {
    label: "Compliance & Logs",
    items: [
      { path: "/temp-logs", label: "Temperature Logs", icon: Thermometer },
      { path: "/dish-machines", label: "Dish Machines", icon: Droplet },
      { path: "/bathroom-checks", label: "Bathroom Checks", icon: ShowerHead },
      { path: "/msds", label: "MSDS", icon: FileText },
    ]
  },
  managerTools: {
    label: "Manager Tools",
    items: [
      { path: "/photo-review", label: "Photo Review", icon: Camera },
      { path: "/incidents", label: "Incident Reports", icon: AlertTriangle },
      { path: "/reports", label: "Reports", icon: BarChart2 },
      { path: "/weekly-report", label: "Weekly Report", icon: TrendingUp },
      { path: "/notifications", label: "Notification Settings", icon: Bell },
    ]
  },
  teamTraining: {
    label: "Team & Training",
    items: [
      { path: "/home", label: "Staff Home", icon: UserCircle },
      { path: "/today", label: "Staff Tasks", icon: CheckSquare },
      { path: "/onboarding", label: "Onboarding", icon: BookMarked },
      { path: "/restaurant-team", label: "Restaurant Team", icon: Users },
      { path: "/job-codes", label: "Job Codes", icon: Tag },
      { path: "/build-book", label: "Build Book", icon: Book },
      { path: "/bar-book", label: "Bar Book", icon: Wine },
    ]
  },
  admin: {
    label: "Admin",
    items: [
      { path: "/cash", label: "Cash", icon: DollarSign },
      { path: "/calendar", label: "Calendar", icon: CalendarDays },
      { path: "/schedule-center", label: "Schedule Center", icon: CalendarPlus },
      { path: "/vendors", label: "Vendors", icon: Truck },
      { path: "/maintenance", label: "Maintenance Requests", icon: Wrench },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMobileSections, setExpandedMobileSections] = useState({});
  const [expandedDesktopSections, setExpandedDesktopSections] = useState({
    dailyOps: true,
    complianceLogs: true,
    managerTools: false,
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

  const toggleMobileSection = (key) => {
    setExpandedMobileSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDesktopSection = (key) => {
    setExpandedDesktopSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Hide layout chrome on station prep view
  const isStationView = location.pathname.startsWith("/station/");

  if (isStationView) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 h-14 flex items-center justify-between" style={{background: '#0B0F14', borderBottom: '1px solid #1F2933'}}>
        <div className="flex flex-col justify-center">
          <span className="font-extrabold text-lg tracking-tight leading-none" style={{color: '#FFFFFF'}}>
            Heard<span style={{color: '#F5A623'}}>OS</span>
          </span>
          <span className="text-[9px] font-semibold tracking-widest uppercase leading-none mt-0.5" style={{color: '#6B7280'}}>
            {restaurantName || 'Restaurant Operations System'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-xl" style={{background: '#141920'}}>
            <Bell className="h-5 w-5" style={{color: '#9CA3AF'}} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{background: '#F5A623'}} />
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl" style={{background: '#141920'}}>
            {mobileOpen ? <X className="h-5 w-5" style={{color: '#9CA3AF'}} /> : <Menu className="h-5 w-5" style={{color: '#9CA3AF'}} />}
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <nav className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {isAdmin ? (
              <>
                {Object.entries(navSections).map(([key, section]) => (
                  <div key={key}>
                    <button
                      onClick={() => toggleMobileSection(key)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-secondary/40 transition-all duration-200"
                    >
                      <span>{section.label}</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedMobileSections[key] && "rotate-180")} />
                    </button>
                    {expandedMobileSections[key] && section.items.map(item => (
                      <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 pl-8 pr-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          location.pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                        )}>
                        <item.icon className="h-4 w-4" />{item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              fohNavItems.map(item => (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  )}>
                  <item.icon className="h-4 w-4" />{item.label}
                </Link>
              ))
            )}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border/30 flex-col z-30" style={{background: 'hsl(var(--sidebar-background))'}}>
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
            {restaurantName && <p className="text-[11px] text-primary/80 font-semibold tracking-wide uppercase">{restaurantName}</p>}
            {!restaurantName && <p className="text-[11px] text-muted-foreground tracking-wide uppercase">Restaurant Ops</p>}
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
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="p-4 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <HelpButton />
      <FloatingQuickActions />
      <BottomNav />
    </div>
  );
}

export const hideBase44Index = true;