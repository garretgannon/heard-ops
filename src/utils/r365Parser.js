/**
 * R365 Schedule Parser
 * Handles grid-based Restaurant365 schedule exports (PDF format)
 */
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const ROLE_MAPPINGS = {
  'server': 'Server', 'srv': 'Server',
  'bartender': 'Bartender', 'bar': 'Bartender',
  'host': 'Host', 'hostess': 'Host',
  'busser': 'Busser', 'bus': 'Busser',
  'cook': 'Cook', 'line cook': 'Cook',
  'prep cook': 'Prep Cook', 'prep': 'Prep Cook',
  'dishwasher': 'Dishwasher', 'dish': 'Dishwasher',
  'expo': 'Expo', 'expediter': 'Expo',
  'manager': 'Manager', 'mod': 'Manager',
  'kitchen lead hourly': 'Kitchen Lead',
  'event coordinator': 'Event Coordinator',
  'service professional': 'Service Professional',
  'baker': 'Baker',
  'boh manager': 'Manager',
  'foh manager': 'Manager',
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
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    return { shifts: [], confidence: 'low' };
  }

  const skipKeywords = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'OT', 'Fixed', 'Sales', 'Labor',
    'Week', 'Schedule', 'Scheduler', 'Flores', 'Monica'];

  // Scan for employee names and collect shifts until next employee
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Is this an employee name? (Proper case, 2-4 words, not a keyword)
    const isName = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line) && 
                   !skipKeywords.some(k => line.includes(k)) &&
                   line.length < 50;

    if (isName) {
      const employeeName = line;
      const shiftLines = [];

      // Collect all shift-like lines for this employee
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];

        // Stop if we hit another employee name
        if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(nextLine) && 
            !skipKeywords.some(k => nextLine.includes(k)) &&
            nextLine.length < 50) {
          break;
        }

        // Check if this line contains a time pattern
        if (/\d{1,2}:\d{2}\s*[ap]\s*-/.test(nextLine)) {
          shiftLines.push(nextLine);
        }

        j++;
      }

      // Parse the collected shift lines
      shiftLines.forEach(shiftLine => {
        // Extract time range: "3:00p - 9:00p" or "3:00p - 9:00p Bartender"
        const timeRegex = /(\d{1,2}):(\d{2})\s*([ap])\s*-\s*(\d{1,2}):(\d{2})\s*([ap])(?:\s+(.+))?/i;
        const match = shiftLine.match(timeRegex);

        if (match) {
          const [fullMatch, startH, startM, startP, endH, endM, endP, roleText] = match;
          const startTime = formatTime(parseInt(startH), startM, startP);
          const endTime = formatTime(parseInt(endH), endM, endP);
          const role = roleText ? roleText.trim() : '';

          if (startTime && endTime) {
            shifts.push({
              raw_employee_name: employeeName,
              shift_date: null,
              raw_shift_text: fullMatch.trim(),
              parsed_start_time: startTime,
              parsed_end_time: endTime,
              raw_role: role,
              status: 'warning',
              error_message: 'Requires date selection',
            });
          }
        }
      });
    }
  }

  return {
    shifts,
    confidence: shifts.length > 0 ? 'medium' : 'low',
  };
}

function formatTime(h, m, ampm) {
  let hours = h;
  if (ampm === 'p' && hours < 12) hours += 12;
  if (ampm === 'a' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${m}`;
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