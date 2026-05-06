import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { X, Upload, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { extractPDFText, parsePDFScheduleData, normalizeExtractedData } from '@/utils/pdfScheduleParser';

const COLUMN_KEYWORDS = {
  employee_name: ['employee name', 'employee', 'name', 'staff member', 'team member', 'associate', 'person'],
  date: ['date', 'shift date', 'day', 'work date', 'scheduled date'],
  start_time: ['start', 'start time', 'in', 'in time', 'clock in', 'start clock'],
  end_time: ['end', 'end time', 'out', 'out time', 'clock out', 'end clock'],
  role: ['job role', 'role', 'position', 'job', 'job code', 'department role', 'job title'],
  department: ['department', 'area', 'team', 'section'],
  station: ['station', 'section', 'work area', 'location'],
  notes: ['notes', 'comments', 'shift notes', 'remarks'],
};

function parseFile(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let rows = [];
      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder('utf-8').decode(new Uint8Array(e.target.result));
        rows = parseCSV(text);
      } else {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      }
      callback(rows);
    } catch (err) {
      callback(null, err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  return lines.map(line => {
    const cols = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && (i === 0 || line[i - 1] !== '\\')) inQuote = !inQuote;
      else if (ch === ',' && !inQuote) { cols.push(current.trim()); current = ''; }
      else current += ch;
    }
    cols.push(current.trim());
    return cols;
  });
}

function detectHeaderRow(rows) {
  const keywords = Object.values(COLUMN_KEYWORDS).flat();
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i] || [];
    const rowStr = row.join(' ').toLowerCase();
    const matches = keywords.filter(kw => rowStr.includes(kw)).length;
    if (matches >= 3) return i;
  }
  return 0;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  const d = new Date(str);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return null;
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const str = String(timeStr).trim().toLowerCase();
  const ampm = str.includes('am') || str.includes('pm');
  const cleanStr = str.replace(/[apm]/g, '').trim();
  let hours, mins = 0;
  if (cleanStr.includes(':')) {
    const [h, m] = cleanStr.split(':').map(x => parseInt(x));
    hours = h; mins = m || 0;
  } else {
    hours = parseInt(cleanStr);
  }
  if (isNaN(hours)) return null;
  if (ampm && hours < 12 && str.includes('pm')) hours += 12;
  if (ampm && hours === 12 && str.includes('am')) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function detectWeek(dates) {
  const validDates = dates.filter(d => d).map(d => new Date(d)).sort((a, b) => a - b);
  if (validDates.length === 0) return null;
  const firstDate = validDates[0];
  const dayOfWeek = firstDate.getDay();
  const weekStart = new Date(firstDate);
  weekStart.setDate(firstDate.getDate() - dayOfWeek);
  return weekStart.toISOString().split('T')[0];
}

