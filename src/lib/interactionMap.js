/**
 * Current interaction registry for the active HeardOS app.
 * Keep this aligned with routeConfig.js, GlobalBottomNav, More, and QuickAddSheet.
 */

export const INTERACTION_TYPES = {
  OPEN_MODAL: 'open_modal',
  OPEN_SHEET: 'open_sheet',
  NAVIGATE: 'navigate',
  SUBMIT_FORM: 'submit_form',
  FILTER_LIST: 'filter_list',
  TOGGLE_STATUS: 'toggle_status',
  OPEN_DETAIL: 'open_detail',
  MARK_COMPLETE: 'mark_complete',
  EDIT_RECORD: 'edit_record',
  DELETE_RECORD: 'delete_record',
  NO_ACTION: 'no_action',
};

export const bottomNavMap = {
  dashboardTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/app/overview',
    staffTarget: '/station-shift',
    label: 'Dashboard / Shift',
  },
  stationsTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/operational-map',
    label: 'Stations',
  },
  addButton: {
    type: INTERACTION_TYPES.OPEN_SHEET,
    target: 'QuickAddSheet',
    label: 'Add',
  },
  shiftTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/shift',
    adminOnly: true,
    label: 'Manager Shift',
  },
  moreTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/more',
    label: 'More',
  },
};

export const quickAddMap = {
  task: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'TemplateCreateModal:add_task',
    label: 'Task',
  },
  managerLog: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'TemplateCreateModal:add_manager_note',
    label: 'Manager Log',
  },
  reservationBeo: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'TemplateCreateModal:add_beo',
    label: 'Reservation / BEO',
  },
  waste: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'TemplateCreateModal:add_waste',
    label: 'Waste',
  },
  maintenance: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'TemplateCreateModal:report_maintenance',
    label: 'Maintenance Issue',
  },
  temperature: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'TemplateCreateModal:log_temperature',
    label: 'Temp Log',
  },
  incident: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'TemplateCreateModal:report_incident',
    label: 'Incident',
  },
};

export const appOverviewMap = {
  readinessMetric: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/operational-map',
    label: 'Open station readiness',
  },
  prepMetric: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/tasks?tab=prep',
    label: 'Open prep tasks',
  },
  sideworkMetric: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/tasks?tab=sidework',
    label: 'Open side work tasks',
  },
  temperatureMetric: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/logs?type=temperature',
    label: 'Open temperature logs',
  },
  incidentsMetric: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/logs?type=incident',
    label: 'Open incident logs',
  },
  reviewMetric: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/logs?view=review',
    label: 'Open review queue',
  },
};

export const managerShiftMap = {
  startBriefingReview: {
    type: INTERACTION_TYPES.SUBMIT_FORM,
    target: 'ManagerLog:create',
    label: 'Acknowledge incoming briefing',
  },
  preShiftBriefingSave: {
    type: INTERACTION_TYPES.SUBMIT_FORM,
    target: 'PreShift:createOrUpdate',
    label: 'Save pre-shift briefing',
  },
  dutyToggle: {
    type: INTERACTION_TYPES.TOGGLE_STATUS,
    target: 'ManagerShift:duties',
    label: 'Toggle manager duty',
  },
  openStations: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/operational-map',
    label: 'Open stations',
  },
  openApprovals: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/approvals',
    label: 'Open approvals',
  },
  closeShiftHandoff: {
    type: INTERACTION_TYPES.SUBMIT_FORM,
    target: 'ShiftHandoff:create',
    label: 'Complete closing handoff',
  },
};

export const stationsMap = {
  areaFilter: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'OperationalMap:areas',
    label: 'Filter stations by area',
  },
  stationCard: {
    type: INTERACTION_TYPES.OPEN_DETAIL,
    target: 'OperationalMap:selectedStation',
    label: 'Open station detail',
  },
  stationWorkflowPrep: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/tasks?tab=prep',
    label: 'Open prep workflow',
  },
  stationWorkflowSidework: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/tasks?tab=sidework',
    label: 'Open side work workflow',
  },
  stationRefresh: {
    type: INTERACTION_TYPES.NO_ACTION,
    target: 'OperationalMap:reload',
    label: 'Refresh station data',
  },
};

export const staffShiftMap = {
  stationHandoffCapture: {
    type: INTERACTION_TYPES.SUBMIT_FORM,
    target: 'StaffShift:handoff',
    label: 'Capture station handoff',
  },
  taskComplete: {
    type: INTERACTION_TYPES.MARK_COMPLETE,
    target: 'GeneratedTask | PrepItem | SideWorkAssignment',
    label: 'Complete assigned station task',
  },
  closeStation: {
    type: INTERACTION_TYPES.SUBMIT_FORM,
    target: 'StaffShift:session',
    label: 'Close station shift',
  },
};

