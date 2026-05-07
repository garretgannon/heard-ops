/**
 * Role-based operational data filtering
 * Applies consistent visibility & priority rules across all roles
 */

export function filterTasksForRole(tasks, role, user) {
  return tasks.filter((task) => {
    // Admins see everything
    if (role === 'admin') return true;

    // Staff see their assigned tasks + station tasks
    if (task.visibility === 'private' && task.created_by_user !== user?.email) return false;
    if (task.visibility === 'manager_only') return false;
    if (task.assigned_employee_id && task.assigned_employee_id !== user?.employee_id) return false;
    if (task.assigned_role && task.assigned_role !== role) return false;

    return true;
  });
}

export function filterLogsForRole(logs, role, user) {
  return logs.filter((log) => {
    // Admins see everything
    if (role === 'admin') return true;

    // Visibility rules
    if (log.visibility === 'manager_only' && role !== 'manager') return false;
    if (log.visibility === 'private' && log.created_by !== user?.email) return false;
    if (log.visibility === 'assigned_roles_only' && log.employee_id !== user?.employee_id) return false;

    return true;
  });
}

export function roleOperationalPriority(role) {
  const priorities = {
    admin: {
      focusAreas: ['critical_alerts', 'labor', 'compliance', 'team_status'],
      taskFilter: (tasks) => tasks.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      logFilter: (logs) => logs.filter((l) => ['incident', 'maintenance', 'temperature'].includes(l.type)),
    },
    manager: {
      focusAreas: ['alerts', 'reviews', 'team_progress', 'compliance'],
      taskFilter: (tasks) =>
        tasks.sort((a, b) => {
          if (a.status === 'needs_review') return -1;
          if (b.status === 'needs_review') return 1;
          return 0;
        }),
      logFilter: (logs) => logs.filter((l) => l.requires_review || ['incident', 'temperature'].includes(l.type)),
    },
    kitchen_lead: {
      focusAreas: ['station_tasks', 'team_status', 'quality_alerts'],
      taskFilter: (tasks) => tasks.filter((t) => t.station === 'kitchen'),
      logFilter: (logs) => logs.filter((l) => ['temperature', 'incident'].includes(l.type)),
    },
    cook: {
      focusAreas: ['my_tasks', 'prep_status', 'alerts'],
      taskFilter: (tasks) => tasks.filter((t) => t.type === 'prep'),
      logFilter: (logs) => logs.filter((l) => l.type === 'employee_note' && l.employee_id),
    },
    server: {
      focusAreas: ['my_tasks', 'handoff'],
      taskFilter: (tasks) => tasks.filter((t) => t.type === 'sidework'),
      logFilter: (logs) => logs.filter((l) => l.type === 'employee_note'),
    },
    busser: {
      focusAreas: ['my_tasks'],
      taskFilter: (tasks) => tasks.filter((t) => t.type === 'cleaning'),
      logFilter: (logs) => [],
    },
  };

  return priorities[role] || priorities.cook;
}

export function getOperationalAlerts(tasks, logs, role) {
  const alerts = [];

  // Critical overdue tasks
  const overdue = tasks.filter((t) => t.status === 'overdue');
  if (overdue.length > 0) {
    alerts.push({
      type: 'overdue_tasks',
      severity: 'critical',
      count: overdue.length,
      label: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
    });
  }

  // Temperature failures
  const failedTemps = logs.filter((l) => l.type === 'temperature' && (l.status === 'flagged' || l.custom_metadata?.passFail === 'fail'));
  if (failedTemps.length > 0) {
    alerts.push({
      type: 'failed_temperatures',
      severity: 'critical',
      count: failedTemps.length,
      label: `${failedTemps.length} failed temp check${failedTemps.length > 1 ? 's' : ''}`,
    });
  }

  // Open incidents
  const incidents = logs.filter((l) => l.type === 'incident' && l.status === 'open');
  if (incidents.length > 0) {
    alerts.push({
      type: 'open_incidents',
      severity: 'high',
      count: incidents.length,
      label: `${incidents.length} incident${incidents.length > 1 ? 's' : ''}`,
    });
  }

  // Items needing review (manager/admin only)
  if (['admin', 'manager'].includes(role)) {
    const reviewNeeded = tasks.filter((t) => t.status === 'needs_review');
    if (reviewNeeded.length > 0) {
      alerts.push({
        type: 'pending_reviews',
        severity: 'medium',
        count: reviewNeeded.length,
        label: `${reviewNeeded.length} pending review${reviewNeeded.length > 1 ? 's' : ''}`,
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}