import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const REQUIRED_FIELDS = ['itemName', 'category', 'vendorName', 'unit', 'caseCost'];
const OPTIONAL_FIELDS = ['subcategory', 'vendorItemNumber', 'packSize', 'unitCost', 'parLevel', 'storageArea', 'active'];

const FIELD_MAPPING = {
  'item name': 'itemName',
  'category': 'category',
  'subcategory': 'subcategory',
  'vendor': 'vendorName',
  'vendor name': 'vendorName',
  'vendor item code': 'vendorItemNumber',
  'vendor item #': 'vendorItemNumber',
  'pack size': 'packSize',
  'unit': 'unit',
  'case cost': 'caseCost',
  'unit cost': 'unitCost',
  'par level': 'parLevel',
  'storage area': 'storageArea',
  'active': 'active',
};

function splitCSVLine(line, delimiter = ',') {
  const vals = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      vals.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  vals.push(cur.trim());
  return vals;
}

function detectDelimiter(lines) {
  if (!lines || lines.length === 0) return ',';
  let firstDataLine = lines[0] || '';
  for (const line of lines) {
    if (line.trim().length > 0) {
      firstDataLine = line;
      break;
    }
  }
  const delimiters = [',', '\t', ';', '|'];
  let bestDelim = ',';
  let maxCols = 0;
  for (const delim of delimiters) {
    const cols = splitCSVLine(firstDataLine, delim).filter(c => c.length > 0).length;
    if (cols > maxCols) {
      maxCols = cols;
      bestDelim = delim;
    }
  }
  return maxCols < 1 ? ',' : bestDelim;
}

