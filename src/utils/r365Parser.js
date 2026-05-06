/**
 * R365 Schedule Parser
 * Handles grid-based Restaurant365 schedule exports (PDF format)
 */
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const ROLE_MAPPINGS = {
  'server': 'Server', 'srv': 'Server', 'foh server': 'Server',
  'bartender': 'Bartender', 'bar': 'Bartender',
  'host': 'Host', 'hostess': 'Host',
  'busser': 'Busser', 'bus': 'Busser',
  'cook': 'Cook', 'line cook': 'Cook', 'line': 'Cook',
  'prep cook': 'Prep Cook', 'prep': 'Prep Cook',
  'dishwasher': 'Dishwasher', 'dish': 'Dishwasher',
  'expo': 'Expo', 'expediter': 'Expo',
  'manager': 'Manager', 'mod': 'Manager', 'foh manager': 'Manager', 'boh manager': 'Manager',
  'kitchen lead hourly': 'Kitchen Lead',
  'event coordinator': 'Event Coordinator',
  'service professional': 'Service Professional',
  'baker': 'Baker',
};

export async function extractPDFText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }

  return text;
}

export function parsePDFScheduleText(text) {
  const shifts = [];

  // Split text into lines and clean up
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return { shifts: [], confidence: 'low' };
  }

  // Find all employee names (capitalized name patterns that appear as standalone lines)
  const employeeIndices = [];
  const skipKeywords = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'OT Hours', 'Fixed Labor', 'Sales', 'Labor',
    'Week of', 'Schedule', 'Scheduler', 'Morning', 'Afternoon', 'Evening', 'Night'];

  lines.forEach((line, idx) => {
    // Check if line looks like an employee name (First Last, or First Middle Last)
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(line)) {
      // Skip if it's a keyword
      if (!skipKeywords.some(kw => line.includes(kw))) {
        employeeIndices.push({ name: line, idx });
      }
    }
  });

  if (employeeIndices.length === 0) {
    return { shifts: [], confidence: 'low' };
  }

  // Extract shifts for each employee
  employeeIndices.forEach((emp, empIdx) => {
    const startIdx = emp.idx + 1;
    const endIdx = empIdx < employeeIndices.length - 1 ? employeeIndices[empIdx + 1].idx : lines.length;

    // Collect all text for this employee's shifts
    const empText = lines.slice(startIdx, endIdx).join(' ');

    // Match shift patterns: "HH:MMa - HH:MMp RoleType"
    // Pattern handles: "3:00p - 9:00p Bartender" or "7:00a - 3:00p Kitchen Lead Hourly"
    const shiftRegex = /(\d{1,2}):(\d{2})([ap])\s*-\s*(\d{1,2}):(\d{2})([ap])\s+([A-Za-z\s]+?)(?=\d{1,2}:\d{2}|$)/g;

    let match;
    while ((match = shiftRegex.exec(empText)) !== null) {
      const startH = parseInt(match[1]);
      const startM = match[2];
      const startP = match[3];
      const endH = parseInt(match[4]);
      const endM = match[5];
      const endP = match[6];
      const roleText = match[7].trim();

      const startTime = formatTime(startH, startM, startP);
      const endTime = formatTime(endH, endM, endP);

      if (startTime && endTime) {
        shifts.push({
          raw_employee_name: emp.name,
          shift_date: null,
          raw_shift_text: match[0].trim(),
          parsed_start_time: startTime,
          parsed_end_time: endTime,
          raw_role: roleText,
          status: 'warning',
          error_message: 'Requires date selection',
        });
      }
    }
  });

  return { 
    shifts: shifts.length > 0 ? shifts : [],
    confidence: shifts.length > 0 ? 'medium' : 'low' 
  };
}

function formatTime(h, m, ampm) {
  let hours = h;
  if (ampm === 'p' && hours < 12) hours += 12;
  if (ampm === 'a' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function detectLayout(rows) {
  return 'weekly-grid';
}

export function detectHeaderRow(rows) {
  return 0;
}

export function parseWeeklyGrid(rows, headerIdx, weekStart) {
  return [];
}

export function parseRowBased(rows, headerIdx, weekStart) {
  return [];
}

export function parseShiftText(text) {
  if (!text) return null;
  const cleaned = String(text).trim();
  const result = { startTime: null, endTime: null, role: null };

  const roleMatch = cleaned.match(/\b(Server|Bartender|Barista|Host|Busser|Cook|Line Cook|Prep|Prep Cook|Dish|Dishwasher|Expo|Manager|MOD|Kitchen Lead|Event Coordinator|Service Professional|Baker|BOH Manager|FOH Manager)\b/i);
  if (roleMatch) result.role = roleMatch[1];

  let timeSection = cleaned.replace(/(Server|Bartender|Barista|Host|Busser|Cook|Line Cook|Prep|Prep Cook|Dish|Dishwasher|Expo|Manager|MOD|Kitchen Lead|Event Coordinator|Service Professional|Baker|BOH Manager|FOH Manager)/gi, '').trim();

  const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)\s*-\s*(?:(close|cl|op|open)|(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?))/i;
  const match = timeSection.match(timeRegex);

  if (!match) return null;

  result.startTime = parseTime(match[1]);
  if (match[2]) {
    result.endTime = match[2].toLowerCase().includes('cl') || match[2].toLowerCase().includes('close') ? 'CLOSE' : 'OPEN';
  } else if (match[3]) {
    result.endTime = parseTime(match[3]);
  }

  return result.startTime && (result.endTime === 'CLOSE' || result.endTime === 'OPEN' || result.endTime) ? result : null;
}

export function parseTime(timeStr) {
  if (!timeStr) return null;
  
  const str = String(timeStr).trim().toLowerCase();
  const cleaned = str.replace(/[.\s]/g, '');

  let match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const [, h, m] = match;
    return `${h.padStart(2, '0')}:${m}`;
  }

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

  if (roleMappings[lower]) return roleMappings[lower];

  for (const [key, val] of Object.entries(ROLE_MAPPINGS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }

  return null;
}