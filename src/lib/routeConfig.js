/**
 * CENTRAL ROUTE CONFIGURATION
 * Single source of truth for all navigation in HeardOS
 * Defines paths, labels, icons, modules, and role access
 */

import {
  LayoutDashboard,
  ClipboardList,
  Flame,
  BookOpen,
  MoreHorizontal,
  Store,
  AlertTriangle,
  Warehouse,
  Truck,
  Users,
  Calendar,
  FileText,
  BarChart2,
  Settings,
  User,
  Bell,
  Book,
  CheckSquare,
  Thermometer,
  Droplet,
  Building2,
  ShowerHead,
  DollarSign,
  ChefHat,
  LayoutTemplate,
  Package,
  Map,
  Plus,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  GitBranch,
  Zap,
} from "lucide-react";

/**
 * BOTTOM NAV ROUTES (5 main navigation points)
 */
export const bottomNavRoutes = [
  {
    id: "today",
    label: "Dashboard",
    path: "/app/overview",
    icon: LayoutDashboard,
    description: "Manager command center",
    module: "dailyOps",
    perm: "view_dashboard",
    staffLabel: "Shift",
    staffPath: "/station-shift",
    activePaths: ["/", "/app/overview", "/dashboard", "/station-shift"],
  },
  {
    id: "stations",
    label: "Stations",
    path: "/operational-map",
    icon: Map,
    description: "Station work and setup",
    module: "management",
    activePaths: ["/operational-map", "/stations"],
  },

  {
    id: "shift",
    label: "Shift",
    path: "/shift",
    icon: Sparkles,
    description: "Manager briefing, duties, and handoff",
    module: "dailyOps",
    adminOnly: true,
    activePaths: ["/shift", "/shift-handoff"],
  },
  {
    id: "more",
    label: "More",
    path: "/more",
    icon: MoreHorizontal,
    description: "All features and settings",
    module: "management",
    activePaths: ["/more"],
  },
];