export const staffTasksMap = {
  filterChip: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'StaffTasks:filter',
    label: 'Filter task list',
  },
  prepTaskStart: {
    type: INTERACTION_TYPES.EDIT_RECORD,
    target: 'PrepItem:start',
    label: 'Start prep task',
  },
  sideWorkComplete: {
    type: INTERACTION_TYPES.MARK_COMPLETE,
    target: 'SideWorkAssignment:complete',
    label: 'Complete side work',
  },
  taskOpenSource: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/station-shift',
    fallbackTarget: '/tasks?tab=sidework',
    label: 'Open task source workflow',
  },
};

export const logsMap = {
  logViewToggle: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'LogsCenter:viewMode',
    label: 'Switch log view',
  },
  quickFilterChip: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'LogsCenter:activeFilter',
    label: 'Filter logs',
  },
  createLogButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'LogCreateModal',
    label: 'Create log',
  },
  advancedFiltersButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'AdvancedFilters',
    label: 'Open advanced filters',
  },
  logCard: {
    type: INTERACTION_TYPES.OPEN_DETAIL,
    target: 'LogsDetailDrawer',
    label: 'View log detail',
  },
};

export const knowledgeMap = {
  searchBar: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/search',
    label: 'Search knowledge',
  },
  recipesCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/recipes',
    label: 'Open recipes',
  },
  buildCardsCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/build-cards',
    label: 'Open build cards',
  },
  activeBeosCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/reservations',
    label: 'Open BEOs / events',
  },
  standardsCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/standards',
    label: 'Open standards',
  },
  alertsCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/operational-map',
    label: 'Open operational alerts',
  },
};

export const moreMenuMap = {
  prepPlanning: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/prep-planning',
    label: 'Prep Planning',
  },
  shift: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/shift',
    label: 'Shift',
  },
  logs: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/logs',
    label: 'Logs',
  },
  comms: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/comms',
    label: 'Comms',
  },
  reservations: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/reservations',
    label: 'BEOs / Events',
  },
  reports: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/reports',
    label: 'Reports',
  },
  recipes: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/recipes',
    label: 'Recipes',
  },
  inventory: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/inventory',
    label: 'Inventory',
  },
  purchasedItems: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/purchased-items',
    label: 'Purchased Items',
  },
  vendors: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/vendors',
    label: 'Vendors',
  },
  training: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/training',
    label: 'Training',
  },
  chemicalLibrary: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/chemical-library',
    label: 'Chemicals / SDS',
  },
  people: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/people',
    label: 'Team Structure',
  },
  restaurant: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/my-restaurant',
    label: 'Restaurant',
  },
  profile: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/profile',
    label: 'Profile & Settings',
  },
  templates: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/templates',
    label: 'Templates',
  },
  roles: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/admin/command-center',
    label: 'Roles',
  },
  automation: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/automation-rules',
    label: 'Automation',
  },
};

export const teamMap = {
  employeeCard: {
    type: INTERACTION_TYPES.OPEN_DETAIL,
    target: 'EmployeeEditDrawer',
    label: 'Open employee detail',
  },
  addEmployee: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'EmployeeEditDrawer:create',
    label: 'Add employee',
  },
  rolesTab: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'TeamCenter:tab',
    label: 'Open roles tab',
  },
  jobCodesTab: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'TeamCenter:tab',
    label: 'Open job codes tab',
  },
};

export const layoutHeaderMap = {
  shiftButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/shift',
    label: 'Open Shift',
  },
  logsButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/logs',
    label: 'Open Logs',
  },
  profileLink: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/profile',
    label: 'Open Profile',
  },
};

// Backward-compatible export name for older docs/tests.
export const todayCommandCenterMap = appOverviewMap;
export const restaurantTeamMap = teamMap;

export const currentInteractionMap = {
  appOverview: appOverviewMap,
  bottomNav: bottomNavMap,
  knowledge: knowledgeMap,
  layoutHeader: layoutHeaderMap,
  logs: logsMap,
  managerShift: managerShiftMap,
  moreMenu: moreMenuMap,
  quickAdd: quickAddMap,
  staffShift: staffShiftMap,
  staffTasks: staffTasksMap,
  stations: stationsMap,
  team: teamMap,
};
