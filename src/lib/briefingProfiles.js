/**
 * Shift Context Engine — briefing profiles and data filtering.
 *
 * Profiles are matched from user.role + current time.
 * Filtering is applied to already-fetched data (client-side, no re-fetch).
 */

// ─── Role → department mapping ────────────────────────────────────────────────
// Roles that map unambiguously to a department.
const ROLE_DEPT = {
  kitchen_lead: 'boh',
  prep_cook:    'boh',
  cook:         'boh',
  server:       'foh',
  host:         'foh',
  hostess:      'foh',
  busser:       'foh',
  food_runner:  'foh',
  expo:         'foh',
  bartender:    'bar',
  barback:      'bar',
  // manager / admin → null (needs selection or auto-detected by context)
};

// ─── Shift window definitions ─────────────────────────────────────────────────
export const SHIFT_WINDOWS = {
  morning:   { label: 'Opening / AM',   hours: '5:00 AM – 2:00 PM',  start:  5, end: 14 },
  afternoon: { label: 'PM / Midday',    hours: '11:00 AM – 7:00 PM', start: 11, end: 19 },
  evening:   { label: 'Dinner / PM',    hours: '3:00 PM – 11:00 PM', start: 15, end: 23 },
  night:     { label: 'Closing / Late', hours: '9:00 PM – 3:00 AM',  start: 21, end:  3 },
};

export function detectShiftType(hour) {
  if (hour >= 5  && hour < 12) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 15 && hour < 23) return 'evening';
  return 'night';
}

// ─── Filter keyword sets ──────────────────────────────────────────────────────
const FOH_ROLES = ['server', 'host', 'hostess', 'bartender', 'busser', 'food_runner',
  'food runner', 'runner', 'expo', 'expeditor', 'cashier', 'greeter'];

const BOH_ROLES = ['cook', 'prep_cook', 'prep cook', 'prep', 'dishwasher', 'dish',
  'chef', 'kitchen_lead', 'kitchen lead', 'line', 'broiler', 'grill', 'saute', 'fryer',
  'steward', 'porter', 'pastry'];

const BAR_ROLES = ['bartender', 'barback', 'bar'];

// Issue/log keywords by department
const DEPT_ISSUE_KEYWORDS = {
  foh:     ['foh', 'service', 'guest', 'pos', 'cash', 'host', 'seating', 'floor', 'server',
             'complaint', 'dining', 'patio', 'bar', 'bathroom', 'restroom'],
  boh:     ['kitchen', 'equipment', 'temp', 'temperature', 'food safety', 'food_safety', 'prep',
             'maintenance', 'receiving', 'walk-in', 'cooler', 'freezer', 'dish', 'cook', 'boh',
             'line', 'oven', 'fryer', 'grill', 'steam'],
  bar:     ['bar', 'beverage', 'draft', 'keg', 'tap', 'beer', 'wine', 'liquor', 'spirit',
             'cocktail', 'cash'],
  banquet: ['banquet', 'event', 'setup', 'teardown', 'room', 'av', 'linen', 'function'],
};

const DEPT_LOG_CATEGORIES = {
  foh:     ['shift_note', 'complaint', 'cash_drawer', 'cash_drop', 'incident'],
  boh:     ['shift_note', 'maintenance', 'waste', 'food_safety', 'incident', 'equipment'],
  bar:     ['shift_note', 'cash_drawer', 'cash_drop', 'incident'],
  banquet: ['shift_note', 'incident'],
  all:     [],
};