export const desktopNavSections = [
  // ── OPERATIONS ──────────────────────────────────────────────────────────────
  {
    label: "OPERATIONS",
    items: [
      { path: "/app/overview",  label: "Dashboard",    icon: LayoutDashboard },
      { path: "/shift",         label: "Shift Command", icon: Sparkles },
      { path: "/notes-comms",   label: "Notes & Comms", icon: MessageSquare },
      { path: "/cash-drawer",   label: "Cash Drawer",  icon: DollarSign },
      { path: "/logs",          label: "Logs",         icon: FileText,      perm: "view_logs" },
      { path: "/approvals",     label: "Approvals",    icon: CheckSquare },
    ],
  },

  // ── PLANNING ─────────────────────────────────────────────────────────────────
  {
    label: "PLANNING",
    items: [
      { path: "/schedule",      label: "Schedule",     icon: Calendar,       perm: "view_schedule" },
      { path: "/prep-planning", label: "Prep Planning", icon: ClipboardList, perm: "edit_prep_lists" },
      { path: "/reservations",  label: "BEOs / Events", icon: LayoutTemplate, perm: "view_beos" },
    ],
  },

  // ── INVENTORY (expandable) ───────────────────────────────────────────────────
  {
    label: "INVENTORY",
    expandable: true,
    icon: Warehouse,
    defaultPath: "/inventory",
    items: [
      { path: "/inventory",       label: "Inventory Counts", icon: ClipboardList, perm: "view_inventory" },
      { path: "/receiving",       label: "Receiving",        icon: Truck },
      { path: "/purchased-items", label: "Purchased Items",  icon: Package },
      { path: "/vendors",         label: "Vendors",          icon: Store,         perm: "view_vendors" },
      { path: "/recipes",         label: "Recipes",          icon: ChefHat,       perm: "view_recipes" },
    ],
  },

  // ── KNOWLEDGE ────────────────────────────────────────────────────────────────
  {
    label: "KNOWLEDGE",
    items: [
      { path: "/training",         label: "Training",       icon: BookOpen },
      { path: "/chemical-library", label: "Chemicals / SDS", icon: AlertTriangle },
    ],
  },

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  {
    label: "ADMIN",
    items: [
      { path: "/team",            label: "Team",         icon: Users,      perm: "view_team" },
      { path: "/operational-map", label: "Stations",     icon: Map },
      { path: "/templates",       label: "Templates",    icon: ClipboardList, perm: "view_templates" },
      { path: "/automation-rules", label: "Automation",  icon: Zap },
      { path: "/reports",         label: "Reports",      icon: BarChart2,  perm: "view_reports" },
      { path: "/my-restaurant",   label: "My Restaurant", icon: Building2 },
      { path: "/profile",         label: "Settings",     icon: Settings },
    ],
  },

  // ── DEV / TESTING (expandable — keep, do not delete) ────────────────────────
  {
    label: "DEV / TESTING",
    expandable: true,
    isDev: true,
    icon: GitBranch,
    defaultPath: "/setup-journey",
    items: [
      { path: "/team-structure-wizard",    label: "Team Setup Wizard",  icon: GitBranch },
      { path: "/setup-journey",            label: "Setup Journey",      icon: Zap },
      { path: "/restaurant-setup-wizard",  label: "Station Wizard",     icon: Map },
      { path: "/admin/command-center",     label: "Role Admin",         icon: ShieldCheck },
      { path: "/admin/onboarding-simulator", label: "Onboarding Sim",  icon: Sparkles },
      { path: "/admin/role-simulator",     label: "Role Simulator",     icon: ShieldCheck },
      { path: "/build-cards",              label: "Build Cards",        icon: Package },
      { path: "/station-readiness",        label: "Station Readiness",  icon: Map },
      { path: "/temperature-monitoring",   label: "Temp Monitoring",    icon: Thermometer },
      { path: "/temperature-dashboard",    label: "Temp Dashboard",     icon: Thermometer },
      { path: "/job-codes",                label: "Job Codes",          icon: Users },
      { path: "/schedule-import",          label: "Schedule Import",    icon: Calendar },
    ],
  },
];