export default function ScheduleImportFlow({ onClose, onComplete, user }) {
  const [step, setStep] = useState(1);
  const [fileType, setFileType] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [headerRowIdx, setHeaderRowIdx] = useState(0);
  const [columnMapping, setColumnMapping] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [weekStart, setWeekStart] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [pdfParsed, setPdfParsed] = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    if (file.name.endsWith('.pdf')) {
      setFileType('pdf');
      try {
        const text = await extractPDFText(file);
        const extracted = parsePDFScheduleData(text);
        const normalized = normalizeExtractedData(extracted);
        const preview = normalized.map((d, i) => ({
          row: [d.employee_name, d.date, d.start_time, d.end_time, d.role],
          mapped: d,
          issues: !d.employee_name || !d.date || !d.start_time || !d.end_time ? ['Missing required field'] : [],
          status: !d.employee_name || !d.date || !d.start_time || !d.end_time ? 'error' : 'ok',
        }));
        setPreviewRows(preview);
        setPdfParsed(true);
        setStep(3);
      } catch (err) {
        alert('PDF parsing failed: ' + err.message);
      }
    } else {
      setFileType('csv');
      setPdfParsed(false);
      parseFile(file, (rows, error) => {
        if (error) { alert('Error reading file: ' + error); return; }
        setRawRows(rows);
        const headerIdx = detectHeaderRow(rows);
        setHeaderRowIdx(headerIdx);
        const headers = rows[headerIdx] || [];
        const mapping = {};
        headers.forEach((h, idx) => {
          const lower = (h || '').toLowerCase();
          for (const [field, keywords] of Object.entries(COLUMN_KEYWORDS)) {
            if (keywords.some(kw => lower.includes(kw))) {
              mapping[idx] = field;
              break;
            }
          }
        });
        setColumnMapping(mapping);
        setStep(2);
      });
    }
  };

  const buildPreview = () => {
    const rows = rawRows.slice(headerRowIdx + 1)
      .filter(row => row.some(cell => String(cell).trim().length > 0))
      .map((row, idx) => {
        const mapped = {};
        Object.entries(columnMapping).forEach(([colIdx, field]) => {
          const val = row[parseInt(colIdx)] || '';
          if (field === 'start_time' || field === 'end_time') {
            mapped[field] = parseTime(val);
          } else if (field === 'date') {
            mapped[field] = parseDate(val);
          } else {
            mapped[field] = String(val).trim();
          }
        });
        const issues = [];
        if (!mapped.employee_name) issues.push('Missing employee name');
        if (!mapped.date) issues.push('Missing date');
        if (!mapped.start_time) issues.push('Missing start time');
        if (!mapped.end_time) issues.push('Missing end time');
        if (!mapped.role) issues.push('Missing role');
        return { row, mapped, issues, status: issues.length > 0 ? 'error' : 'ok' };
      });
    setPreviewRows(rows);
    const detectedWeek = detectWeek(rows.filter(r => r.status === 'ok').map(r => r.mapped.date));
    if (detectedWeek) setWeekStart(detectedWeek);
    setStep(3);
  };

  const doImport = async () => {
    setImporting(true);
    let created = 0, newEmployees = 0, skipped = 0;

    const batchId = await base44.entities.ScheduleImportBatch.create({
      fileName: 'Schedule Import',
      source: 'csv',
      weekStartDate: weekStart,
      uploadedBy: user?.email || '',
      uploadedAt: new Date().toISOString(),
      status: 'importing',
      totalRows: previewRows.length,
    }).then(b => b.id).catch(() => null);

    const existingUsers = await base44.entities.User.list('-updated_date', 500).catch(() => []);
    const shiftsToCreate = [];

    for (const row of previewRows) {
      if (row.issues.length > 0) { skipped++; continue; }
      const d = row.mapped;

      let appUser = existingUsers.find(u => u.full_name?.toLowerCase() === d.employee_name.toLowerCase());
      if (!appUser) {
        try {
          const newUserEmail = `${d.employee_name.replace(/\s+/g, '.').toLowerCase()}@scheduled.local`;
          await base44.users.inviteUser(newUserEmail, 'user');
          newEmployees++;
        } catch {
          skipped++;
          continue;
        }
      }

      shiftsToCreate.push({
        employee_name: d.employee_name,
        employee_email: appUser?.email || d.employee_name.toLowerCase().replace(/\s+/g, '.') + '@scheduled.local',
        date: d.date,
        start_time: d.start_time,
        end_time: d.end_time,
        role: d.role,
        department: d.department || 'FOH',
        station: d.station || '',
        notes: d.notes || '',
        source_file: 'schedule_import',
        imported_by: user?.email || '',
        import_date: new Date().toISOString(),
        week_start_date: weekStart,
        status: 'draft',
      });
    }

    if (shiftsToCreate.length > 0) {
      await base44.entities.StaffShift.bulkCreate(shiftsToCreate).catch(() => {});
      created = shiftsToCreate.length;
    }

    if (batchId) {
      await base44.entities.ScheduleImportBatch.update(batchId, {
        status: 'complete',
        shiftsCreated: created,
        employeesCreated: newEmployees,
        rowsSkipped: skipped,
      }).catch(() => {});
    }

    haptics.success?.();
    setResult({ created, newEmployees, skipped });
    setImporting(false);
    setStep(4);
  };

  const okRows = previewRows.filter(r => r.issues.length === 0);
  const errorRows = previewRows.filter(r => r.issues.length > 0);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
       <button onClick={() => { haptics.light?.(); onClose?.(); }} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
         <X className="h-4 w-4" />
       </button>
       <div className="flex-1">
         <h2 className="text-sm font-bold">Import Weekly Schedule</h2>
         <p className="text-[10px] text-muted-foreground">Step {step} of 4</p>
       </div>
      </div>

      <div className="flex px-4 py-2 gap-1 bg-muted/30 border-b border-border shrink-0">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center py-8 bg-card border-2 border-dashed border-border rounded-xl">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold mb-1">Upload Schedule File</p>
              <p className="text-xs text-muted-foreground mb-3">CSV, Excel, or PDF</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Map your file's columns to app fields.</p>
            <div className="space-y-2">
              {Object.entries(columnMapping).map(([colIdx, field]) => {
                const headers = rawRows[headerRowIdx] || [];
                const header = headers[parseInt(colIdx)] || '';
                return (
                  <div key={colIdx} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                    <span className="text-xs font-bold text-foreground flex-1 truncate">{header}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <select
                      value={field || ''}
                      onChange={e => setColumnMapping(p => ({ ...p, [colIdx]: e.target.value }))}
                      className="w-32 px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground"
                    >
                      <option value="">— Skip —</option>
                      {Object.keys(COLUMN_KEYWORDS).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            <button onClick={buildPreview} className="w-full btn-primary text-sm py-2.5">Preview Schedule</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-green-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-green-400">{okRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Valid</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-red-400">{errorRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Errors</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-foreground">{previewRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 mb-3">
              <label className="text-xs font-bold text-foreground block mb-2">Week Start Date</label>
              <input
                type="date"
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
              />
            </div>

            {pdfParsed && previewRows.filter(r => r.status === 'error').length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3">
                <p className="text-xs font-bold text-amber-400 mb-1">PDF parsing needs review</p>
                <p className="text-[11px] text-amber-300">Please verify and edit the fields below before importing.</p>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {previewRows.slice(0, 30).map((row, idx) => (
                <div key={idx} className={`bg-card border rounded px-3 py-2 text-xs transition-all ${row.issues.length > 0 ? 'border-red-500/30' : 'border-border'} ${editingIdx === idx ? 'ring-2 ring-primary' : ''}`}>
                  {editingIdx === idx && pdfParsed ? (
                    <div className="space-y-2">
                      <input type="text" value={row.mapped.employee_name} onChange={e => { const nr = [...previewRows]; nr[idx].mapped.employee_name = e.target.value; setPreviewRows(nr); }} placeholder="Employee" className="w-full px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={row.mapped.date} onChange={e => { const nr = [...previewRows]; nr[idx].mapped.date = e.target.value; setPreviewRows(nr); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                        <input type="text" value={row.mapped.role} onChange={e => { const nr = [...previewRows]; nr[idx].mapped.role = e.target.value; setPreviewRows(nr); }} placeholder="Role" className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="time" value={row.mapped.start_time} onChange={e => { const nr = [...previewRows]; nr[idx].mapped.start_time = e.target.value; setPreviewRows(nr); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                        <input type="time" value={row.mapped.end_time} onChange={e => { const nr = [...previewRows]; nr[idx].mapped.end_time = e.target.value; setPreviewRows(nr); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      </div>
                      <button onClick={() => setEditingIdx(null)} className="w-full py-1 bg-primary text-primary-foreground rounded text-xs font-bold">Done</button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{row.mapped.employee_name}</p>
                        <p className="text-muted-foreground truncate">{row.mapped.date} · {row.mapped.start_time}-{row.mapped.end_time} · {row.mapped.role}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {pdfParsed && <button onClick={() => setEditingIdx(idx)} className="p-1 hover:bg-muted rounded"><Edit2 className="h-3 w-3 text-muted-foreground" /></button>}
                        {row.issues.length > 0 ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  )}
                  {row.issues.length > 0 && <p className="text-[10px] text-red-400 mt-1">{row.issues.join(' · ')}</p>}
                </div>
              ))}
            </div>

            <button onClick={doImport} className={`w-full text-sm py-2.5 rounded-lg font-bold transition-all ${okRows.length === 0 ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed' : 'btn-primary'}`}>Confirm Import</button>
          </div>
        )}

        {step === 4 && result && (
          <div className="space-y-3">
            <div className="text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
              <p className="font-bold">Import Complete!</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Shifts Created</span><span className="font-bold text-green-400">{result.created}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Employees Created</span><span className="font-bold text-primary">{result.newEmployees}</span></div>
              {result.skipped > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Rows Skipped</span><span className="font-bold text-amber-400">{result.skipped}</span></div>}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3">
        <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx,.pdf" className="hidden" onChange={e => { handleFile(e.target.files[0]); }} />
        {step === 1 && <button onClick={() => fileRef.current?.click()} className="w-full btn-primary text-sm">Choose File</button>}
        {step === 4 && <button onClick={onComplete} className="w-full btn-primary text-sm">View Schedule</button>}
      </div>
    </div>
  );
}