// ─── Briefing profiles ────────────────────────────────────────────────────────
export const DEFAULT_PROFILES = [
  {
    id:          'foh_opening',
    name:        'FOH Opening',
    shortName:   'FOH AM',
    description: 'Front of house — opening and morning service',
    department:  'foh',
    scope:       'foh',
    shiftTypes:  ['morning', 'afternoon'],
    importRules: {
      staffRoles:        FOH_ROLES,
      issueKeywords:     DEPT_ISSUE_KEYWORDS.foh,
      logCategories:     DEPT_LOG_CATEGORIES.foh,
      eightySixRule:     'guest_facing',
      reservationFilter: 'all',
      includeSidework:   true,
      includePrepNeeds:  false,
      includeLineCheck:  false,
      includeTempCheck:  false,
      includeWaste:      false,
      includeHandoffs:   true,
    },
  },
  {
    id:          'foh_pm',
    name:        'FOH PM',
    shortName:   'FOH PM',
    description: 'Front of house — PM and dinner service',
    department:  'foh',
    scope:       'foh',
    shiftTypes:  ['afternoon', 'evening'],
    importRules: {
      staffRoles:        FOH_ROLES,
      issueKeywords:     DEPT_ISSUE_KEYWORDS.foh,
      logCategories:     DEPT_LOG_CATEGORIES.foh,
      eightySixRule:     'guest_facing',
      reservationFilter: 'all',
      includeSidework:   true,
      includePrepNeeds:  false,
      includeLineCheck:  false,
      includeTempCheck:  false,
      includeWaste:      false,
      includeHandoffs:   true,
    },
  },
  {
    id:          'boh_opening',
    name:        'BOH Opening',
    shortName:   'BOH AM',
    description: 'Kitchen and prep — opening and AM production',
    department:  'boh',
    scope:       'boh',
    shiftTypes:  ['morning', 'afternoon'],
    importRules: {
      staffRoles:        BOH_ROLES,
      issueKeywords:     DEPT_ISSUE_KEYWORDS.boh,
      logCategories:     DEPT_LOG_CATEGORIES.boh,
      eightySixRule:     'boh_relevant',
      reservationFilter: 'beo_menu',
      includeSidework:   false,
      includePrepNeeds:  true,
      includeLineCheck:  true,
      includeTempCheck:  true,
      includeWaste:      true,
      includeHandoffs:   true,
    },
  },
  {
    id:          'boh_pm',
    name:        'BOH PM',
    shortName:   'BOH PM',
    description: 'Kitchen and prep — PM and dinner production',
    department:  'boh',
    scope:       'boh',
    shiftTypes:  ['afternoon', 'evening'],
    importRules: {
      staffRoles:        BOH_ROLES,
      issueKeywords:     DEPT_ISSUE_KEYWORDS.boh,
      logCategories:     DEPT_LOG_CATEGORIES.boh,
      eightySixRule:     'boh_relevant',
      reservationFilter: 'beo_menu',
      includeSidework:   false,
      includePrepNeeds:  true,
      includeLineCheck:  true,
      includeTempCheck:  true,
      includeWaste:      true,
      includeHandoffs:   true,
    },
  },
  {
    id:          'bar',
    name:        'Bar',
    shortName:   'Bar',
    description: 'Bar operations and beverage service',
    department:  'bar',
    scope:       'bar',
    shiftTypes:  ['morning', 'afternoon', 'evening', 'night'],
    importRules: {
      staffRoles:        BAR_ROLES,
      issueKeywords:     DEPT_ISSUE_KEYWORDS.bar,
      logCategories:     DEPT_LOG_CATEGORIES.bar,
      eightySixRule:     'bar_relevant',
      reservationFilter: 'bar_events',
      includeSidework:   false,
      includePrepNeeds:  false,
      includeLineCheck:  false,
      includeTempCheck:  false,
      includeWaste:      false,
      includeHandoffs:   true,
    },
  },
  {
    id:          'banquet',
    name:        'Banquet / Events',
    shortName:   'Events',
    description: 'Event and banquet operations',
    department:  'banquet',
    scope:       'banquet',
    shiftTypes:  ['morning', 'afternoon', 'evening'],
    importRules: {
      staffRoles:        ['banquet', 'event', 'catering', 'setup'],
      issueKeywords:     DEPT_ISSUE_KEYWORDS.banquet,
      logCategories:     DEPT_LOG_CATEGORIES.banquet,
      eightySixRule:     'guest_facing',
      reservationFilter: 'all',
      includeSidework:   false,
      includePrepNeeds:  false,
      includeLineCheck:  false,
      includeTempCheck:  false,
      includeWaste:      false,
      includeHandoffs:   true,
    },
  },
  {
    id:          'gm',
    name:        'GM / All House',
    shortName:   'All House',
    description: 'Full house overview across all departments',
    department:  'all',
    scope:       'all',
    shiftTypes:  ['morning', 'afternoon', 'evening', 'night'],
    importRules: {
      staffRoles:        [],
      issueKeywords:     [],
      logCategories:     [],
      eightySixRule:     'all',
      reservationFilter: 'all',
      includeSidework:   false,
      includePrepNeeds:  true,
      includeLineCheck:  false,
      includeTempCheck:  false,
      includeWaste:      true,
      includeHandoffs:   true,
    },
  },
];

// ─── Profile matching ─────────────────────────────────────────────────────────

/**
 * Returns the list of profiles the user should choose from.
 * If the role maps unambiguously → one profile returned.
 * Manager / admin → a curated list for the current shift window.
 */
