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
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const shifts = [];

  // Find all potential employee names and their line indices
  // R365 lists employee names on separate lines before their shifts
  const employeeLines = new Map();
  lines.forEach((line, idx) => {
    // Pattern: Capitalized words, not a day of week, not containing common keywords
    const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/);
    if (nameMatch) {
      const name = nameMatch[1];
      // Skip days of week and header keywords
      if (!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|OT|Fixed|Sales|Labor|Schedule|Week)/.test(name)) {
        employeeLines.set(name, idx);
      }
    }
  });

  // Extract shifts for each employee
  const employeeNames = Array.from(employeeLines.keys());
  
  employeeNames.forEach((empName, empIdx) => {
    const startIdx = employeeLines.get(empName);
    const endIdx = empIdx < employeeNames.length - 1 ? employeeLines.get(employeeNames[empIdx + 1]) : lines.length;

    // Collect all shift text for this employee (lines after their name until next employee)
    const empText = lines.slice(startIdx + 1, endIdx).join(' ');

    // R365 format: "HH:MMa - HH:MMp RoleType" or "HH:MMa - HH:MMp" followed by role
    // Example: "3:00p - 9:00p Bartender"
    const shiftPattern = /(\d{1,2}):(\d{2})([ap])\s*-\s*(\d{1,2}):(\d{2})([ap])\s+([A-Za-z\s]+?)(?=\d{1,2}:\d{2}|$)/gi;
    let match;

    while ((match = shiftPattern.exec(empText)) !== null) {
      const startH = parseInt(match[1]);
      const startM = match[2];
      const startAMPM = match[3];
      const endH = parseInt(match[4]);
      const endM = match[5];
      const endAMPM = match[6];
      const roleText = match[7].trim();

      const startTime = formatTime(startH, startM, startAMPM);
      const endTime = formatTime(endH, endM, endAMPM);

      if (startTime && endTime) {
        shifts.push({
          raw_employee_name: empName,
          shift_date: null, // Requires manual assignment during review
          raw_shift_text: match[0].trim(),
          parsed_start_time: startTime,
          parsed_end_time: endTime,
          raw_role: roleText,
          status: 'warning',
          error_message: 'Requires manual date selection',
        });
      }
    }
  });

  return { shifts, confidence: shifts.length > 0 ? 'medium' : 'low' };
}

function formatTime(h, m, ampm) {
  let hours = h;
  if (ampm === 'p' && hours < 12) hours += 12;
  if (ampm === 'a' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function detectLayout(rows) {
  return 'weekly-grid'; // R365 exports are always grid-based
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