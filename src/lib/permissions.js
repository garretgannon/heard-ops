/**
 * HeardOS Granular Permission System
 * Central source of truth for all permission keys and default role assignments.
 * Custom overrides are stored in Settings entity as JSON under key `role_permissions_<role>`.
 */

export const PERMISSIONS = {
  VIEW_DASHBOARD:      'view_dashboard',
  VIEW_PULSE:          'view_pulse',
  VIEW_LOGS:           'view_logs',
  SUBMIT_LOGS:         'submit_logs',
  APPROVE_LOGS:        'approve_logs',
  VIEW_PRIVATE_LOGS:   'view_private_logs',
  VIEW_TEAM:           'view_team',
  MANAGE_USERS:        'manage_users',
  VIEW_SCHEDULE:       'view_schedule',
  VIEW_LABOR:          'view_labor',
  VIEW_REPORTS:        'view_reports',
  VIEW_INVENTORY:      'view_inventory',
  VIEW_RECIPES:        'view_recipes',
  VIEW_VENDORS:        'view_vendors',
  VIEW_BEOS:           'view_beos',
  VIEW_TRAINING:       'view_training',
  VIEW_TEMPLATES:      'view_templates',
  MANAGE_TEMPLATES:    'manage_templates',
  VIEW_KNOWLEDGE:      'view_knowledge',
  COMPLETE_TASKS:      'complete_tasks',
  EDIT_PREP_LISTS:     'edit_prep_lists',
  MANAGE_SETTINGS:     'manage_settings',
};

export const PERMISSION_LABELS = {
  view_dashboard:    'View Dashboard',
  view_pulse:        'View Pulse / Analytics',
  view_logs:         'View Logs',
  submit_logs:       'Submit Logs',
  approve_logs:      'Approve Logs',
  view_private_logs: 'View Private / Employee Logs',
  view_team:         'View Team Directory',
  manage_users:      'Manage Users',
  view_schedule:     'View Schedule',
  view_labor:        'View Labor / Pay Data',
  view_reports:      'View Reports',
  view_inventory:    'View Inventory',
  view_recipes:      'View Recipes',
  view_vendors:      'View Vendors',
  view_beos:         'View BEOs / Events',
  view_training:     'View Training',
  view_templates:    'View Templates',
  manage_templates:  'Manage Templates',
  view_knowledge:    'View Knowledge Base',
  complete_tasks:    'Complete Tasks',
  edit_prep_lists:   'Edit Prep Lists',
  manage_settings:   'Manage App Settings',
};

export const PERMISSION_GROUPS = [
  {
    label: 'Navigation',
    keys: ['view_dashboard', 'view_pulse', 'view_logs', 'view_team', 'view_knowledge'],
  },
  {
    label: 'Logs & Compliance',
    keys: ['submit_logs', 'approve_logs', 'view_private_logs'],
  },
  {
    label: 'Operations',
    keys: ['complete_tasks', 'edit_prep_lists', 'view_inventory', 'view_beos'],
  },
  {
    label: 'Knowledge & Training',
    keys: ['view_recipes', 'view_training', 'view_templates', 'manage_templates'],
  },
  {
    label: 'Management',
    keys: ['view_schedule', 'view_labor', 'view_reports', 'view_vendors', 'manage_users', 'manage_settings'],
  },
];

