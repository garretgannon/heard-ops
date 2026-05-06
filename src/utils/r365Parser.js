/**
 * R365 Schedule Parser
 * Handles messy Restaurant365 schedule exports with multiple layouts
 */

export const ROLE_MAPPINGS = {
  'srv': 'Server', 'server': 'Server', 'foh server': 'Server',
  'bar': 'Bartender', 'bartender': 'Bartender',
  'host': 'Host', 'hostess': 'Host',
  'bus': 'Busser', 'busser': 'Busser',
  'prep': 'Prep Cook', 'prep cook': 'Prep Cook',
  'line': 'Cook', 'line cook': 'Cook', 'cook': 'Cook',
  'dish': 'Dishwasher', 'dishwasher': 'Dishwasher',
  'expo': 'Expo', 'expediter': 'Expo',
  'mod': 'Manager', 'manager': 'Manager', 'foh manager': 'Manager',
};

export const TIME_OFF_KEYWORDS = ['OFF', 'OFF REQUEST', 'PTO', 'VACATION', 'SICK', 'HOLIDAY'];

const HEADER_KEYWORDS = {
  employee: ['employee', 'staff', 'team member', 'name', 'person', 'associate'],
  date: ['date', 'shift date', 'day', 'work date'],
  start: ['start', 'start time', 'in', 'clock in'],
  end: ['end', 'end time', 'out', 'clock out'],
  role: ['role', 'job', 'job code', 'position', 'title'],
  department: ['department', 'dept', 'area', 'section'],
  notes: ['notes', 'comments', 'remarks'],
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
};

// Detect if row-based or weekly-grid layout
export function detectLayout(rows) {
  const firstNonEmptyRow = rows.find(r => r.some(cell => String(cell).trim().length > 0));
  if (!firstNonEmptyRow) return null;

  const headerIdx = detectHeaderRow(rows);
  const headerRow = rows[headerIdx] || [];
  const headerStr = headerRow.join(' ').toLowerCase();

  const hasDayColumns = HEADER_KEYWORDS.days.some(day => headerStr.includes(day));
  const hasEmployeeColumn = HEADER_KEYWORDS.employee.some(emp => headerStr.includes(emp));
  const hasDateColumn = HEADER_KEYWORDS.date.some(d => headerStr.includes(d));
  const hasStartColumn = HEADER_KEYWORDS.start.some(s => headerStr.includes(s));

  if (hasDayColumns && hasEmployeeColumn && !hasDateColumn) {
    return 'weekly-grid';
  }
  if (hasEmployeeColumn && hasDateColumn && hasStartColumn) {
    return 'row-based';
  }

  return null;
}

export function detectHeaderRow(rows) {
  const keywords = Object.values(HEADER_KEYWORDS).flat();
  for (let i = 0; i < Math.min(30, rows.length); i++) {
    const row = rows[i] || [];
    const rowStr = row.join(' ').toLowerCase();
    const matches = keywords.filter(kw => rowStr.includes(kw)).length;
    if (matches >= 2) return i;
  }
  return 0;
}

// Parse weekly grid layout (employees as rows, days as columns)
export function parseWeeklyGrid(rows, headerIdx, weekStart) {
  const headerRow = rows[headerIdx] || [];
  const dayColumns = {};
  const dayKeywords = HEADER_KEYWORDS.days;

  // Map day column indices
  headerRow.forEach((header, idx) => {
    const headerLower = String(header).toLowerCase().trim();
    for (const day of dayKeywords) {
      if (headerLower.includes(day)) {
        const dayName = day.substring(0, 3).toUpperCase();
        dayColumns[idx] = { day, dayIndex: dayKeywords.indexOf(day) % 7 };
        break;
      }
    }
  });

  const shifts = [];
  const weekStartDate = new Date(weekStart);

  // Parse each employee row
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => !String(c).trim())) continue;

    const employeeName = row[0] ? String(row[0]).trim() : null;
    if (!employeeName || employeeName.length < 2) continue;

    // Parse shifts for each day
    Object.entries(dayColumns).forEach(([colIdx, { day, dayIndex }]) => {
      const shiftText = row[parseInt(colIdx)] ? String(row[parseInt(colIdx)]).trim() : '';
      if (!shiftText) return;

      if (TIME_OFF_KEYWORDS.some(kw => shiftText.toUpperCase().includes(kw))) {
        return; // Skip time off
      }

      const shiftDate = new Date(weekStartDate);
      shiftDate.setDate(shiftDate.getDate() + dayIndex);

      const parsed = parseShiftText(shiftText);
      if (!parsed) return;

      shifts.push({
        raw_employee_name: employeeName,
        shift_date: shiftDate.toISOString().split('T')[0],
        raw_day: day,
        raw_shift_text: shiftText,
        parsed_start_time: parsed.startTime,
        parsed_end_time: parsed.endTime,
        raw_role: parsed.role || '',
        status: parsed.startTime && parsed.endTime ? 'ready' : 'error',
        error_message: !parsed.startTime || !parsed.endTime ? 'Could not parse shift times' : '',
      });
    });
  }

  return shifts;
}

