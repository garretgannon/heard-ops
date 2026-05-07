/**
 * Role-based visibility configuration
 * Define what each role can access and modify
 */

export const ROLE_DEFINITIONS = {
  admin: {
    label: 'Admin',
    color: 'text-red-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: true,
      team_tab: true,
      more_tab: true,
      quick_actions: true,
      templates: true,
      reports: true,
      employee_notes: true,
      manager_notes: true,
      beo_events: true,
      inventory: true,
      recipes: true,
      vendors: true,
      equipment: true,
      settings: true,
      role_management: true,
      billing: true,
    },
    canEdit: ['all'],
    canReview: ['all'],
  },

  manager: {
    label: 'Manager',
    color: 'text-amber-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: true,
      team_tab: true,
      more_tab: true,
      quick_actions: ['add_log', 'report_incident', 'shift_handoff'],
      templates: true,
      reports: true,
      employee_notes: true,
      manager_notes: true,
      beo_events: true,
      inventory: true,
      recipes: true,
      vendors: true,
      equipment: true,
      settings: false,
      role_management: false,
    },
    canEdit: ['logs', 'employee_notes', 'handoff'],
    canReview: ['tasks', 'logs'],
  },

  kitchen_lead: {
    label: 'Kitchen Lead',
    color: 'text-orange-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['temperature', 'maintenance', 'waste'],
      team_tab: false,
      more_tab: false,
      quick_actions: ['add_log', 'temp_log'],
      templates: ['prep', 'temperature'],
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: true,
      inventory: true,
      recipes: true,
      vendors: false,
      equipment: true,
    },
    canEdit: ['logs', 'templates'],
    canReview: [],
  },

  line_cook: {
    label: 'Line Cook',
    color: 'text-orange-400',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['temperature', 'waste'],
      team_tab: false,
      more_tab: false,
      quick_actions: ['add_log', 'temp_log'],
      templates: false,
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: true,
      inventory: true,
      recipes: true,
      vendors: false,
      equipment: false,
    },
    canEdit: ['logs'],
    canReview: [],
  },

  prep_cook: {
    label: 'Prep Cook',
    color: 'text-yellow-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['temperature', 'waste'],
      team_tab: false,
      more_tab: false,
      quick_actions: ['add_log'],
      templates: false,
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: false,
      inventory: false,
      recipes: true,
      vendors: false,
      equipment: false,
    },
    canEdit: ['logs'],
    canReview: [],
  },

  dishwasher: {
    label: 'Dishwasher',
    color: 'text-blue-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['maintenance'],
      team_tab: false,
      more_tab: false,
      quick_actions: ['add_log'],
      templates: false,
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: false,
      inventory: false,
      recipes: false,
      vendors: false,
      equipment: false,
    },
    canEdit: ['logs'],
    canReview: [],
  },

  server: {
    label: 'Server',
    color: 'text-green-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['bathroom', 'incident'],
      team_tab: false,
      more_tab: false,
      quick_actions: ['add_log'],
      templates: false,
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: true,
      inventory: false,
      recipes: false,
      vendors: false,
      equipment: false,
    },
    canEdit: ['logs'],
    canReview: [],
  },

  bartender: {
    label: 'Bartender',
    color: 'text-purple-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['bathroom', 'incident'],
      team_tab: false,
      more_tab: false,
      quick_actions: ['add_log'],
      templates: false,
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: true,
      inventory: false,
      recipes: false,
      vendors: false,
      equipment: false,
    },
    canEdit: ['logs'],
    canReview: [],
  },

  host: {
    label: 'Host',
    color: 'text-cyan-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['incident'],
      team_tab: false,
      more_tab: false,
      quick_actions: false,
      templates: false,
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: true,
      inventory: false,
      recipes: false,
      vendors: false,
      equipment: false,
    },
    canEdit: [],
    canReview: [],
  },

  busser: {
    label: 'Support/Busser',
    color: 'text-teal-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['bathroom', 'maintenance'],
      team_tab: false,
      more_tab: false,
      quick_actions: ['add_log'],
      templates: false,
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: false,
      inventory: false,
      recipes: false,
      vendors: false,
      equipment: false,
    },
    canEdit: ['logs'],
    canReview: [],
  },

  expo: {
    label: 'Expo',
    color: 'text-indigo-500',
    canSee: {
      today_tab: true,
      shift_tab: true,
      logs_tab: ['temperature', 'incident'],
      team_tab: false,
      more_tab: false,
      quick_actions: ['add_log'],
      templates: false,
      reports: false,
      employee_notes: false,
      manager_notes: false,
      beo_events: true,
      inventory: false,
      recipes: true,
      vendors: false,
      equipment: false,
    },
    canEdit: ['logs'],
    canReview: [],
  },
};

export const ROLE_CATEGORIES = {
  kitchen: ['kitchen_lead', 'line_cook', 'prep_cook', 'expo', 'dishwasher'],
  foh: ['server', 'bartender', 'host', 'busser'],
  management: ['manager', 'admin'],
};

/**
 * Check if a role can see a feature
 */
export function canSeeFeature(role, feature, subFeature = null) {
  const roleConfig = ROLE_DEFINITIONS[role];
  if (!roleConfig) return false;

  const permission = roleConfig.canSee[feature];
  if (permission === true) return true;
  if (permission === false) return false;

  // Array-based: check if subFeature is in the array
  if (Array.isArray(permission) && subFeature) {
    return permission.includes(subFeature);
  }

  return false;
}

/**
 * Check if a role can edit a resource type
 */
export function canEditResource(role, resourceType) {
  const roleConfig = ROLE_DEFINITIONS[role];
  if (!roleConfig) return false;

  return (
    roleConfig.canEdit.includes('all') ||
    roleConfig.canEdit.includes(resourceType)
  );
}

/**
 * Check if a role can review content
 */
export function canReviewContent(role, contentType) {
  const roleConfig = ROLE_DEFINITIONS[role];
  if (!roleConfig) return false;

  return (
    roleConfig.canReview.includes('all') ||
    roleConfig.canReview.includes(contentType)
  );
}

/**
 * Get all roles for selection (admin only)
 */
export function getAllRoles() {
  return Object.entries(ROLE_DEFINITIONS).map(([id, config]) => ({
    id,
    label: config.label,
    color: config.color,
  }));
}