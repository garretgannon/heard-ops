import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

export function parsePDFScheduleData(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 5);
  const data = [];

  for (const line of lines) {

    const entry = {
      employee_name: null,
      date: null,
      start_time: null,
      end_time: null,
      role: null,
    };

    // Simple heuristic: look for date patterns (MM/DD, MM-DD, YYYY-MM-DD)
    const dateMatch = line.match(/(\d{1,2}[-\/]\d{1,2}[-\/]?\d{0,4}|\d{4}-\d{2}-\d{2})/);
    if (dateMatch) entry.date = dateMatch[1];

    // Look for time patterns (HH:MM AM/PM or HH:MM in 24-hour)
    const timeMatches = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/g);
    if (timeMatches && timeMatches.length >= 2) {
      entry.start_time = timeMatches[0].trim();
      entry.end_time = timeMatches[1].trim();
    }

    // Extract employee name: look for capitalized words at the start of the line
    let nameSection = '';
    
    // Get text before date or time
    if (dateMatch) {
      nameSection = line.substring(0, dateMatch.index).trim();
    } else if (timeMatches && timeMatches.length > 0) {
      const timeIndex = line.indexOf(timeMatches[0]);
      nameSection = line.substring(0, timeIndex).trim();
    } else {
      // If no date/time found, assume first portion is the name
      nameSection = line.split(/\d{1,2}[:\/\-]/)[0].trim();
    }
    
    // Clean up name section
    if (nameSection) {
      const roleKeywords = ['FOH', 'BOH', 'Host', 'Server', 'Chef', 'Manager', 'Busser', 'Bartender', 'Line', 'Prep', 'Dish', 'Bar', 'Expo'];
      let cleanName = nameSection;
      
      // Remove role keywords and numbers at edges
      for (const keyword of roleKeywords) {
        cleanName = cleanName.replace(new RegExp('\\b' + keyword + '\\b', 'gi'), '');
      }
      cleanName = cleanName.replace(/^[\d\s\-.,;:()\[\]{}|*#]+/, '').replace(/[\d\s\-.,;:()\[\]{}|*#]+$/, '').trim();
      
      // Match capitalized word patterns: First Last format or single names
      const nameMatch = cleanName.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (nameMatch) {
        const possibleName = nameMatch[0].trim();
        if (possibleName.length > 2 && possibleName.split(' ').every(word => /^[A-Za-z]+$/.test(word))) {
          entry.employee_name = possibleName;
        }
      }
    }

    // Role might be present
    const roleKeywords = ['FOH', 'BOH', 'Host', 'Server', 'Chef', 'Manager', 'Busser', 'Bartender'];
    for (const keyword of roleKeywords) {
      if (line.toUpperCase().includes(keyword.toUpperCase())) {
        entry.role = keyword;
        break;
      }
    }

    if (entry.employee_name && entry.date) {
      data.push(entry);
    }
  }

  return data;
}

export function normalizeExtractedData(data) {
  return data.map(d => ({
    ...d,
    date: normalizeDate(d.date),
    start_time: normalizeTime(d.start_time),
    end_time: normalizeTime(d.end_time),
    role: d.role || 'FOH',
  }));
}

function normalizeDate(dateStr) {
  if (!dateStr) return '';
  const patterns = [
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/,
    /(\d{4})-(\d{2})-(\d{2})/,
  ];
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let [, m, d, y] = match;
      if (pattern === patterns[1]) {
        return dateStr;
      }
      if (y.length === 2) y = (parseInt(y) > 30 ? '19' : '20') + y;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return '';
}

function normalizeTime(timeStr) {
  if (!timeStr) return '';
  const str = timeStr.trim().toUpperCase();
  const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
  if (!match) return '';
  let [, h, m, ampm] = match;
  h = parseInt(h);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}