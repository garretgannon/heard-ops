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
  TrendingUp,
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
  Wrench,
  Wine,
  DollarSign,
  Notebook,
  ChefHat,
  LayoutTemplate,
  Package,
  MoreVertical,
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
    id: "add",
    label: "Add",
    path: "/logs",
    icon: Plus,
    description: "Quick add logs and issues",
    module: "compliance",
    perm: "view_logs",
    isAdd: true,
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
  {
    label: "WORK",
    items: [
      { path: "/app/overview", label: "Overview", icon: LayoutDashboard },
      { path: "/shift", label: "Shift", icon: Sparkles },
      { path: "/logs", label: "Logs", icon: FileText, perm: "view_logs" },
      { path: "/approvals", label: "Approvals", icon: CheckSquare },
      { path: "/team", label: "Team", icon: Users, perm: "view_team" },
    ],
  },
  {
    label: "KNOWLEDGE",
    items: [
      { path: "/recipes", label: "Recipes", icon: ChefHat, perm: "view_recipes" },
      { path: "/training", label: "Training", icon: BookOpen },
      { path: "/chemical-library", label: "Chemicals", icon: AlertTriangle },
    ],
  },
  {
    label: "RESOURCES",
    items: [
      { path: "/inventory", label: "Inventory", icon: Warehouse, perm: "view_inventory" },
      { path: "/purchased-items", label: "Purchased Items", icon: Package },
      { path: "/vendors", label: "Vendors", icon: Truck, perm: "view_vendors" },
    ],
  },
  {
    label: "PLANNING",
    items: [
      { path: "/prep-planning", label: "Prep Planning", icon: ClipboardList, perm: "edit_prep_lists" },
      { path: "/schedule", label: "Schedule", icon: Calendar, perm: "view_schedule" },
      { path: "/reservations", label: "BEOs / Events", icon: LayoutTemplate, perm: "view_beos" },
      { path: "/shift-handoff", label: "Shift Handoff", icon: TrendingUp },
    ],
  },
  {
    label: "SETUP",
    items: [
      { path: "/templates", label: "Templates", icon: ClipboardList, perm: "view_templates" },
      { path: "/people", label: "Team", icon: GitBranch },
      { path: "/operational-map", label: "Operations", icon: Map },
      { path: "/automation-rules", label: "Automation", icon: Zap },
      { path: "/reports", label: "Reports", icon: BarChart2, perm: "view_reports" },
      { path: "/my-restaurant", label: "My Restaurant", icon: Building2 },
      { path: "/admin/command-center", label: "Roles & Access", icon: ShieldCheck, perm: "manage_settings" },
      { path: "/profile", label: "Settings", icon: Settings },
    ],
  },
];

export const moreNavSections = [
  {
    title: "Operations",
    items: [
      { label: "Prep Planning", detail: "Plan production", path: "/prep-planning", icon: ClipboardList, status: "status-info" },
      { label: "Shift Handoff", detail: "Manager transition", path: "/shift-handoff", icon: Sparkles, status: "status-neutral" },
      { label: "Logs", detail: "History and records", path: "/logs", icon: FileText, status: "status-neutral" },
      { label: "Comms", detail: "Announcements and station notes", path: "/comms", icon: MessageSquare, status: "status-warning" },
      { label: "BEOs / Events", detail: "Reservations and events", path: "/reservations", icon: Calendar, status: "status-info" },
      { label: "Reports", detail: "Operational trends", path: "/reports", icon: BarChart2, status: "status-neutral" },
    ],
  },
  {
    title: "Food & Inventory",
    items: [
      { label: "Recipes", detail: "Recipes and build cards", path: "/recipes", icon: ChefHat, status: "status-info" },
      { label: "Inventory", detail: "Stock and counts", path: "/inventory", icon: Warehouse, status: "status-neutral" },
      { label: "Purchased Items", detail: "Goods and prices", path: "/purchased-items", icon: Package, status: "status-neutral" },
      { label: "Vendors", detail: "Contacts and ordering", path: "/vendors", icon: Truck, status: "status-neutral" },
    ],
  },
  {
    title: "Knowledge",
    items: [
      { label: "Training", detail: "Team learning", path: "/training", icon: BookOpen, status: "status-success" },
      { label: "Chemicals / SDS", detail: "Safety data sheets", path: "/chemical-library", icon: AlertTriangle, status: "status-info" },
    ],
  },
  {
    title: "Restaurant Setup",
    items: [
      { label: "Team Structure", detail: "People hierarchy", path: "/people", icon: GitBranch, status: "status-neutral" },
      { label: "Restaurant", detail: "Location settings", path: "/my-restaurant", icon: Building2, status: "status-neutral" },
      { label: "Profile & Settings", detail: "Account preferences", path: "/profile", icon: Settings, status: "status-neutral" },
    ],
  },
];

export const morePrimaryActions = [
  { label: "Templates", detail: "Task, prep, cleaning", path: "/templates", icon: LayoutTemplate, status: "status-info" },
  { label: "Roles", detail: "Access and permissions", path: "/admin/command-center", icon: ShieldCheck, status: "status-neutral" },
  { label: "Automation", detail: "Rules and escalations", path: "/automation-rules", icon: Zap, status: "status-warning" },
];

/**
 * ALL ROUTES (organized by module)
 * Includes legacy redirects
 */