// Default permissions per role — overridable via Settings entity
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS).reduce((acc, p) => ({ ...acc, [p]: true }), {}),

  general_manager: {
    view_dashboard: true, view_pulse: true, view_logs: true, submit_logs: true,
    approve_logs: true, view_private_logs: true, view_team: true, manage_users: true,
    view_schedule: true, view_labor: true, view_reports: true, view_inventory: true,
    view_recipes: true, view_vendors: true, view_beos: true, view_training: true,
    view_templates: true, manage_templates: true, view_knowledge: true,
    complete_tasks: true, edit_prep_lists: true, manage_settings: false,
  },

  manager: {
    view_dashboard: true, view_pulse: true, view_logs: true, submit_logs: true,
    approve_logs: true, view_private_logs: true, view_team: true, manage_users: false,
    view_schedule: true, view_labor: true, view_reports: true, view_inventory: true,
    view_recipes: true, view_vendors: true, view_beos: true, view_training: true,
    view_templates: true, manage_templates: false, view_knowledge: true,
    complete_tasks: true, edit_prep_lists: true, manage_settings: false,
  },

  kitchen_lead: {
    view_dashboard: true, view_pulse: false, view_logs: true, submit_logs: true,
    approve_logs: false, view_private_logs: false, view_team: false, manage_users: false,
    view_schedule: false, view_labor: false, view_reports: false, view_inventory: true,
    view_recipes: true, view_vendors: false, view_beos: true, view_training: true,
    view_templates: true, manage_templates: false, view_knowledge: true,
    complete_tasks: true, edit_prep_lists: true, manage_settings: false,
  },

  cook: {
    view_dashboard: true, view_pulse: false, view_logs: true, submit_logs: true,
    approve_logs: false, view_private_logs: false, view_team: false, manage_users: false,
    view_schedule: false, view_labor: false, view_reports: false, view_inventory: false,
    view_recipes: true, view_vendors: false, view_beos: false, view_training: true,
    view_templates: false, manage_templates: false, view_knowledge: true,
    complete_tasks: true, edit_prep_lists: true, manage_settings: false,
  },

  server: {
    view_dashboard: true, view_pulse: false, view_logs: true, submit_logs: true,
    approve_logs: false, view_private_logs: false, view_team: false, manage_users: false,
    view_schedule: false, view_labor: false, view_reports: false, view_inventory: false,
    view_recipes: false, view_vendors: false, view_beos: true, view_training: true,
    view_templates: false, manage_templates: false, view_knowledge: true,
    complete_tasks: true, edit_prep_lists: false, manage_settings: false,
  },

  bartender: {
    view_dashboard: true, view_pulse: false, view_logs: true, submit_logs: true,
    approve_logs: false, view_private_logs: false, view_team: false, manage_users: false,
    view_schedule: false, view_labor: false, view_reports: false, view_inventory: false,
    view_recipes: true, view_vendors: false, view_beos: true, view_training: true,
    view_templates: false, manage_templates: false, view_knowledge: true,
    complete_tasks: true, edit_prep_lists: false, manage_settings: false,
  },

  host: {
    view_dashboard: true, view_pulse: false, view_logs: true, submit_logs: true,
    approve_logs: false, view_private_logs: false, view_team: false, manage_users: false,
    view_schedule: false, view_labor: false, view_reports: false, view_inventory: false,
    view_recipes: false, view_vendors: false, view_beos: true, view_training: true,
    view_templates: false, manage_templates: false, view_knowledge: true,
    complete_tasks: true, edit_prep_lists: false, manage_settings: false,
  },

  dishwasher: {
    view_dashboard: true, view_pulse: false, view_logs: true, submit_logs: true,
    approve_logs: false, view_private_logs: false, view_team: false, manage_users: false,
    view_schedule: false, view_labor: false, view_reports: false, view_inventory: false,
    view_recipes: false, view_vendors: false, view_beos: false, view_training: true,
    view_templates: false, manage_templates: false, view_knowledge: false,
    complete_tasks: true, edit_prep_lists: false, manage_settings: false,
  },
};

export function getDefaultPermissions(role) {
  return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.cook;
}

export const ALL_ROLES = [
  { id: 'admin',           label: 'Admin',           color: 'text-red-400' },
  { id: 'general_manager', label: 'General Manager',  color: 'text-purple-400' },
  { id: 'manager',         label: 'Manager',          color: 'text-amber-400' },
  { id: 'kitchen_lead',    label: 'Kitchen Lead',     color: 'text-orange-400' },
  { id: 'cook',            label: 'Cook',             color: 'text-yellow-400' },
  { id: 'server',          label: 'Server',           color: 'text-green-400' },
  { id: 'bartender',       label: 'Bartender',        color: 'text-cyan-400' },
  { id: 'host',            label: 'Host',             color: 'text-blue-400' },
  { id: 'dishwasher',      label: 'Dishwasher',       color: 'text-slate-400' },
];