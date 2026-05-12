const COMPLETED_STATUSES = new Set(['completed', 'done', 'closed', 'resolved', 'approved']);
const REVIEW_STATUSES = new Set(['pending_review', 'submitted', 'ready_for_review']);
const OPEN_STATUSES = new Set(['open', 'pending', 'in_progress', 'needs_follow_up', 'follow_up']);

const TASK_BUCKETS = [
  { key: 'generatedTasks', weight: 8, category: 'taskCompletion' },
  { key: 'sideworkTasks', weight: 10, category: 'taskCompletion' },
  { key: 'prepTasks', weight: 8, category: 'taskCompletion' },
  { key: 'cleaningTasks', weight: 8, category: 'taskCompletion' },
  { key: 'tempTasks', weight: 10, category: 'foodSafety' },
];

const LEVELS = [
  { min: 450, label: 'Standard Setter' },
  { min: 300, label: 'Lead' },
  { min: 180, label: 'Strong' },
  { min: 80, label: 'Steady' },
  { min: 0, label: 'Developing' },
];

function normalize(value) {
  return value == null ? '' : String(value).trim().toLowerCase();
}

function employeeKeys(employee = {}) {
  return [
    employee.id,
    employee.employee_id,
    employee.email,
    employee.full_name,
    employee.name,
  ].map(normalize).filter(Boolean);
}

function recordValues(record = {}) {
  return [
    record.employeeId,
    record.employee_id,
    record.employee,
    record.employee_email,
    record.employee_name,
    record.employeeName,
    record.assigned_to,
    record.assignedTo,
    record.assigned_employee,
    record.assigned_employee_name,
    record.assignedEmployeeName,
    record.completed_by,
    record.completedBy,
    record.completed_by_name,
    record.completedByName,
    record.created_by,
    record.createdBy,
    record.follow_up_assigned_to,
    record.followUpAssignedTo,
    record.tagged_employee,
    record.taggedEmployee,
  ].map(normalize).filter(Boolean);
}

export function matchesEmployeeRecord(record, employee) {
  const keys = employeeKeys(employee);
  if (keys.length === 0) return false;
  return recordValues(record).some(value => keys.includes(value));
}

function statusOf(record = {}) {
  return normalize(record.status || record.completion_status || record.state);
}

function isCompleted(record) {
  const status = statusOf(record);
  return (
    COMPLETED_STATUSES.has(status) ||
    record.completed === true ||
    record.is_complete === true ||
    record.completed_at ||
    record.completed_date
  );
}

function isPendingReview(record) {
  return REVIEW_STATUSES.has(statusOf(record));
}

function isOpenFollowUp(record = {}) {
  const status = statusOf(record);
  return (
    OPEN_STATUSES.has(status) ||
    record.follow_up_required === true ||
    record.needs_follow_up === true ||
    record.requires_follow_up === true
  ) && !isCompleted(record);
}

function isActiveCertification(cert = {}) {
  const status = statusOf(cert);
  if (status === 'expired' || status === 'inactive') return false;
  if (!cert.expiration_date && !cert.expires_at) return true;
  const expiration = new Date(cert.expiration_date || cert.expires_at);
  return Number.isNaN(expiration.getTime()) || expiration >= new Date();
}

function positiveLogScore(log = {}) {
  const text = normalize([
    log.type,
    log.category,
    log.title,
    log.summary,
    log.notes,
    log.content,
    log.description,
  ].filter(Boolean).join(' '));

  if (isOpenFollowUp(log)) return 0;
  if (text.includes('praise') || text.includes('recognition') || text.includes('compliment')) return 12;
  if (text.includes('guest note') || text.includes('guest_notes')) return 8;
  if (text.includes('resolved') || text.includes('follow up complete')) return 10;
  return isCompleted(log) ? 5 : 0;
}

function clampCategory(value) {
  return Math.min(100, Math.max(0, value));
}

