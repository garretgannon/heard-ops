export const ROLE_DEFINITIONS = {
  manager: {
    label: 'General Manager',
    icon: 'Shield',
    color: 'text-purple-400',
    permissions: {
      canViewDashboard: true,
      canViewLogs: true,
      canViewSchedule: true,
      canViewTeam: true,
      canViewInventory: true,
      canViewIssues: true,
      canCreateLogs: true,
      canApproveItems: true,
      canViewHandoffs: true,
      canViewReports: true,
      canAccessKnowledge: true,
    },
    visibleModules: ['dashboard', 'logs', 'schedule', 'team', 'issues', 'reports', 'knowledge', 'handoffs'],
    quickActions: ['manager_log', 'view_handoff', 'approve_tasks', 'staffing'],
    defaultView: '/today',
  },
  kitchen_lead: {
    label: 'Kitchen Lead',
    icon: 'ChefHat',
    color: 'text-orange-400',
    permissions: {
      canViewDashboard: true,
      canViewLogs: true,
      canViewPrep: true,
      canAssignPrep: true,
      canViewStations: true,
      canCreateLogs: true,
      canViewKnowledge: true,
      canAccessRecipes: true,
      canAccessBuildCards: true,
    },
    visibleModules: ['dashboard', 'prep', 'sidework', 'logs', 'knowledge', 'cleaning'],
    quickActions: ['add_prep', 'add_sidework', 'temp_log', 'issue'],
    defaultView: '/today',
  },
  server: {
    label: 'Server',
    icon: 'Users',
    color: 'text-blue-400',
    permissions: {
      canViewDashboard: true,
      canViewAssignedTasks: true,
      canViewLogs: true,
      canCreateLogs: true,
      canViewKnowledge: true,
    },
    visibleModules: ['dashboard', 'tasks', 'logs', 'knowledge'],
    quickActions: ['add_task', 'manager_log', 'issue'],
    defaultView: '/today',
  },
  prep_cook: {
    label: 'Prep Cook',
    icon: 'Utensils',
    color: 'text-amber-400',
    permissions: {
      canViewDashboard: true,
      canViewAssignedPrep: true,
      canViewLogs: true,
      canCreateLogs: true,
      canViewKnowledge: true,
      canAccessRecipes: true,
    },
    visibleModules: ['dashboard', 'prep', 'logs', 'knowledge'],
    quickActions: ['view_prep', 'temp_log', 'manager_log'],
    defaultView: '/today',
  },
  cook: {
    label: 'Cook',
    icon: 'Flame',
    color: 'text-red-400',
    permissions: {
      canViewDashboard: true,
      canViewAssignedTasks: true,
      canViewLogs: true,
      canCreateLogs: true,
      canViewKnowledge: true,
      canAccessRecipes: true,
    },
    visibleModules: ['dashboard', 'tasks', 'logs', 'knowledge'],
    quickActions: ['temp_log', 'manager_log', 'issue'],
    defaultView: '/today',
  },
  bartender: {
    label: 'Bartender',
    icon: 'Wine',
    color: 'text-cyan-400',
    permissions: {
      canViewDashboard: true,
      canViewAssignedTasks: true,
      canViewLogs: true,
      canCreateLogs: true,
      canViewKnowledge: true,
      canAccessRecipes: true,
      canAccessBuildCards: true,
    },
    visibleModules: ['dashboard', 'tasks', 'logs', 'knowledge'],
    quickActions: ['view_sidework', 'manager_log', 'issue'],
    defaultView: '/today',
  },
};

export function getRoleDefinition(role) {
  return ROLE_DEFINITIONS[role] || null;
}

export function hasPermission(role, permission) {
  const definition = getRoleDefinition(role);
  if (!definition) return false;
  return definition.permissions[permission] === true;
}

export function getVisibleModules(role) {
  const definition = getRoleDefinition(role);
  return definition?.visibleModules || [];
}

export function shouldShowModule(role, moduleName) {
  return getVisibleModules(role).includes(moduleName);
}