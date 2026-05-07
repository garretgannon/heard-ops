/**
 * Role-based log visibility rules
 * Determines which logs a user can see based on their role
 */

const ROLE_HIERARCHY = {
  admin: 10,
  gm: 9,
  manager: 8,
  kitchen_lead: 5,
  foh_lead: 5,
  cook: 3,
  server: 2,
  busser: 1,
  user: 0,
};

export function canUserViewLog(user, log, logType) {
  if (!user) return false;

  const userRole = user.role?.toLowerCase() || 'user';
  const userHierarchy = ROLE_HIERARCHY[userRole] || 0;

  // Admin and GM see everything
  if (userRole === 'admin' || userRole === 'gm') return true;

  // Determine log visibility rules by type
  switch (logType) {
    // MANAGER LOGS (manager-only by default)
    case 'manager':
      return userHierarchy >= ROLE_HIERARCHY.manager;

    // INCIDENT REPORTS (manager/admin only, unless submitted by non-manager)
    case 'incident':
      return userHierarchy >= ROLE_HIERARCHY.manager ||
        (log.reported_by === user.email && userRole !== 'manager');

    // EMPLOYEE LOGS (manager-only by default)
    case 'employee':
      return userHierarchy >= ROLE_HIERARCHY.manager;

    // PREP & KITCHEN TASKS
    case 'prep':
    case 'temperature':
    case 'food_safety':
    case 'maintenance':
      return userRole === 'kitchen_lead' || userRole === 'cook' || userHierarchy >= ROLE_HIERARCHY.manager;

    // WASTE LOGS
    case 'waste':
      return userRole === 'kitchen_lead' || userRole === 'cook' || userHierarchy >= ROLE_HIERARCHY.manager;

    // 86 ITEMS (visible to FOH, Kitchen, Managers)
    case 'eighty_six':
      return userRole === 'kitchen_lead' || userRole === 'cook' || userRole === 'foh_lead' || 
        userRole === 'server' || userHierarchy >= ROLE_HIERARCHY.manager;

    // SIDE WORK (FOH-related)
    case 'side_work':
      return userRole === 'foh_lead' || userRole === 'server' || userHierarchy >= ROLE_HIERARCHY.manager;

    // CLEANING
    case 'cleaning':
      return userRole === 'kitchen_lead' || userRole === 'cook' || userHierarchy >= ROLE_HIERARCHY.manager;

    // BATHROOM CHECKS (assigned to specific roles or managers)
    case 'bathroom_check':
      return (log.assigned_roles && log.assigned_roles.includes(userRole)) || 
        userHierarchy >= ROLE_HIERARCHY.manager;

    // ISSUES & GUEST COMPLAINTS (managers only or if assigned)
    case 'issue':
    case 'guest_complaint':
      return userHierarchy >= ROLE_HIERARCHY.manager || 
        (log.assigned_to === user.email) ||
        (log.created_by === user.email);

    default:
      // Default: managers and up see it, others see if assigned or created by them
      return userHierarchy >= ROLE_HIERARCHY.manager || 
        (log.assigned_to === user.email) || 
        (log.created_by === user.email);
  }
}

export function getLogVisibilityLevel(log, logType, userRole) {
  const role = userRole?.toLowerCase() || 'user';

  // Determine visibility label
  if (logType === 'employee' || logType === 'manager') {
    return 'manager_only';
  }

  if (logType === 'incident') {
    return 'manager_only';
  }

  if (logType === 'bathroom_check' && log.assigned_roles) {
    return 'assigned_roles_only';
  }

  if (['prep', 'temperature', 'waste', 'cleaning', 'maintenance', 'food_safety'].includes(logType)) {
    return 'team_log';
  }

  if (logType === 'eighty_six') {
    return 'team_log'; // Visible to both FOH and BOH
  }

  if (logType === 'side_work') {
    return 'team_log';
  }

  return 'team_log';
}

export const VISIBILITY_LABELS = {
  team_log: { label: 'Public Team Log', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  manager_only: { label: 'Manager Only', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  admin_only: { label: 'Admin Only', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  assigned_roles_only: { label: 'Assigned Roles Only', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
};