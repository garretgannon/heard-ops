import { Outlet, Link, useLocation } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import HelpButton from "./HelpButton";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ChefHat, ClipboardList, UtensilsCrossed, Menu, X, BookOpen, UserCircle, CheckSquare, CalendarDays, BarChart2, Camera, Tag, ChevronDown, Thermometer, Droplet, Building2, NotebookPen, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const topNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, highlight: true },
  { path: "/my-restaurant", label: "My Restaurant", icon: Building2, highlight: true },
  { path: "/restaurant-team", label: "Restaurant Team", icon: Users, highlight: true },
];

const fohNavItems_admin = [
  { path: "/job-codes", label: "Roles", icon: Tag },
  { path: "/side-work", label: "Side Work", icon: CheckSquare },
];

const bohNavItems = [
  { path: "/prep-lists", label: "Prep Lists", icon: ClipboardList },
  { path: "/stations", label: "Stations", icon: UtensilsCrossed },
  { path: "/prep-library", label: "Prep Library", icon: BookOpen },
  { path: "/temp-logs", label: "Temp Logs", icon: Thermometer },
  { path: "/dish-machines", label: "Dish Machines", icon: Droplet },
];

const bottomNavItems = [
  { path: "/manager-log", label: "Manager Log", icon: NotebookPen, highlight: true },
  { path: "/calendar", label: "Calendar", icon: CalendarDays, highlight: true },
  { path: "/reports", label: "Reports", icon: BarChart2, highlight: true },
  { path: "/photo-review", label: "Photo Review", icon: Camera, highlight: true },
  { path: "/profile", label: "My Profile", icon: UserCircle, highlight: true },
];

const userNavItems = [
  { path: "/profile", label: "My Profile", icon: UserCircle },
];

const fohNavItems = [
  { path: "/side-work", label: "Side Work", icon: CheckSquare },
  { path: "/profile", label: "My Profile", icon: UserCircle },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileFohOpen, setMobileFohOpen] = useState(true);
  const [mobileBohOpen, setMobileBohOpen] = useState(true);
  const [fohOpen, setFohOpen] = useState(true);
  const [bohOpen, setBohOpen] = useState(true);
  const { isAdmin, isFOH } = useCurrentUser();
  const navItems = isFOH ? fohNavItems : userNavItems;

  // Hide layout chrome on station prep view
  const isStationView = location.pathname.startsWith("/station/");

  if (isStationView) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">Heard</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <nav className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {isAdmin ? (
              <>
                {topNavItems.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      location.pathname === item.path ? "bg-primary text-primary-foreground" :
                      item.highlight ? "text-primary hover:bg-secondary" : "text-muted-foreground hover:bg-secondary"
                    )}>
                    <item.icon className="h-4 w-4" />{item.label}
                  </Link>
                ))}

                <button onClick={() => setMobileFohOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 mt-1">
                  <span className="text-primary">Front of House</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", mobileFohOpen && "rotate-180")} />
                </button>
                {mobileFohOpen && fohNavItems_admin.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 pl-8 pr-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      location.pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    )}>
                    <item.icon className="h-4 w-4" />{item.label}
                  </Link>
                ))}

                <button onClick={() => setMobileBohOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 mt-1">
                  <span className="text-primary">Back of House</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", mobileBohOpen && "rotate-180")} />
                </button>
                {mobileBohOpen && bohNavItems.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 pl-8 pr-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      location.pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    )}>
                    <item.icon className="h-4 w-4" />{item.label}
                  </Link>
                ))}

                <div className="pt-1">
                  {bottomNavItems.map(item => (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        location.pathname === item.path ? "bg-primary text-primary-foreground" :
                        item.highlight ? "text-primary hover:bg-secondary" : "text-muted-foreground hover:bg-secondary"
                      )}>
                      <item.icon className="h-4 w-4" />{item.label}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              navItems.map(item => (
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
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-card flex-col z-30">
        <div className="p-6 flex items-center gap-3 border-b border-border/40">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Heard</h1>
            <p className="text-xs text-muted-foreground">Restaurant Operations</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {isAdmin ? (
            <>
              {/* Top items */}
              {topNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-secondary hover:text-foreground",
                    location.pathname !== item.path && item.highlight ? "text-primary" : location.pathname !== item.path ? "text-muted-foreground" : ""
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              {/* FOH section */}
              <button
                onClick={() => setFohOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 mt-1"
              >
                <span className="text-primary">Front of House</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", fohOpen && "rotate-180")} />
              </button>
              {fohOpen && fohNavItems_admin.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              {/* BOH section */}
              <button
                onClick={() => setBohOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 mt-1"
              >
                <span className="text-primary">Back of House</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", bohOpen && "rotate-180")} />
              </button>
              {bohOpen && bohNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              {/* Bottom items */}
              <div className="pt-1">
                {bottomNavItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      location.pathname === item.path
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-secondary hover:text-foreground",
                      location.pathname !== item.path && item.highlight ? "text-primary" : location.pathname !== item.path ? "text-muted-foreground" : ""
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))
          )}
        </nav>

        <div className="p-4 mx-3 mb-3 rounded-xl bg-secondary/40 border border-border/40">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Share station links with your prep team so they can check off tasks and upload photos.
          </p>
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
            className="p-4 lg:p-8 max-w-6xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <HelpButton />
    </div>
  );
}