export function matchProfilesForUser(user, shiftType) {
  if (!user) return DEFAULT_PROFILES;

  const role = (user.role || '').toLowerCase();
  const dept = ROLE_DEPT[role] ?? null;

  // Roles with a clear department — narrow to that dept's profiles for this shift
  if (dept) {
    const matches = DEFAULT_PROFILES.filter(
      p => p.department === dept && p.shiftTypes.includes(shiftType)
    );
    if (matches.length > 0) return matches;
    // Fallback: any profile for that dept
    return DEFAULT_PROFILES.filter(p => p.department === dept);
  }

  // Manager / admin / unknown role → relevant profiles for the shift window
  const byShift = DEFAULT_PROFILES.filter(p => p.shiftTypes.includes(shiftType));
  return byShift.length > 0 ? byShift : DEFAULT_PROFILES;
}

/**
 * Build a ShiftContext from a chosen profile + user.
 */
export function buildShiftContext(profile, user) {
  const now       = new Date();
  const shiftType = detectShiftType(now.getHours());
  const win       = SHIFT_WINDOWS[shiftType];

  return {
    profileId:    profile.id,
    profileName:  profile.name,
    department:   profile.department,
    scope:        profile.scope,
    shiftType,
    shiftLabel:   win.label,
    shiftHours:   win.hours,
    ownerUserId:  user?.email || user?.id,
    ownerName:    user?.full_name || user?.name,
    ownerRole:    user?.role,
    importRules:  profile.importRules,
    date:         now.toISOString().slice(0, 10),
    createdAt:    now.toISOString(),
  };
}

// ─── Data filtering ───────────────────────────────────────────────────────────