export const moreNavSections = [
  {
    title: "Planning",
    items: [
      { label: "Prep Planning",  detail: "Plan production",              path: "/prep-planning", icon: ClipboardList, status: "status-info" },
      { label: "Schedule",       detail: "Staff schedules and shifts",   path: "/schedule",      icon: Calendar,      status: "status-info" },
      { label: "BEOs / Events",  detail: "Reservations and events",      path: "/reservations",  icon: LayoutTemplate, status: "status-info" },
      { label: "Approvals",      detail: "Review pending requests",      path: "/approvals",     icon: CheckSquare,   status: "status-info" },
    ],
  },
  {
    title: "Activity",
    items: [
      { label: "Notes & Comms",  detail: "Capture, share, and track everything", path: "/notes-comms",  icon: MessageSquare, status: "status-neutral" },
      { label: "Cash Drawer",   detail: "Count drawers and log cash",     path: "/cash-drawer",   icon: DollarSign,    status: "status-neutral" },
      { label: "Logs",          detail: "History and records",            path: "/logs",          icon: FileText,      status: "status-warning" },
    ],
  },
  {
    title: "Supply Chain",
    items: [
      { label: "Receiving",       detail: "Invoices and deliveries", path: "/receiving",       icon: Truck,     status: "status-success" },
      { label: "Inventory",       detail: "Stock and counts",        path: "/inventory",       icon: Warehouse, status: "status-success" },
      { label: "Purchased Items", detail: "Goods and prices",        path: "/purchased-items", icon: Package,   status: "status-success" },
      { label: "Vendors",         detail: "Contacts and ordering",   path: "/vendors",         icon: Truck,     status: "status-success" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Recipes",         detail: "Recipes and build cards",  path: "/recipes",           icon: ChefHat,       status: "status-review" },
      { label: "Training",        detail: "Team learning",             path: "/training",          icon: BookOpen,      status: "status-review" },
      { label: "Chemicals / SDS", detail: "Safety data sheets",       path: "/chemical-library",  icon: AlertTriangle, status: "status-review" },
    ],
  },
  {
    title: "Team & Settings",
    items: [
      { label: "Team",               detail: "Staff directory and certs",  path: "/team",          icon: Users,     status: "status-neutral" },
      { label: "Restaurant",         detail: "Location settings",          path: "/my-restaurant", icon: Building2, status: "status-neutral" },
      { label: "Profile & Settings", detail: "Account preferences",       path: "/profile",       icon: Settings,  status: "status-neutral" },
    ],
  },
];

export const morePrimaryActions = [
  { label: "Templates",  detail: "Task, prep, cleaning",    path: "/templates",              icon: LayoutTemplate, status: "status-info" },
  { label: "Roles",      detail: "Access and permissions",  path: "/admin/command-center",   icon: ShieldCheck,    status: "status-neutral" },
  { label: "Automation", detail: "Rules and escalations",   path: "/automation-rules",       icon: Zap,            status: "status-warning" },
  { label: "Reports",    detail: "Operational trends",      path: "/reports",                icon: BarChart2,      status: "status-neutral" },
];

/**
 * ALL ROUTES (organized by module)
 * Includes legacy redirects
 */
export const allRoutes = {
  // DAILY OPERATIONS
  dailyOps: {
    today: {
      path: "/app/overview",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
      component: "AppOverview",
      roles: ["user", "admin"],
      module: "dailyOps",
    },
    managerShift: {
      path: "/shift",
      label: "Shift",
      icon: Sparkles,
      exact: true,
      component: "ManagerShift",
      roles: ["admin"],
      module: "dailyOps",
      description: "Manager briefing, duties, and handoff",
    },
  },

  // TASKS
  tasks: {
    staffTasks: {
      path: "/tasks",
      label: "Staff Tasks",
      icon: ClipboardList,
      exact: true,
      component: "StaffTasks",
      roles: ["user", "admin"],
      module: "tasks",
      description: "View your assigned prep, side work, and cleaning tasks",
    },
    sideWork: {
      path: "/tasks?tab=sidework",
      label: "Side Work",
      icon: CheckSquare,
      component: "StaffTasks",
      roles: ["user", "admin"],
      module: "tasks",
      description: "Side work assignments with role-based views",
    },
    prepLists: {
      path: "/tasks?tab=prep",
      label: "Prep Lists",
      icon: ClipboardList,
      component: "StaffTasks",
      roles: ["admin", "user"],
      module: "tasks",
      description: "Create and manage prep lists",
    },
    cleaningChecklist: {
      path: "/cleaning",
      label: "Cleaning Checklists",
      icon: ShowerHead,
      component: "Cleaning",
      roles: ["user", "admin"],
      module: "tasks",
      description: "Opening and closing checklists",
    },
  },

  // COMPLIANCE & LOGS (CONSOLIDATED)
  compliance: {
    logs: {
      path: "/logs",
      label: "Logs",
      icon: Flame,
      exact: true,
      component: "LogsCenter",
      roles: ["user", "admin"],
      module: "compliance",
      description: "Temperature, waste, incident logs",
    },
    tempLogTemplates: {
      path: "/temp-log-templates",
      label: "Temperature Log Templates",
      icon: LayoutTemplate,
      component: "TemperatureLogTemplates",
      roles: ["admin"],
      module: "templates",
      description: "Create reusable temperature log templates",
    },
    wasteLog: {
      path: "/logs?type=waste",
      label: "Waste & 86",
      icon: Droplet,
      component: "LogsCenter",
      roles: ["user", "admin"],
      module: "compliance",
      description: "Log waste, compost, and 86'd items",
    },
    bathroomChecks: {
      path: "/logs?type=bathroom",
      label: "Bathroom Checks",
      icon: ShowerHead,
      component: "LogsCenter",
      roles: ["user", "admin"],
      module: "compliance",
      description: "Facility cleanliness checks",
    },
  },

  // TEMPLATES
  templates: {
    prepTemplates: {
      path: "/prep-templates",
      label: "Prep Templates",
      icon: LayoutTemplate,
      component: "PrepTemplatesManager",
      roles: ["admin"],
      module: "templates",
      description: "Create reusable prep list templates",
    },
    sideWorkTemplates: {
      path: "/side-work-templates",
      label: "Side Work Templates",
      icon: LayoutTemplate,
      component: "SideWorkTemplates",
      roles: ["admin"],
      module: "templates",
      description: "Create reusable side work templates",
    },
    cleaningTemplates: {
      path: "/cleaning-templates",
      label: "Cleaning Templates",
      icon: LayoutTemplate,
      component: "CleaningTemplates",
      roles: ["admin"],
      module: "templates",
      description: "Create reusable cleaning checklists",
    },
    wasteTemplates: {
      path: "/waste-templates",
      label: "Waste Templates",
      icon: LayoutTemplate,
      component: "WasteTemplates",
      roles: ["admin"],
      module: "templates",
      description: "Create reusable waste log templates",
    },
    eightsixTemplates: {
      path: "/86-templates",
      label: "86 Templates",
      icon: LayoutTemplate,
      component: "EightySixTemplates",
      roles: ["admin"],
      module: "templates",
      description: "Create reusable 86 log templates",
    },
  },

  // MANAGEMENT
  management: {
    restaurantLayout: {
      path: "/restaurant-layout",
      label: "Restaurant Layout",
      icon: Building2,
      component: "RestaurantLayout",
      roles: ["admin"],
      module: "management",
      description: "Area → Station → Equipment hierarchy",
    },
    stations: {
      path: "/stations",
      label: "Stations",
      icon: Building2,
      component: "Stations",
      roles: ["admin"],
      module: "management",
      description: "Manage kitchen and service stations",
    },
    jobCodes: {
      path: "/job-codes",
      label: "Job Codes",
      icon: Users,
      component: "JobCodes",
      roles: ["admin"],
      module: "management",
      description: "Manage job code roles and assignments",
    },
    scheduleImport: {
      path: "/schedule-import",
      label: "Schedule Import",
      icon: Calendar,
      component: "ScheduleImport",
      roles: ["admin"],
      module: "management",
      description: "Bulk import weekly staff schedules from R365, CSV, or Excel",
    },
  },

  // KNOWLEDGE & REFERENCE
  knowledge: {
    knowledge: {
      path: "/knowledge",
      label: "Knowledge Hub",
      icon: BookOpen,
      exact: true,
      component: "Knowledge",
      roles: ["user", "admin"],
      module: "knowledge",
      description: "Recipes, guides, standards, and vendor info",
    },
    recipes: {
      path: "/recipes",
      label: "Recipes & Build Cards",
      icon: ChefHat,
      component: "Recipes",
      roles: ["user", "admin"],
      module: "knowledge",
      description: "All recipes and build instructions",
    },
    standards: {
      path: "/standards",
      label: "Standards & Procedures",
      icon: Book,
      component: "Standards",
      roles: ["admin", "user"],
      module: "knowledge",
      description: "SOPs, standards, and guidelines",
    },
    chemicals: {
      path: "/chemical-library",
      label: "Chemicals / SDS",
      icon: AlertTriangle,
      component: "ChemicalLibrary",
      roles: ["admin", "user"],
      module: "knowledge",
      description: "Chemical assignments, safety data sheets, and compliance docs",
    },
    templates: {
      path: "/templates",
      label: "Legacy Templates",
      icon: LayoutTemplate,
      component: "TemplateManager",
      roles: ["admin"],
      module: "knowledge",
      description: "Manage task and checklist templates",
    },
    vendors: {
      path: "/vendors",
      label: "Vendors",
      icon: Truck,
      component: "Vendors",
      roles: ["admin", "user"],
      module: "knowledge",
      description: "Contact and order information",
    },
  },

  // ITEM MASTER
  itemMaster: {
    purchasedItems: {
      path: '/purchased-items',
      label: 'Purchased Items',
      icon: Package,
      component: 'PurchasedItems',
      roles: ['admin'],
      module: 'itemMaster',
      description: 'Item master for recipe costing, inventory, vendors, and waste',
    },
  },

  // OPERATIONS & MANAGEMENT
  operations: {
    schedule: {
      path: "/schedule",
      label: "Schedule Center",
      icon: Calendar,
      component: "ScheduleCenter",
      roles: ["admin"],
      module: "operations",
      description: "Staff schedules, imports, and assignments",
    },
    inventory: {
      path: "/inventory",
      label: "Inventory",
      icon: Warehouse,
      component: "InventorySimplified",
      roles: ["admin", "user"],
      module: "operations",
      description: "Track stock levels and reorder points",
    },
    team: {
      path: "/team",
      label: "Team Directory",
      icon: Users,
      component: "TeamCenter",
      roles: ["admin"],
      module: "operations",
      description: "Staff management and certifications",
    },
    reports: {
      path: "/reports",
      label: "Reports & Analytics",
      icon: BarChart2,
      component: "Reports",
      roles: ["admin"],
      module: "operations",
      description: "Daily, weekly, and performance reports",
    },
  },

  // SETTINGS & ACCOUNT
  settings: {
    profile: {
      path: "/profile",
      label: "My Profile",
      icon: User,
      component: "Profile",
      roles: ["user", "admin"],
      module: "settings",
      description: "Personal account settings",
    },
    restaurant: {
      path: "/my-restaurant",
      label: "Restaurant Setup",
      icon: Building2,
      component: "MyRestaurant",
      roles: ["admin"],
      module: "settings",
      description: "Departments, areas, equipment, and settings",
    },
    more: {
      path: "/more",
      label: "More",
      icon: MoreHorizontal,
      component: "More",
      roles: ["user", "admin"],
      module: "settings",
      description: "All features and settings",
    },
    notifications: {
      path: "/notifications",
      label: "Notifications",
      icon: Bell,
      component: "NotificationSettings",
      roles: ["user", "admin"],
      module: "settings",
      description: "Alert preferences and settings",
    },
  },
};

/**
 * QUICK ACTIONS (Today page)
 * NOTE: Use quickActionsConfig from lib/quickActionsConfig.js instead
 */
export const quickActions = []; // Deprecated - use quickActionsConfig

/**
 * UTILITY FUNCTIONS
 */

/**
 * Find route by path
 */
export function findRouteByPath(path) {
  for (const moduleKey in allRoutes) {
    for (const routeKey in allRoutes[moduleKey]) {
      if (allRoutes[moduleKey][routeKey].path === path) {
        return allRoutes[moduleKey][routeKey];
      }
    }
  }
  return null;
}

/**
 * Find route by component name
 */
export function findRouteByComponent(componentName) {
  for (const moduleKey in allRoutes) {
    for (const routeKey in allRoutes[moduleKey]) {
      if (allRoutes[moduleKey][routeKey].component === componentName) {
        return allRoutes[moduleKey][routeKey];
      }
    }
  }
  return null;
}

/**
 * Get all routes flattened
 */
export function getAllRoutesFlattened() {
  const flat = [];
  for (const moduleKey in allRoutes) {
    for (const routeKey in allRoutes[moduleKey]) {
      flat.push(allRoutes[moduleKey][routeKey]);
    }
  }
  return flat;
}

/**
 * Get routes for specific module
 */
export function getModuleRoutes(moduleKey) {
  return allRoutes[moduleKey] || {};
}

/**
 * Check if user has access to route
 */
export function canAccessRoute(route, userRole) {
  if (!route.roles) return true;
  return route.roles.includes(userRole);
}
