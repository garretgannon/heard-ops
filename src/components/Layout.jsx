import { Outlet, Link, useLocation } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import HelpButton from "./HelpButton";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ChefHat, ClipboardList, UtensilsCrossed, Menu, X, BookOpen, UserCircle, CheckSquare, CalendarDays, BarChart2, Camera, Tag, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const adminNavGroups = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    single: true,
  },
  {
    label: "Back of House",
    icon: ChefHat,
    children: [
      { path: "/master", label: "Master Prep Items", icon: BookOpen },
      { path: "/stations", label: "Stations", icon: UtensilsCrossed },
      { path: "/prep-lists", label: "Prep Lists", icon: ClipboardList },
      { path: "/reports", label: "Reports", icon: BarChart2 },
      { path: "/photo-review", label: "Photo Review", icon: Camera },
      { path: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Front of House",
    icon: CheckSquare,
    children: [
      { path: "/job-codes", label: "Roles", icon: Tag },
      { path: "/side-work", label: "Side Work Lists", icon: CheckSquare },
    ],
  },
  {
    label: "My Profile",
    path: "/profile",
    icon: UserCircle,
    single: true,
  },
];

const userNavItems = [
  { path: "/master", label: "Master List", icon: BookOpen },
  { path: "/profile", label: "My Profile", icon: UserCircle },
];

const fohNavItems = [
  { path: "/side-work", label: "Side Work", icon: CheckSquare },
  { path: "/profile", label: "My Profile", icon: UserCircle },
];

function NavGroup({ group, location, onClick }) {
  const isChildActive = group.children?.some(c => location.pathname === c.path);
  const [open, setOpen] = useState(isChildActive);

  if (group.single) {
    return (
      <Link
        to={group.path}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          location.pathname === group.path
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <group.icon className="h-4 w-4" />
        {group.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
          isChildActive ? "text-primary" : "text-foreground hover:bg-secondary"
        )}
      >
        <group.icon className="h-4 w-4" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground", open && "rotate-180")} />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
          {group.children.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, isFOH } = useCurrentUser();

  const navGroups = isAdmin ? adminNavGroups : [
    { label: "Master List", path: "/master", icon: BookOpen, single: true },
    ...(isFOH ? [
      { label: "Front of House", icon: CheckSquare, children: [
        { path: "/job-codes", label: "Roles", icon: Tag },
        { path: "/side-work", label: "Side Work Lists", icon: CheckSquare },
      ]},
    ] : []),
    { label: "My Profile", path: "/profile", icon: UserCircle, single: true },
  ];

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
          <nav className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1" onClick={e => e.stopPropagation()}>
            {navGroups.map((group, i) => (
              <NavGroup key={i} group={group} location={location} onClick={() => setMobileOpen(false)} />
            ))}
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

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navGroups.map((group, i) => (
            <NavGroup key={i} group={group} location={location} />
          ))}
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