function strContainsAny(str, keywords) {
  if (!keywords || keywords.length === 0) return true;
  const lower = str.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

/**
 * Filter staff to the department's roles.
 * Falls back to showing all if no staffRoles defined (all-house).
 */
export function filterStaffForContext(staff, context) {
  if (!context || context.scope === 'all') return staff;
  const { staffRoles } = context.importRules;
  if (!staffRoles || staffRoles.length === 0) return staff;

  return staff.filter(s => {
    const combined = [s.role, s.job_code, s.position, s.department, s.station]
      .filter(Boolean).join(' ');
    return strContainsAny(combined, staffRoles);
  });
}

/**
 * Filter open issues to those relevant to the department.
 */
export function filterIssuesForContext(issues, context) {
  if (!context || context.scope === 'all') return issues;
  const { issueKeywords } = context.importRules;
  if (!issueKeywords || issueKeywords.length === 0) return issues;

  return issues.filter(issue => {
    const combined = [issue.title, issue.description, issue.category,
                      issue.area, issue.station, issue.department].filter(Boolean).join(' ');
    return strContainsAny(combined, issueKeywords);
  });
}

/**
 * Filter manager logs / unified logs to relevant categories.
 */
export function filterLogsForContext(logs, context) {
  if (!context || context.scope === 'all') return logs;
  const { logCategories, issueKeywords } = context.importRules;
  if (!logCategories || logCategories.length === 0) return logs;

  return logs.filter(log => {
    const cat = (log.category || log.type || '').toLowerCase().replace(/[\s-]/g, '_');
    if (logCategories.some(lc => cat.includes(lc.replace(/[\s-]/g, '_')))) return true;
    // Content fallback
    if (issueKeywords?.length) {
      const combined = [log.title, log.notes, log.description, log.department].filter(Boolean).join(' ');
      return strContainsAny(combined, issueKeywords);
    }
    return false;
  });
}

/**
 * Filter 86'd items to those visible to this department.
 */
export function filterEightySixForContext(items, context) {
  if (!context || context.scope === 'all') return items;
  const rule = context.importRules?.eightySixRule;
  if (rule === 'all') return items;

  return items.filter(item => {
    const str = [item.item_name, item.category, item.notes, item.reason]
      .filter(Boolean).join(' ').toLowerCase();

    if (rule === 'boh_relevant') return true;

    if (rule === 'guest_facing') {
      // Exclude items clearly marked as raw ingredient / back-of-house only
      const isIngredientOnly = ['ingredient', 'raw', 'bulk', 'prep item'].some(kw => str.includes(kw));
      return !isIngredientOnly;
    }

    if (rule === 'bar_relevant') {
      return ['bar', 'beer', 'wine', 'liquor', 'spirit', 'cocktail', 'beverage',
               'draft', 'keg', 'tap', 'bottle', 'batch'].some(kw => str.includes(kw));
    }
    return true;
  });
}

/**
 * Exclude waste from profiles that don't need it (FOH/Bar).
 */
export function filterWasteForContext(waste, context) {
  if (!context) return waste;
  return context.importRules?.includeWaste ? waste : [];
}

/**
 * Filter table reservations by department scope.
 * BOH sees only large parties (6+), dietary/allergy-flagged, or BEO-linked.
 * Bar sees only beverage/event-tagged reservations.
 */
export function filterReservationsForContext(reservations, context) {
  if (!context || context.scope === 'all') return reservations;
  const rule = context.importRules?.reservationFilter;
  if (!rule || rule === 'all') return reservations;

  if (rule === 'beo_menu') {
    return reservations.filter(r => {
      const combined = [r.notes, r.special_requests, r.dietary_notes, r.event_type, r.tags]
        .filter(Boolean).join(' ').toLowerCase();
      const partySize = r.party_size || r.guest_count || r.covers || 0;
      const isLargeParty = partySize >= 6;
      const hasDietary = ['allergy', 'dietary', 'vegan', 'vegetarian', 'gluten', 'nut',
        'shellfish', 'kosher', 'halal'].some(kw => combined.includes(kw));
      const isBeoLinked = Boolean(r.beo_id || r.event_id) || r.event_type === 'private_dining';
      return isLargeParty || hasDietary || isBeoLinked;
    });
  }

  if (rule === 'bar_events') {
    return reservations.filter(r => {
      const combined = [r.notes, r.event_type, r.special_requests, r.tags]
        .filter(Boolean).join(' ').toLowerCase();
      return ['bar', 'cocktail', 'beverage', 'wine', 'drinks', 'reception'].some(kw => combined.includes(kw));
    });
  }

  return reservations;
}

/**
 * Generate role-specific talking points from imported briefing data.
 * Returns an array of plain strings — one per talking point.
 */
export function generateTalkingPoints(data, context) {
  if (!context) return [];
  const dept = context.department;
  const points = [];

  if (dept === 'foh' || dept === 'all') {
    if (data.staff?.length)
      points.push(`${data.staff.length} FOH team member${data.staff.length !== 1 ? 's' : ''} scheduled — confirm sections and cut times`);
    if (data.reservations?.length)
      points.push(`${data.reservations.length} reservation${data.reservations.length !== 1 ? 's' : ''} — review covers, VIPs, and allergy flags`);
    if (data.events?.length)
      points.push(`${data.events.length} event${data.events.length !== 1 ? 's' : ''} — confirm BEO service notes and timeline`);
    if (data.eightySix?.length)
      points.push(`${data.eightySix.length} item${data.eightySix.length !== 1 ? 's' : ''} 86'd — update staff and POS before doors open`);
  }

  if (dept === 'boh') {
    if (data.staff?.length)
      points.push(`${data.staff.length} kitchen team member${data.staff.length !== 1 ? 's' : ''} on — confirm stations and positions`);
    if (data.prepNeeds?.length)
      points.push(`${data.prepNeeds.length} prep item${data.prepNeeds.length !== 1 ? 's' : ''} need attention before service`);
    if (data.events?.length)
      points.push(`${data.events.length} BEO${data.events.length !== 1 ? 's' : ''} today — review menu specs, allergy flags, and fire timing`);
    if (data.eightySix?.length)
      points.push(`${data.eightySix.length} ingredient${data.eightySix.length !== 1 ? 's' : ''} 86'd — update the line and communicate substitutions`);
  }

  if (dept === 'bar') {
    if (data.staff?.length)
      points.push(`${data.staff.length} bar team member${data.staff.length !== 1 ? 's' : ''} on today`);
    if (data.eightySix?.length)
      points.push(`${data.eightySix.length} beverage${data.eightySix.length !== 1 ? 's' : ''} 86'd — update cocktail menu and train staff on alternatives`);
    if (data.events?.length)
      points.push(`${data.events.length} event${data.events.length !== 1 ? 's' : ''} today — confirm beverage package and batch cocktail needs`);
  }

  if (dept === 'banquet') {
    if (data.events?.length)
      points.push(`${data.events.length} event${data.events.length !== 1 ? 's' : ''} today — review BEO details, setup timeline, and menu`);
    if (data.staff?.length)
      points.push(`${data.staff.length} banquet team member${data.staff.length !== 1 ? 's' : ''} assigned`);
  }

  if (data.issues?.length > 0)
    points.push(`${data.issues.length} open issue${data.issues.length !== 1 ? 's' : ''} — assign ownership and resolution path before service`);

  return points;
}
