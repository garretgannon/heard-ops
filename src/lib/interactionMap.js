/**
 * INTERACTION MAP - Complete Action Registry
 * Centralized source of truth for all clickable elements in HeardOS
 * Every button must have an assigned behavior from these categories
 */

export const INTERACTION_TYPES = {
  OPEN_MODAL: 'open_modal',
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

/**
 * PAGE: Today's Command Center
 */
export const todayCommandCenterMap = {
  startShiftButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'StartShiftModal',
    label: 'Start Shift',
  },
  endShiftButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'CloseShiftModal',
    label: 'End Shift',
  },
  quickLogButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'QuickLogModal',
    label: 'Quick Log',
  },
  addTaskButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'AddTaskModal',
    label: 'Add Task',
  },
  add86Button: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'Add86Modal',
    label: 'Add 86',
  },
  addPrepButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'AddPrepModal',
    label: 'Add Prep',
  },
  maintenanceButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'MaintenanceModal',
    label: 'Maintenance',
  },
  overdueFix: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/today',
    label: 'Fix Overdue Item',
  },
  dueSoonViewDetail: {
    type: INTERACTION_TYPES.OPEN_DETAIL,
    target: 'TaskDetailDrawer',
    label: 'View Due Soon Item',
  },
  completedViewMore: {
    type: INTERACTION_TYPES.NO_ACTION,
    label: 'Recently Completed (Info Only)',
  },
  shiftNotesViewHandoff: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/shift-handoff',
    label: 'View Handoff',
  },
  notificationsButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/logs',
    label: 'View Notifications',
  },
  viewDayButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/calendar',
    label: 'View Calendar',
  },
};

/**
 * PAGE: Staff Tasks (/today)
 */
export const staffTasksMap = {
  taskCard: {
    type: INTERACTION_TYPES.MARK_COMPLETE,
    target: 'PrepItem | SideWorkAssignment',
    label: 'Mark Task Complete',
  },
  taskSwipeSnooze: {
    type: INTERACTION_TYPES.TOGGLE_STATUS,
    target: 'Task Snooze',
    label: 'Snooze Task',
  },
  taskSwipeReassign: {
    type: INTERACTION_TYPES.EDIT_RECORD,
    target: 'Task Reassignment',
    label: 'Reassign Task',
  },
  taskSwipeView: {
    type: INTERACTION_TYPES.OPEN_DETAIL,
    target: 'TaskDetailDrawer',
    label: 'View Task Details',
  },
  filterChip: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'TaskList',
    label: 'Filter Tasks',
  },
};

/**
 * PAGE: Logs (/logs)
 */
export const logsMap = {
  logFilterTab: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'LogList',
    label: 'Filter Logs by Type',
  },
  logCard: {
    type: INTERACTION_TYPES.OPEN_DETAIL,
    target: 'LogDetailDrawer',
    label: 'View Log Details',
  },
  quickLogFAB: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'QuickLogModal',
    label: 'Create Quick Log',
  },
};

/**
 * PAGE: Knowledge (/knowledge)
 */
export const knowledgeMap = {
  searchBar: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/search',
    label: 'Search Knowledge',
  },
  recipesCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/recipes',
    label: 'View Recipes',
  },
  buildCardsCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/recipes',
    label: 'View Build Cards',
  },
  vendorsCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/vendors',
    label: 'View Vendors',
  },
  equipmentCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/equipment',
    label: 'View Equipment Guides',
  },
  sopsCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/guides',
    label: 'View SOPs & Guides',
  },
  formsCard: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/forms',
    label: 'View Forms & Checklists',
  },
};

/**
 * PAGE: More Menu (/more)
 */
export const moreMenuMap = {
  templatesButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/templates',
    label: 'Manage Templates',
  },
  teamButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/restaurant-team',
    label: 'Manage Team',
  },
  scheduleButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/schedule-center',
    label: 'Manage Schedule',
  },
  timeClockButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/time-clock',
    label: 'Time Clock',
  },
  restaurantSettingsButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/my-restaurant',
    label: 'Restaurant Settings',
  },
  tagsButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/standards',
    label: 'Tags & Categories',
  },
  integrationsButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/integrations',
    label: 'Integrations',
  },
  accountButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/profile',
    label: 'My Account',
  },
  helpButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/knowledge',
    label: 'Help & Support',
  },
};

/**
 * PAGE: Restaurant Team (/restaurant-team)
 */
export const restaurantTeamMap = {
  backButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: -1,
    label: 'Go Back',
  },
  notificationsButton: {
    type: INTERACTION_TYPES.NO_ACTION,
    label: 'Notifications Bell (Placeholder)',
  },
  filterChip: {
    type: INTERACTION_TYPES.FILTER_LIST,
    target: 'EmployeeList',
    label: 'Filter Employees by Role',
  },
  certificationsButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/certifications',
    label: 'Review Certifications',
  },
  availabilityButton: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/availability-requests',
    label: 'Open Availability Requests',
  },
  messageButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'SendMessageModal',
    label: 'Message Employee',
  },
  taskAssignButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'AssignTaskModal',
    label: 'Assign Task',
  },
  employeeProfileButton: {
    type: INTERACTION_TYPES.OPEN_DETAIL,
    target: 'EmployeeDetailDrawer',
    label: 'View Employee Profile',
  },
  addTeamMemberButton: {
    type: INTERACTION_TYPES.OPEN_MODAL,
    target: 'InviteTeamMemberModal',
    label: 'Add Team Member',
  },
};

/**
 * COMPONENT: Global Bottom Navigation
 */
export const bottomNavMap = {
  todayTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/',
    label: 'Today Command Center',
  },
  tasksTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/today',
    label: 'Staff Tasks',
  },
  logsTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/logs',
    label: 'Logs',
  },
  knowledgeTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/knowledge',
    label: 'Knowledge',
  },
  moreTab: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/more',
    label: 'More',
  },
};

/**
 * COMPONENT: Layout Header
 */
export const layoutHeaderMap = {
  notificationsBell: {
    type: INTERACTION_TYPES.NO_ACTION,
    label: 'Notifications (Placeholder)',
  },
  profileLink: {
    type: INTERACTION_TYPES.NAVIGATE,
    target: '/profile',
    label: 'Go to Profile',
  },
};