function parseCSV(text) {
  const lines = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  if (nonEmptyLines.length < 1) return { headers: [], rows: [] };
  
  const delimiter = detectDelimiter(nonEmptyLines);
  const headerLine = nonEmptyLines[0];
  const rawHeaders = splitCSVLine(headerLine, delimiter).map(h => h.replace(/^\"|\"$/g, ''));
  const headers = rawHeaders.filter(h => h.length > 0);
  
  if (headers.length < 1) return { headers: [], rows: [] };
  
  const rows = nonEmptyLines.slice(1).map((line, idx) => {
    const vals = splitCSVLine(line, delimiter).map(v => v.replace(/^\"|\"$/g, ''));
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (vals[i] || '').trim();
    });
    row._rowIndex = idx + 2;
    return row;
  });
  
  return { headers, rows };
}

function autoMapColumns(headers) {
  const mapping = {};
  headers.forEach(header => {
    const normalized = header.toLowerCase();
    const mapped = FIELD_MAPPING[normalized] || null;
    mapping[header] = mapped;
  });
  return mapping;
}

function validateRow(mapped) {
  const issues = [];
  
  if (!mapped.itemName || !mapped.itemName.trim()) {
    issues.push('Missing item name');
  }
  if (!mapped.category || !mapped.category.trim()) {
    issues.push('Missing category');
  }
  if (!mapped.vendorName || !mapped.vendorName.trim()) {
    issues.push('Missing vendor');
  }
  if (!mapped.unit || !mapped.unit.trim()) {
    issues.push('Missing unit');
  }
  if (!mapped.caseCost || isNaN(parseFloat(mapped.caseCost))) {
    issues.push('Invalid case cost');
  }
  if (mapped.unitCost && isNaN(parseFloat(mapped.unitCost))) {
    issues.push('Invalid unit cost');
  }
  if (mapped.packSize && isNaN(parseFloat(mapped.packSize))) {
    issues.push('Invalid pack size');
  }
  if (mapped.parLevel && isNaN(parseFloat(mapped.parLevel))) {
    issues.push('Invalid par level');
  }
  
  return issues;
}

function downloadTemplate() {
  const headers = 'Item Name,Category,Subcategory,Vendor,Vendor Item Code,Pack Size,Unit,Case Cost,Unit Cost,Par Level,Storage Area,Active';
  const rows = [
    'Roma Tomato,Produce,Vegetables,US Foods,12345,25,lb,32.50,1.30,2,Walk-In,Yes',
    'Chicken Breast,Protein,Poultry,Sysco,98765,40,lb,96.00,2.40,3,Walk-In,Yes',
    'Napkins,Paper Goods,Disposables,Restaurant Depot,NAP-1000,1000,each,18.99,0.019,5,Dry Storage,Yes',
  ];
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'purchased-goods-template.csv');
  link.click();
  URL.revokeObjectURL(url);
}

export default function PurchasedGoodsImporter({ onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }
    
    const reader = new FileReader();
    reader.onerror = () => {
      alert('Failed to read file');
    };
    reader.onload = (e) => {
      try {
        const { headers, rows } = parseCSV(e.target.result);
        if (headers.length < 1) {
          alert('Could not detect columns in CSV');
          return;
        }
        
        setHeaders(headers);
        setRawRows(rows);
        const autoMap = autoMapColumns(headers);
        setMapping(autoMap);
        setStep(2);
      } catch (err) {
        console.error('CSV parse error:', err);
        alert('Error reading CSV: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const buildPreview = () => {
    const rows = rawRows.map((raw, idx) => {
      const mapped = {};
      Object.entries(mapping).forEach(([header, field]) => {
        if (field && raw[header] !== undefined) {
          mapped[field] = raw[header];
        }
      });
      mapped._rowIndex = raw._rowIndex || idx + 2;
      const issues = validateRow(mapped);
      return { raw, mapped, issues, status: issues.length > 0 ? 'error' : 'ok' };
    });
    
    setPreviewRows(rows);
    setStep(3);
  };

  const doImport = async () => {
    setImporting(true);
    let created = 0, skipped = 0, duplicates = 0;
    const errors = [];

    try {
      const existingItems = await base44.entities.PurchasedItem.list('-updated_date', 5000).catch(() => []);

      for (let i = 0; i < previewRows.length; i++) {
        const row = previewRows[i];
        
        if (row.issues.length > 0) {
          errors.push({ rowNumber: row.mapped._rowIndex, issues: row.issues });
          skipped++;
          continue;
        }

        const { mapped } = row;
        const payload = {};
        
        if (mapped.itemName) payload.itemName = mapped.itemName.trim();
        if (mapped.category) payload.category = mapped.category.trim();
        if (mapped.subcategory) payload.subcategory = mapped.subcategory.trim();
        if (mapped.vendorName) payload.vendorName = mapped.vendorName.trim();
        if (mapped.vendorItemNumber) payload.vendorItemNumber = mapped.vendorItemNumber.trim();
        if (mapped.packSize) payload.packSize = parseFloat(mapped.packSize) || null;
        if (mapped.unit) payload.unit = mapped.unit.trim();
        if (mapped.caseCost) payload.caseCost = parseFloat(mapped.caseCost) || 0;
        if (mapped.unitCost) payload.unitCost = parseFloat(mapped.unitCost) || null;
        if (mapped.parLevel) payload.parLevel = parseFloat(mapped.parLevel) || null;
        if (mapped.storageArea) payload.storageArea = mapped.storageArea.trim();
        if (mapped.active) {
          const activeStr = String(mapped.active).toLowerCase();
          payload.active = ['yes', 'true', '1', 'active'].includes(activeStr);
        }

        const isDuplicate = existingItems.some(item =>
          (payload.itemName && item.itemName?.toLowerCase() === payload.itemName.toLowerCase() && 
           item.vendorName?.toLowerCase() === payload.vendorName?.toLowerCase()) ||
          (payload.vendorItemNumber && item.vendorItemNumber === payload.vendorItemNumber && 
           item.vendorName?.toLowerCase() === payload.vendorName?.toLowerCase())
        );

        if (isDuplicate) {
          duplicates++;
          continue;
        }

        try {
          await base44.entities.PurchasedItem.create(payload);
          created++;
        } catch (err) {
          errors.push({ rowNumber: row.mapped._rowIndex, issues: [err.message] });
          skipped++;
        }
      }

      haptics.success?.() || haptics.medium?.();
      setResult({ created, skipped, duplicates, errors, total: previewRows.length });
      setStep(5);
    } catch (err) {
      console.error('Import error:', err);
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const errorRows = previewRows.filter(r => r.issues.length > 0);
  const okRows = previewRows.filter(r => r.issues.length === 0);

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => { haptics.light?.(); onClose?.(); }} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-border">
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-foreground">Import Purchased Goods</h2>
          <p className="text-[10px] text-muted-foreground">Step {step} of 5</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex px-4 py-2 gap-1 bg-muted/30 border-b border-border shrink-0">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center py-8 bg-card border-2 border-dashed border-border rounded-xl">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-foreground mb-1">Upload CSV File</p>
              <p className="text-xs text-muted-foreground mb-3">UTF-8 encoded CSV with required columns</p>
            </div>

            <div className="card-glass border border-border rounded-lg p-3 space-y-2">
              <p className="text-xs font-bold text-foreground">Required columns:</p>
              <p className="text-xs text-muted-foreground">Item Name, Category, Vendor, Unit, Case Cost</p>
              <p className="text-xs font-bold text-foreground mt-2">Optional columns:</p>
              <p className="text-xs text-muted-foreground">Subcategory, Vendor Item Code, Pack Size, Unit Cost, Par Level, Storage Area, Active</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Map your CSV columns to app fields</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{rawRows.length} rows detected</p>
            <div className="space-y-2">
              {headers.map(header => (
                <div key={header} className="flex items-center gap-2 card-glass border border-border rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-foreground flex-1 min-w-0 truncate">{header}</span>
                  <select
                    value={mapping[header] || ''}
                    onChange={e => setMapping(p => ({ ...p, [header]: e.target.value || null }))}
                    className="w-40 px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground"
                  >
                    <option value="">— Skip —</option>
                    {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map(field => (
                      <option key={field} value={field}>
                        {field.replace(/([A-Z])/g, ' $1').trim()} {REQUIRED_FIELDS.includes(field) ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-400">{okRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Ready</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-red-400">{errorRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Errors</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-foreground">{previewRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {previewRows.map((row, idx) => (
                <div key={idx} className={`bg-card border rounded-lg px-3 py-2 ${row.issues.length > 0 ? 'border-red-500/30' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{row.mapped.itemName || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{row.mapped.category} • {row.mapped.vendorName}</p>
                    </div>
                    {row.issues.length > 0 ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                  {row.issues.length > 0 && (
                    <p className="text-[10px] text-red-400 mt-1">{row.issues.join(' • ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && result && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-foreground">Import Complete</p>
            </div>
            <div className="card-glass border border-border rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Records imported</span><span className="font-bold text-green-400">{result.created}</span></div>
              {result.duplicates > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Duplicates skipped</span><span className="font-bold text-amber-400">{result.duplicates}</span></div>}
              {result.errors.length > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rows with errors</span><span className="font-bold text-red-400">{result.errors.length}</span></div>}
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-h-48 overflow-y-auto">
                <p className="text-xs font-bold text-red-400 mb-2">Error Details:</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-red-400 mb-1">Row {err.rowNumber}: {err.issues.join(', ')}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex gap-2">
        {step === 1 && (
          <>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <button onClick={() => fileRef.current?.click()} className="flex-1 btn-primary text-sm">Choose File</button>
            <button onClick={downloadTemplate} className="btn-secondary text-sm px-3 flex items-center gap-1">
              <Download className="h-4 w-4" />
            </button>
          </>
        )}
        {step === 2 && (
          <button onClick={buildPreview} className="flex-1 btn-primary text-sm">Preview Import →</button>
        )}
        {step === 3 && (
          <>
            {errorRows.length > 0 && (
              <button onClick={() => setStep(2)} className="flex-1 btn-secondary text-sm">← Fix Mapping</button>
            )}
            <button onClick={doImport} disabled={importing || okRows.length === 0} className="flex-1 btn-primary text-sm">
              {importing ? 'Importing...' : 'Confirm & Import →'}
            </button>
          </>
        )}
        {step === 5 && (
          <button onClick={onComplete} className="flex-1 btn-primary text-sm">View Purchased Goods</button>
        )}
      </div>
    </div>
  );
}