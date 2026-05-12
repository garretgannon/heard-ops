import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { X, Upload, Download, ChevronRight, AlertTriangle, CheckCircle2, SkipForward, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

const IMPORT_FIELDS = [
  ['itemName','Item Name *'],['vendorName','Vendor'],['vendorItemNumber','Vendor Item #'],
  ['category','Category'],['subcategory','Subcategory'],['brand','Brand'],
  ['purchaseUnit','Purchase Unit'],['packSize','Pack Size'],['caseQuantity','Case Quantity'],
  ['innerPackQuantity','Inner Pack Qty'],['itemSize','Item Size'],['itemUnit','Item Unit'],
  ['caseCost','Case Cost'],['unitCost','Unit Cost'],['recipeUnit','Recipe Unit'],
  ['inventoryUnit','Inventory Unit'],['storageArea','Storage Area'],['station','Station'],
  ['taxable','Taxable'],['active','Active Status'],['notes','Notes'],
];

// Removed sample CSV - always import from user-provided file only

function splitCSVLine(line, delimiter = ',') {
  const vals = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === delimiter && !inQuotes) {
      vals.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  vals.push(cur.trim());
  return vals;
}

function detectDelimiter(lines) {
  if (!lines || lines.length === 0) return ',';
  // Try each delimiter on first data line and pick the one that yields most non-empty columns
  let firstDataLine = lines[0] || '';
  // Skip empty lines at the start
  for (const line of lines) {
    if (line.trim().length > 0) { firstDataLine = line; break; }
  }
  const delimiters = [',', '\t', ';', '|'];
  let bestDelim = ',';
  let maxCols = 0;
  for (const delim of delimiters) {
    const cols = splitCSVLine(firstDataLine, delim).filter(c => c.trim().length > 0).length;
    if (cols > maxCols) { maxCols = cols; bestDelim = delim; }
  }
  return maxCols < 1 ? ',' : bestDelim;
}

function parseCSV(text) {
  const lines = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  if (nonEmptyLines.length < 1) return { headers: [], rows: [] };
  const delimiter = detectDelimiter(nonEmptyLines);
  const headerLine = nonEmptyLines[0];
  const rawHeaders = splitCSVLine(headerLine, delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const headers = rawHeaders.filter(h => h.length > 0);
  if (headers.length < 1) return { headers: [], rows: [] };
  const rows = nonEmptyLines.slice(1).map((line, idx) => {
    const vals = splitCSVLine(line, delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    row._rowIndex = idx + 2;
    return row;
  });
  return { headers, rows };
}

function validateRow(mapped) {
  const issues = [];
  if (!mapped.itemName) issues.push('Missing item name');
  if (mapped.caseCost && isNaN(parseFloat(mapped.caseCost))) issues.push('Invalid cost format');
  return issues;
}



export default function ImportFlow({ onClose, onComplete, user }) {
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [usePaste, setUsePaste] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef();

  const STEP_LABELS = ['Upload', 'Map Columns', 'Preview', 'Resolve Issues', 'Confirm', 'Complete'];

  const handleFile = (file) => {
    if (!file) return;
    setFileLoading(true);
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onerror = () => {
        alert('Failed to read file. Please try again.');
        setFileLoading(false);
      };
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(ws);
          const { headers, rows } = parseCSV(csv);
          if (headers.length < 1) {
            alert('Could not detect columns. Check file format.');
            setFileLoading(false);
            return;
          }
          setHeaders(headers);
          setRawRows(rows);
          const autoMap = {};
          headers.forEach(h => {
            const normalized = h.toLowerCase().replace(/[\s\-_/]+/g, '');
            const match = IMPORT_FIELDS.find(([k, l]) =>
              k.toLowerCase() === normalized ||
              l.toLowerCase().replace(/[\s\-_/*]+/g, '') === normalized
            );
            if (match) autoMap[h] = match[0];
          });
          setMapping(autoMap);
          setFileLoading(false);
          setStep(2);
        } catch (err) {
          console.error('Excel parse error:', err);
          alert('Error reading Excel file: ' + err.message);
          setFileLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result);
      if (headers.length < 2) {
        alert(`Only detected ${headers.length} column(s). Make sure your file is comma-separated, tab-separated, or semicolon-separated CSV.`);
        return;
      }
      setHeaders(headers);
      setRawRows(rows);
      const autoMap = {};
      headers.forEach(h => {
        const normalized = h.toLowerCase().replace(/[\s\-_/]+/g, '');
        const match = IMPORT_FIELDS.find(([k, l]) =>
          k.toLowerCase() === normalized ||
          l.toLowerCase().replace(/[\s\-_/*]+/g, '') === normalized
        );
        if (match) autoMap[h] = match[0];
      });
      setMapping(autoMap);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    const { headers, rows } = parseCSV(pasteText);
    if (headers.length < 2) {
      alert(`Only detected ${headers.length} column(s). Make sure your data is properly delimited (comma, tab, or semicolon).`);
      return;
    }
    setHeaders(headers);
    setRawRows(rows);
    const autoMap = {};
    headers.forEach(h => {
      const normalized = h.toLowerCase().replace(/[\s\-_/]+/g, '');
      const match = IMPORT_FIELDS.find(([k, l]) =>
        k.toLowerCase() === normalized ||
        l.toLowerCase().replace(/[\s\-_/*]+/g, '') === normalized
      );
      if (match) autoMap[h] = match[0];
    });
    setMapping(autoMap);
    setStep(2);
  };

  const buildPreview = () => {
    const seenInBatch = new Set();
    const rows = rawRows.map((raw, idx) => {
      const mapped = {};
      Object.entries(mapping).forEach(([header, field]) => {
        if (field && raw[header] !== undefined) mapped[field] = raw[header];
      });
      mapped._rowIndex = raw._rowIndex || idx + 2;
      const issues = validateRow(mapped);
      const normalizedName = (mapped.itemName || '').toLowerCase().trim();
      if (seenInBatch.has(normalizedName)) {
        issues.push('Duplicate item in import');
      } else if (normalizedName) {
        seenInBatch.add(normalizedName);
      }
      return { raw, mapped, issues, status: issues.length > 0 ? 'issue' : 'ok', action: 'create' };
    });
    setPreviewRows(rows);
    setStep(3);
  };

  const doImport = async () => {
    setImporting(true);
    let created = 0, updated = 0, skipped = 0;

    const batchId = await base44.entities.PurchasedItemImportBatch.create({
      fileName: 'Import',
      uploadedBy: user?.email || '',
      uploadedAt: new Date().toISOString(),
      status: 'confirmed',
      totalRows: previewRows.length,
    }).then(b => b.id).catch(() => null);

    const allItems = await base44.entities.PurchasedItem.list('-updated_date', 2000).catch(() => []);

    const toCreate = [];
    const toUpdate = []; // { id, payload }

    for (const row of previewRows) {
      if (row.action === 'skip') { skipped++; continue; }
      if (row.issues.length > 0 && row.action !== 'create') { skipped++; continue; }

      const d = row.mapped;
      const payload = {};
      Object.entries(d).forEach(([k, v]) => { if (v !== '' && v !== undefined && !k.startsWith('_')) payload[k] = v; });
      if (!payload.itemName) { skipped++; continue; }

      ['caseQuantity','caseCost','unitCost','conversionFactor','itemSize','edibleYieldPercent'].forEach(k => {
        if (payload[k]) payload[k] = parseFloat(payload[k]) || 0;
      });
      if (payload.active !== undefined) payload.active = ['true','yes','1','active'].includes(String(payload.active).toLowerCase());
      payload.normalizedName = payload.itemName.toLowerCase().trim();

      const existing = allItems.find(i =>
        (payload.vendorItemNumber && i.vendorItemNumber === payload.vendorItemNumber && i.vendorName?.toLowerCase() === payload.vendorName?.toLowerCase()) ||
        (i.normalizedName === payload.normalizedName && i.vendorName?.toLowerCase() === payload.vendorName?.toLowerCase())
      );

      if (existing && row.action !== 'create') {
        toUpdate.push({ id: existing.id, oldCaseCost: existing.caseCost, payload });
      } else {
        payload.importBatchId = batchId;
        payload.lastPriceUpdate = new Date().toISOString();
        toCreate.push(payload);
      }
    }

    // Bulk create all new items
    if (toCreate.length > 0) {
      const CHUNK = 200;
      for (let i = 0; i < toCreate.length; i += CHUNK) {
        await base44.entities.PurchasedItem.bulkCreate(toCreate.slice(i, i + CHUNK)).catch(() => {});
      }
      created = toCreate.length;
    }

    // Sequential updates (need price history tracking)
    for (const { id, oldCaseCost, payload } of toUpdate) {
      if (payload.caseCost && oldCaseCost !== payload.caseCost) {
        await base44.entities.PurchasedItemPriceHistory.create({
          purchasedItemId: id, vendorName: payload.vendorName,
          oldCaseCost, newCaseCost: payload.caseCost,
          changePercent: oldCaseCost ? ((payload.caseCost - oldCaseCost) / oldCaseCost * 100).toFixed(1) : 0,
          source: 'import', changedAt: new Date().toISOString(),
        }).catch(() => {});
        payload.lastPriceUpdate = new Date().toISOString();
      }
      await base44.entities.PurchasedItem.update(id, payload).catch(() => {});
      updated++;
    }

    skipped += previewRows.filter(r => r.action === 'skip').length;

    if (batchId) {
      await base44.entities.PurchasedItemImportBatch.update(batchId, {
        status: 'complete', createdCount: created, updatedCount: updated, skippedCount: skipped,
      }).catch(() => {});
    }

    haptics.success();
    setResult({ created, updated, skipped });
    setImporting(false);
    setStep(6);
  };

  const issueRows = previewRows.filter(r => r.issues.length > 0);
  const okRows = previewRows.filter(r => r.issues.length === 0);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => { haptics.light(); onClose?.(); }} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-border transition-all active:scale-95">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-extrabold text-foreground">Import Purchased Items</h2>
          <p className="text-[10px] text-muted-foreground">Step {step} of 6: {STEP_LABELS[step - 1]}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex px-4 py-2 gap-1 bg-muted/30 border-b border-border shrink-0">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i + 1 <= step ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center py-8 bg-card border-2 border-dashed border-border rounded-xl">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-foreground mb-1">Upload CSV or Excel</p>
              <p className="text-xs text-muted-foreground mb-3">Drag and drop or click to select a file</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()} disabled={fileLoading} className="btn-primary text-sm px-4 py-2">{fileLoading ? 'Reading...' : 'Choose File'}</button>
            </div>



            <div className="card-glass border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground">Or paste table data</p>
                <button onClick={() => setUsePaste(!usePaste)} className="text-[10px] font-bold text-primary">{usePaste ? 'Hide' : 'Show'}</button>
              </div>
              {usePaste && (
                <div className="space-y-2">
                  <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste CSV or tab-delimited table here…" rows={5} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground resize-none font-mono" />
                  <button onClick={handlePaste} disabled={!pasteText.trim()} className="btn-primary text-sm w-full">Parse Pasted Data</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Map Columns */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Map your file's columns to app fields. Auto-detected mappings are pre-filled.</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{rawRows.length} rows detected · {headers.length} columns</p>
            <div className="space-y-2">
              {headers.map(header => (
                <div key={header} className="flex items-center gap-2 card-glass border border-border rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-foreground flex-1 truncate">{header}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <select
                    value={mapping[header] || ''}
                    onChange={e => setMapping(p => ({ ...p, [header]: e.target.value }))}
                    className="w-40 px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground"
                  >
                    <option value="">— Skip —</option>
                    {IMPORT_FIELDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={buildPreview} className="w-full btn-primary text-sm py-2.5">Preview Import →</button>
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-green-400">{okRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Ready</p>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-amber-400">{issueRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Issues</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-foreground">{previewRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="space-y-2">
              {previewRows.map((row, idx) => (
                <div key={idx} className={`bg-card border rounded-lg px-3 py-2 ${row.issues.length > 0 ? 'border-amber-500/30' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{row.mapped.itemName || <span className="text-red-400">Missing name</span>}</p>
                      <p className="text-[10px] text-muted-foreground">{row.mapped.vendorName || '—'} · {row.mapped.purchaseUnit || '—'} · {row.mapped.caseCost ? `$${row.mapped.caseCost}` : 'No cost'}</p>
                    </div>
                    {row.issues.length > 0 ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                  {row.issues.length > 0 && (
                    <p className="text-[10px] text-amber-400 mt-1">{row.issues.join(' · ')}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {issueRows.length > 0 && (
                <button onClick={() => setStep(4)} className="flex-1 btn-secondary text-sm">Resolve Issues →</button>
              )}
              <button onClick={() => setStep(5)} className="flex-1 btn-primary text-sm">Confirm Import →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Resolve Issues */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{issueRows.length} rows have issues. Choose an action for each or skip them.</p>
            <div className="space-y-3">
              {issueRows.map((row, idx) => {
                const globalIdx = previewRows.indexOf(row);
                return (
                  <div key={idx} className="bg-card border border-amber-500/30 rounded-xl p-3">
                    <p className="text-xs font-bold text-foreground">{row.mapped.itemName || `Row ${row.mapped._rowIndex}`}</p>
                    <p className="text-[10px] text-amber-400 mb-2">{row.issues.join(' · ')}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setPreviewRows(p => p.map((r, i) => i === globalIdx ? { ...r, action: 'create' } : r))}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${row.action === 'create' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'}`}
                      >Import Anyway</button>
                      <button
                        onClick={() => setPreviewRows(p => p.map((r, i) => i === globalIdx ? { ...r, action: 'skip' } : r))}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${row.action === 'skip' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-muted border-border text-muted-foreground'}`}
                      >Skip Row</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setStep(5)} className="w-full btn-primary text-sm py-2.5">Continue to Confirm →</button>
          </div>
        )}

        {/* STEP 5: Confirm */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="card-glass border border-border rounded-xl p-4 space-y-2">
              <p className="text-sm font-extrabold text-foreground mb-3">Ready to Import</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total rows</span>
                  <span className="font-bold text-foreground">{previewRows.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Will be created</span>
                  <span className="font-bold text-green-400">{previewRows.filter(r => r.action !== 'skip').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Will be skipped</span>
                  <span className="font-bold text-muted-foreground">{previewRows.filter(r => r.action === 'skip').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rows with issues</span>
                  <span className={`font-bold ${issueRows.length > 0 ? 'text-amber-400' : 'text-green-400'}`}>{issueRows.length}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Existing items matched by vendor item # or name+vendor will be updated. Price changes will be logged to price history. Existing values will NOT be overwritten with blank imported values.</p>
            <button onClick={doImport} disabled={importing} className="w-full btn-primary text-sm py-3 flex items-center justify-center gap-2">
              {importing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Importing…</> : 'Confirm & Import'}
            </button>
          </div>
        )}

        {/* STEP 6: Complete */}
        {step === 6 && result && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-extrabold text-foreground">Import Complete!</p>
            </div>
            <div className="card-glass border border-border rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items created</span><span className="font-bold text-green-400">{result.created}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items updated</span><span className="font-bold text-primary">{result.updated}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rows skipped</span><span className="font-bold text-muted-foreground">{result.skipped}</span></div>
            </div>
            <button onClick={onComplete} className="w-full btn-primary text-sm py-3">View Purchased Items</button>
          </div>
        )}
      </div>
    </div>
  );
}