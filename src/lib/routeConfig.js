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
} from "lucide-react";

/**
 * BOTTOM NAV ROUTES (5 main navigation points)
 */
export const bottomNavRoutes = [
  {
    id: "today",
    label: "Today",
    path: "/",
    icon: LayoutDashboard,
    description: "Command center & quick actions",
    module: "dailyOps",
  },
  {
    id: "tasks",
    label: "Tasks",
    path: "/tasks",
    icon: ClipboardList,
    description: "Prep & side work tasks",
    module: "tasks",
  },
  {
    id: "logs",
    label: "Logs",
    path: "/logs",
    icon: Flame,
    description: "Temperature & incident logs",
    module: "compliance",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    path: "/knowledge",
    icon: BookOpen,
    description: "Recipes, guides, standards",
    module: "knowledge",
  },
  {
    id: "more",
    label: "More",
    path: "/more",
    icon: MoreHorizontal,
    description: "All other modules",
    module: "more",
  },
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

  // COMPLIANCE & LOGS
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
     legacyPaths: ["/Logs", "/ManagerLog", "/NewLog"],
   },
   tempLogs: {
     path: "/temp-logs",
     label: "Temperature Logs",
     icon: Thermometer,
     component: "TempLogs",
     roles: ["user", "admin"],
     module: "compliance",
     description: "Track cooler and equipment temperatures",
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
   eightySixLog: {
     path: "/86-log",
     label: "86 Log",
     icon: Droplet,
     component: "EightySixLog",
     roles: ["user", "admin"],
     module: "compliance",
     description: "Track unavailable menu items",
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
      component: "PrepTemplates",
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
    tempLogTemplates: {
      path: "/temp-log-templates",
      label: "Temperature Log Templates",
      icon: LayoutTemplate,
      component: "TempLogTemplates",
      roles: ["admin"],
      module: "templates",
      description: "Create reusable temperature log templates",
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
      component: "TemplateList",
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

  // OPERATIONS & MANAGEMENT
  operations: {
    issues: {
      path: "/issues",
      label: "Issues Tracker",
      icon: AlertTriangle,
      component: "IssueTracker",
      roles: ["user", "admin"],
      module: "operations",
      description: "All issues, maintenance, incidents in one place",
      legacyPaths: ["/IssueTracker", "/MaintenanceRequests", "/IncidentReports", "/Incidents"],
    },
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
      label: "My Restaurant",
      icon: Building2,
      component: "MyRestaurant",
      roles: ["admin"],
      module: "settings",
      description: "Restaurant info and preferences",
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
  "/MaintenanceRequests": "/issues",
  "/IncidentReports": "/issues",
  "/Incidents": "/issues",
  "/IssueTracker": "/issues",
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
      "tempLogs",
      "tempLogTemplates",
    ],
  },
  inventory: {
    title: "Inventory",
    description: "Waste and availability",
    items: [
      "wasteLog",
      "wasteTemplates",
      "eightySixLog",
      "eightsixTemplates",
      "vendors",
    ],
  },
  operations: {
    title: "Operations",
    description: "Issues and scheduling",
    items: [
      "issues",
      "schedule",
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