// Parse row-based layout (one row per shift)
export function parseRowBased(rows, headerIdx, weekStart) {
  const headerRow = rows[headerIdx] || [];
  const columns = {};

  // Map column indices
  Object.entries(HEADER_KEYWORDS).forEach(([field, keywords]) => {
    headerRow.forEach((header, idx) => {
      if (!columns[field]) {
        const headerLower = String(header).toLowerCase();
        if (keywords.some(kw => headerLower.includes(kw))) {
          columns[field] = idx;
        }
      }
    });
  });

  const shifts = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => !String(c).trim())) continue;

    const employeeName = columns.employee !== undefined ? String(row[columns.employee]).trim() : '';
    const dateStr = columns.date !== undefined ? String(row[columns.date]).trim() : '';
    const startStr = columns.start !== undefined ? String(row[columns.start]).trim() : '';
    const endStr = columns.end !== undefined ? String(row[columns.end]).trim() : '';
    const roleStr = columns.role !== undefined ? String(row[columns.role]).trim() : '';

    if (!employeeName || !dateStr || !startStr || !endStr) continue;

    const shiftDate = parseDate(dateStr);
    if (!shiftDate) continue;

    const startTime = parseTime(startStr);
    const endTime = parseTime(endStr);

    if (!startTime || !endTime) continue;

    shifts.push({
      raw_employee_name: employeeName,
      shift_date: shiftDate,
      raw_shift_text: `${startStr}-${endStr} ${roleStr}`,
      parsed_start_time: startTime,
      parsed_end_time: endTime,
      raw_role: roleStr || '',
      status: 'ready',
      error_message: '',
    });
  }

  return shifts;
}

// Parse shift text like "9a-4p Server" or "9:00 AM - 4:00 PM"
export function parseShiftText(text) {
  if (!text) return null;

  const cleaned = String(text).trim();
  const result = { startTime: null, endTime: null, role: null };

  // Extract role if present
  const roleMatch = cleaned.match(/\b(Server|Bartender|Barista|Host|Busser|Cook|Line Cook|Prep|Prep Cook|Dish|Dishwasher|Expo|Manager|MOD)\b/i);
  if (roleMatch) result.role = roleMatch[1];

  // Remove role from text for time parsing
  let timeSection = cleaned.replace(/(Server|Bartender|Barista|Host|Busser|Cook|Line Cook|Prep|Prep Cook|Dish|Dishwasher|Expo|Manager|MOD)/gi, '').trim();

  // Match time range patterns
  const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)\s*-\s*(?:(close|cl|op|open)|(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?))/i;
  const match = timeSection.match(timeRegex);

  if (!match) return null;

  result.startTime = parseTime(match[1]);
  if (match[2]) {
    // End time is Close/Open keyword
    result.endTime = match[2].toLowerCase().includes('cl') || match[2].toLowerCase().includes('close') ? 'CLOSE' : 'OPEN';
  } else if (match[3]) {
    result.endTime = parseTime(match[3]);
  }

  return result.startTime && (result.endTime === 'CLOSE' || result.endTime === 'OPEN' || result.endTime) ? result : null;
}

// Parse time string like "9a", "9:00 AM", "16:00"
export function parseTime(timeStr) {
  if (!timeStr) return null;
  
  const str = String(timeStr).trim().toLowerCase();
  const cleaned = str.replace(/[.\s]/g, '');

  // 24-hour format HH:MM
  let match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const [, h, m] = match;
    return `${h.padStart(2, '0')}:${m}`;
  }

  // 12-hour format with AM/PM
  match = cleaned.match(/^(\d{1,2}):?(\d{0,2})(am|pm)$/);
  if (match) {
    let [, h, m, ampm] = match;
    h = parseInt(h);
    m = m ? parseInt(m) : 0;
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return null;
}

export function parseDate(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  const d = new Date(str);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return null;
}

export function mapRole(rawRole, roleMappings = {}) {
  if (!rawRole) return null;
  const lower = rawRole.toLowerCase().trim();

  // Check custom mappings first
  if (roleMappings[lower]) return roleMappings[lower];

  // Check default mappings
  for (const [key, val] of Object.entries(ROLE_MAPPINGS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }

  return null;
}