export const allRoutes = {
  // DAILY OPERATIONS
  dailyOps: {
    today: {
      path: "/",
      label: "Today Command Center",
      icon: LayoutDashboard,
      exact: true,
      component: "TodaysCommandCenter",
      roles: ["user", "admin"],
      module: "dailyOps",
    },
    shiftHandoff: {
      path: "/shift-handoff",
      label: "Shift Handoff",
      icon: TrendingUp,
      component: "ShiftHandoff",
      roles: ["admin"],
      module: "dailyOps",
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
      path: "/side-work",
      label: "Side Work",
      icon: CheckSquare,
      component: "SideWork",
      roles: ["user", "admin"],
      module: "tasks",
      description: "Side work assignments with role-based views",
      legacyPaths: ["/SideWork", "/SideWorkManager", "/SideWorkStaff", "/SideWorkProduction"],
    },
    prepLists: {
      path: "/prep-lists",
      label: "Prep Lists",
      icon: ClipboardList,
      component: "PrepLists",
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
      component: "Logs",
      roles: ["user", "admin"],
      module: "compliance",
      description: "Temperature, waste, incident logs",
      legacyPaths: ["/Logs", "/ManagerLog", "/NewLog", "/TempLogs", "/temp-logs", "/IssueTracker", "/MaintenanceRequests", "/IncidentReports", "/Incidents"],
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
      path: "/waste-86",
      label: "Waste & 86",
      icon: Droplet,
      component: "WasteLog",
      roles: ["user", "admin"],
      module: "compliance",
      description: "Log waste, compost, and 86'd items",
      legacyPaths: ["/waste-log"],
    },
    bathroomChecks: {
      path: "/bathroom-checks",
      label: "Bathroom Checks",
      icon: ShowerHead,
      component: "BathroomChecks",
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
      component: "RecipesAndBuildCards",
      roles: ["user", "admin"],
      module: "knowledge",
      description: "All recipes and build instructions",
      legacyPaths: ["/Recipes", "/RecipeBuildCard", "/BuildBook", "/BarBook"],
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
    msds: {
      path: "/msds",
      label: "MSDS & Safety",
      icon: AlertTriangle,
      component: "MSDS",
      roles: ["admin", "user"],
      module: "knowledge",
      description: "Safety data sheets and compliance docs",
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
      legacyPaths: ["/ScheduleCenter", "/Calendar", "/EmployeeCalendar", "/ScheduleImport", "/R365ScheduleImport"],
    },
    inventory: {
      path: "/inventory",
      label: "Inventory",
      icon: Warehouse,
      component: "InventorySimplified",
      roles: ["admin", "user"],
      module: "operations",
      description: "Track stock levels and reorder points",
      legacyPaths: ["/Inventory", "/InventoryControl", "/InventorySimplified"],
    },
    team: {
      path: "/team",
      label: "Team Directory",
      icon: Users,
      component: "RestaurantTeam",
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
 * LEGACY REDIRECT MAP
 * Maps old routes to their new consolidated homes
 */
export const legacyRedirects = {
  "/": "/today", // Public page fallback
  "/Inventory": "/inventory",
  "/InventoryControl": "/inventory",
  "/InventorySimplified": "/inventory",
  "/Recipes": "/recipes",
  "/RecipeBuildCard": "/recipes",
  "/BuildBook": "/recipes",
  "/BarBook": "/recipes",
  "/RecipesAndBuildCards": "/recipes",
  "/ManagerLog": "/logs",
  "/NewLog": "/logs",
  "/TempLogs": "/logs?view=temperature",
  "/temp-logs": "/logs?view=temperature",
  "/MaintenanceRequests": "/logs?view=maintenance",
  "/IncidentReports": "/logs?view=incident",
  "/Incidents": "/logs?view=incident",
  "/IssueTracker": "/logs?view=issues",
  "/issues": "/logs?view=issues",
  "/Calendar": "/schedule",
  "/EmployeeCalendar": "/schedule",
  "/ScheduleImport": "/schedule",
  "/R365ScheduleImport": "/schedule",
  "/SideWork": "/side-work",
  "/SideWorkManager": "/side-work",
  "/SideWorkStaff": "/side-work",
  "/SideWorkProduction": "/side-work",
  "/waste-log": "/waste-86",
};

/**
 * MORE PAGE STRUCTURE
 * Organized module groups for the More menu
 */
export const morePageStructure = {
  kitchen: {
    title: "Kitchen",
    description: "Back of house operations",
    items: [
      "prepLists",
      "prepTemplates",
      "recipes",
    ],
  },
  foh: {
    title: "Front of House",
    description: "Service and side work",
    items: [
      "sideWork",
      "sideWorkTemplates",
    ],
  },
  cleaning: {
    title: "Cleaning",
    description: "Checklists and templates",
    items: [
      "cleaningChecklist",
      "cleaningTemplates",
    ],
  },
  foodSafety: {
    title: "Food Safety",
    description: "Temperature and compliance",
    items: [
      "tempLogTemplates",
    ],
  },
  inventory: {
    title: "Inventory",
    description: "Waste and availability",
    items: [
      "purchasedItems",
      "wasteLog",
      "wasteTemplates",
      "eightsixTemplates",
      "vendors",
    ],
  },
  operations: {
    title: "Operations",
    description: "Scheduling",
    items: [
      "schedule",
      "scheduleImport",
      "team",
      "reports",
      "shiftHandoff",
    ],
  },
  management: {
    title: "Management",
    description: "Admin tools and settings",
    items: [
      "stations",
      "jobCodes",
      "templates",
    ],
  },
  settings: {
    title: "Settings",
    description: "Personal and restaurant",
    items: [
      "profile",
      "restaurant",
      "notifications",
      "more",
    ],
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
