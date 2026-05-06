import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { X, Upload, AlertCircle, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

const ROLE_MAPPING = {
  'server': 'Server', 'srv': 'Server', 'foh server': 'Server',
  'bartender': 'Bartender', 'bar': 'Bartender',
  'host': 'Host', 'hostess': 'Host',
  'busser': 'Busser', 'bus': 'Busser',
  'cook': 'Cook', 'line cook': 'Cook', 'line': 'Cook',
  'prep cook': 'Prep Cook', 'prep': 'Prep Cook',
  'dishwasher': 'Dishwasher', 'dish': 'Dishwasher',
  'expo': 'Expo', 'expediter': 'Expo',
  'manager': 'Manager', 'mod': 'Manager', 'boh manager': 'Manager', 'foh manager': 'Manager',
};

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let rows = [];
        let sheetName = 'Sheet1';
        if (file.name.endsWith('.csv')) {
          const text = new TextDecoder('utf-8').decode(new Uint8Array(e.target.result));
          rows = parseCSV(text);
        } else {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
          sheetName = wb.SheetNames[0] || 'Sheet1';
        }
        resolve({ rows, sheetName });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
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

export default function R365StagedImporter({ onClose, onComplete, user }) {
  const [step, setStep] = useState('upload');
  const [batchId, setBatchId] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [weekStart, setWeekStart] = useState('');
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(true);
  const [parsedShifts, setParsedShifts] = useState([]);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef();

  const handleUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      // Determine source type
      let sourceType = 'csv';
      if (file.name.endsWith('.xlsx')) sourceType = 'xlsx';
      else if (file.name.endsWith('.xls')) sourceType = 'xls';
      else if (file.name.endsWith('.pdf')) sourceType = 'pdf';

      // Parse file
      const { rows } = await parseFile(file);
      if (rows.length === 0) throw new Error('File is empty');

      // Create import batch
      const batch = await base44.entities.ScheduleImportBatch.create({
        file_name: file.name,
        source_type: sourceType,
        uploaded_by: user?.email,
        uploaded_at: new Date().toISOString(),
        status: 'raw_preview',
        raw_row_count: rows.length,
      });

      setBatchId(batch.id);
      const validated = validateRows(rows.slice(0, 50));
      setRawRows(validated);
      setStep('raw_preview');
    } catch (err) {
      setError(err.message || 'File could not be read');
    }
    setLoading(false);
  };

  const validateRows = (rows) => {
    return rows.map((row, idx) => {
      const issues = [];
      if (!row || row.length === 0) issues.push('Empty row');
      if (!row[0] || !String(row[0]).trim()) issues.push('Missing employee name');
      if (!row[1] || !String(row[1]).trim()) issues.push('Missing date');
      if (!row[2] || !String(row[2]).trim()) issues.push('Missing start time');
      if (!row[3] || !String(row[3]).trim()) issues.push('Missing end time');
      return { row, issues };
    });
  };

  const detectFormat = () => {
    // Simple heuristic: check if first row looks like headers
    const headers = rawRows[0]?.map(h => String(h).toLowerCase()) || [];
    const dateKeywords = ['date', 'day', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const employeeKeywords = ['employee', 'name', 'staff', 'person'];

    const hasDateColumns = headers.some(h => dateKeywords.some(k => h.includes(k)));
    const hasEmployeeColumn = headers.some(h => employeeKeywords.some(k => h.includes(k)));

    let format = 'unknown';
    if (hasDateColumns && hasEmployeeColumn) {
      format = headers.some(h => dateKeywords.some(k => h === k)) ? 'weekly_grid' : 'row_based';
    }

    setDetectedFormat(format);
    setStep('format_detected');
  };

  const proceedToColumnMapping = (selectedFormat) => {
    setDetectedFormat(selectedFormat);
    setStep('column_mapping');
  };

  const confirmMapping = async () => {
    // Parse shifts based on mapping and format
    // This is a placeholder—actual parsing logic depends on format and mapping
    setStep('shifts_parsed');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => { haptics.light?.(); onClose?.(); }} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold">Import Schedule</h2>
          <p className="text-[10px] text-muted-foreground">{step === 'upload' ? 'Step 1: Upload' : step === 'raw_preview' ? 'Step 2: Raw Preview' : step === 'format_detected' ? 'Step 3: Format' : step === 'column_mapping' ? 'Step 4: Map Columns' : 'Step 5: Review'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="text-center py-8 bg-card border-2 border-dashed border-border rounded-xl">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold mb-1">Upload Schedule File</p>
              <p className="text-xs text-muted-foreground mb-3">CSV, Excel, or PDF</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <p className="text-[11px] text-blue-300">💡 Upload a schedule export from R365 or any scheduling system.</p>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <p className="text-[11px] text-red-300">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 'raw_preview' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">First 50 rows from {fileName}</p>
            {rawRows.some(r => r.issues.length > 0) && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                <p className="text-[10px] text-amber-300">⚠ {rawRows.filter(r => r.issues.length > 0).length} row(s) have validation issues</p>
              </div>
            )}
            <div className="bg-card border border-border rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-[10px]">
                <tbody>
                  {rawRows.slice(0, 20).map((item, idx) => (
                    <tr key={idx} className={`border-b border-border ${item.issues.length > 0 ? 'bg-red-500/5' : ''}`}>
                      <td className="px-2 py-1 bg-muted/30 text-muted-foreground font-bold w-12">{idx + 1}</td>
                      {item.row.slice(0, 8).map((cell, cidx) => (
                        <td key={cidx} className="px-2 py-1 text-foreground truncate max-w-xs">{cell}</td>
                      ))}
                      {item.issues.length > 0 && (
                        <td className="px-2 py-1 text-red-400 text-[9px] font-bold">{item.issues[0]}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={detectFormat} className="w-full btn-primary text-sm py-2.5">Detect Format</button>
          </div>
        )}

        {step === 'format_detected' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Select the format of your schedule export:</p>
            <div className="space-y-2">
              {detectedFormat !== 'unknown' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 mb-2">
                  <p className="text-[10px] text-green-300">✓ Detected format: {detectedFormat === 'weekly_grid' ? 'Weekly Grid' : 'Row-Based'}</p>
                </div>
              )}
              <button onClick={() => proceedToColumnMapping('weekly_grid')} className={`w-full px-3 py-2.5 rounded-lg text-sm text-left font-bold transition-all ${detectedFormat === 'weekly_grid' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted'}`}>
                Weekly Grid (Employees × Days)
              </button>
              <button onClick={() => proceedToColumnMapping('row_based')} className={`w-full px-3 py-2.5 rounded-lg text-sm text-left font-bold transition-all ${detectedFormat === 'row_based' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted'}`}>
                Row-Based Export (One Shift Per Row)
              </button>
              <button onClick={() => proceedToColumnMapping('unknown')} className="w-full px-3 py-2.5 rounded-lg text-sm text-left font-bold bg-card border border-border text-foreground hover:bg-muted">
                I'm Not Sure, Auto-Detect
              </button>
            </div>
          </div>
        )}

        {step === 'column_mapping' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Map your schedule columns to app fields.</p>
            <div className="bg-card border border-border rounded-lg p-3 space-y-2">
              <label className="text-xs font-bold text-foreground block">Week Start Date</label>
              <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground" />
              <label className="text-xs font-bold text-foreground block mt-2">Week Starts On</label>
              <select value={weekStartsOnMonday ? 'monday' : 'sunday'} onChange={e => setWeekStartsOnMonday(e.target.value === 'monday')} className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground">
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            <button onClick={confirmMapping} className="w-full btn-primary text-sm py-2.5">Continue to Preview</button>
          </div>
        )}

        {step === 'shifts_parsed' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Shift preview ready. (Placeholder for shift review UI)</p>
            <button onClick={onComplete} className="w-full btn-primary text-sm py-2.5">Complete Import</button>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3">
        <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx,.pdf" className="hidden" onChange={e => { handleUpload(e.target.files[0]); }} />
        {step === 'upload' && <button onClick={() => fileRef.current?.click()} disabled={loading} className="w-full btn-primary text-sm disabled:opacity-50">{loading ? 'Loading...' : 'Choose File'}</button>}
        {step === 'raw_preview' && <button onClick={() => setStep('upload')} className="w-full btn-secondary text-sm">Choose Different File</button>}
      </div>
    </div>
  );
}