function buildBadges(categories, stats) {
  return [
    stats.completedTasks >= 12 && 'Sidework Finisher',
    categories.foodSafety >= 55 && 'Food Safety Ready',
    categories.reliability >= 50 && 'Reliable Coverage',
    categories.teamSupport >= 35 && 'Team Support',
    stats.activeCertifications > 0 && 'Certified',
  ].filter(Boolean);
}

function levelFor(points) {
  return LEVELS.find(level => points >= level.min)?.label || 'Developing';
}

export function buildEmployeeProgress(employees = [], linkedRecords = {}) {
  const progress = employees.map((employee) => {
    const categories = {
      reliability: 0,
      taskCompletion: 0,
      foodSafety: 0,
      teamSupport: 0,
      training: 0,
    };
    const stats = {
      completedTasks: 0,
      pendingReviewTasks: 0,
      activeCertifications: 0,
      availabilitySlots: 0,
      pendingTimeOff: 0,
      positiveLogs: 0,
      openFollowUps: 0,
    };
    const highlights = [];

    TASK_BUCKETS.forEach(({ key, weight, category }) => {
      (linkedRecords[key] || [])
        .filter(record => matchesEmployeeRecord(record, employee))
        .forEach((record) => {
          if (isCompleted(record)) {
            stats.completedTasks += 1;
            categories[category] += weight;
          } else if (isPendingReview(record)) {
            stats.pendingReviewTasks += 1;
            categories[category] += Math.ceil(weight / 2);
          }
        });
    });

    const certifications = (linkedRecords.certifications || []).filter(record => matchesEmployeeRecord(record, employee));
    stats.activeCertifications = certifications.filter(isActiveCertification).length;
    categories.training += stats.activeCertifications * 15;
    categories.foodSafety += stats.activeCertifications * 6;

    const availability = (linkedRecords.availability || []).filter(record => matchesEmployeeRecord(record, employee));
    stats.availabilitySlots = availability.filter(slot => slot.is_available !== false).length;
    categories.reliability += Math.min(stats.availabilitySlots * 5, 35);

    const timeOff = (linkedRecords.timeOff || []).filter(record => matchesEmployeeRecord(record, employee));
    stats.pendingTimeOff = timeOff.filter(request => statusOf(request) === 'pending').length;
    categories.reliability += timeOff.filter(request => statusOf(request) === 'approved').length * 2;

    const logs = (linkedRecords.managerLogs || []).filter(record => matchesEmployeeRecord(record, employee));
    logs.forEach((log) => {
      if (isOpenFollowUp(log)) stats.openFollowUps += 1;
      const score = positiveLogScore(log);
      if (score > 0) {
        stats.positiveLogs += 1;
        categories.teamSupport += score;
      }
    });

    Object.keys(categories).forEach((key) => {
      categories[key] = clampCategory(categories[key]);
    });

    if (stats.completedTasks > 0) highlights.push(`${stats.completedTasks} completed operational item${stats.completedTasks === 1 ? '' : 's'}`);
    if (stats.activeCertifications > 0) highlights.push(`${stats.activeCertifications} active certification${stats.activeCertifications === 1 ? '' : 's'}`);
    if (stats.openFollowUps > 0) highlights.push(`${stats.openFollowUps} open follow-up${stats.openFollowUps === 1 ? '' : 's'} for manager review`);

    const totalPoints = Math.round(
      categories.taskCompletion * 2.4 +
      categories.foodSafety * 1.8 +
      categories.reliability * 1.5 +
      categories.teamSupport * 1.7 +
      categories.training * 1.4
    );

    return {
      employee,
      totalPoints,
      level: levelFor(totalPoints),
      badges: buildBadges(categories, stats),
      categories,
      stats,
      highlights,
      rank: 0,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints || normalize(a.employee.full_name).localeCompare(normalize(b.employee.full_name)));

  return progress.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
