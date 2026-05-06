import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { X, Upload, Download, ChevronRight, AlertTriangle, CheckCircle2, SkipForward, RefreshCw } from 'lucide-react';

const IMPORT_FIELDS = [
  ['itemName','Item Name *'],['vendorName','Vendor'],['vendorItemNumber','Vendor Item #'],
  ['category','Category'],['subcategory','Subcategory'],['brand','Brand'],
  ['purchaseUnit','Purchase Unit'],['packSize','Pack Size'],['caseQuantity','Case Quantity'],
  ['innerPackQuantity','Inner Pack Qty'],['itemSize','Item Size'],['itemUnit','Item Unit'],
  ['caseCost','Case Cost'],['unitCost','Unit Cost'],['recipeUnit','Recipe Unit'],
  ['inventoryUnit','Inventory Unit'],['storageArea','Storage Area'],['station','Station'],
  ['taxable','Taxable'],['active','Active Status'],['notes','Notes'],
];

const SAMPLE_CSV = `Item Name,Vendor,Vendor Item Number,Category,Subcategory,Brand,Purchase Unit,Pack Size,Case Quantity,Inner Pack Quantity,Item Size,Item Unit,Total Case Size,Case Cost,Recipe Unit,Inventory Unit,Storage Area,Station,Taxable,Active,Notes
Chicken Breast Boneless Skinless,Sysco,SYS-1234567,protein,Poultry,Fieldale,case,40 lb,1,,40,lb,40,98.40,oz,lb,Walk-in Cooler,Grill,false,true,Fresh never frozen
Roma Tomatoes,US Foods,USF-7654321,produce,Tomatoes,,case,25 lb,1,,25,lb,25,18.50,lb,lb,Walk-in Cooler,Pantry,false,true,
Red Onion,Restaurant Depot,RD-2345678,produce,Onions,,case,50 lb,1,,50,lb,50,22.00,lb,lb,Walk-in Cooler,Prep,false,true,
Cilantro Bunch,Sysco,SYS-3456789,produce,Herbs,,case,24 each,1,24,1,each,24,16.80,each,each,Walk-in Cooler,Prep,false,true,
All-Purpose Flour,Sysco,SYS-4567890,dry-goods,Flour,Gold Medal,case,50 lb,1,,50,lb,50,24.50,oz,lb,Dry Storage,Prep,false,true,Bread and all-purpose
Fry Oil Soybean,Restaurant Depot,RD-5678901,dry-goods,Oils,Stratas,case,35 lb,1,5,7,lb,35,38.00,oz,lb,Dry Storage,Fry,false,true,7lb jugs 5 per case
Ranch Dressing,US Foods,USF-6789012,dry-goods,Dressings,Hidden Valley,case,4 gallon,4,1,1,gal,4,42.00,oz,gal,Dry Storage,Pantry,false,true,
Nitrile Gloves Medium,Sysco,SYS-7890123,disposables,Gloves,Kimberly-Clark,case,1000 each,10,100,100,each,1000,58.00,each,each,Dry Storage,,false,true,Box of 100 10 per case
To-Go Boxes 9x9,Restaurant Depot,RD-8901234,paper,Containers,,case,200 each,1,1,200,each,200,34.00,each,each,Dry Storage,,false,true,Kraft single compartment
Sanitizer Test Strips,Sysco,SYS-9012345,chemicals,Sanitation,Ecolab,case,100 each,1,1,100,each,100,12.50,each,each,Chemical Storage,,false,true,Chlorine 0-200ppm range`;

function splitCSVLine(line) {
  const vals = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      vals.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  vals.push(cur.trim());
  return vals;
}

function parseCSV(text) {
  // Normalize line endings
  const lines = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const vals = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    row._rowIndex = idx + 2;
    return row;
  });
  return { headers, rows };
}

function validateRow(mapped) {
  const issues = [];
  if (!mapped.itemName) issues.push('Missing item name');
  if (!mapped.vendorName) issues.push('Missing vendor');
  if (!mapped.caseCost && !mapped.unitCost) issues.push('Missing cost');
  if (!mapped.purchaseUnit) issues.push('Missing purchase unit');
  if (mapped.caseCost && isNaN(parseFloat(mapped.caseCost))) issues.push('Invalid cost format');
  return issues;
}

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'purchased-items-template.csv';
  a.click();
  URL.revokeObjectURL(url);
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
  const fileRef = useRef();

  const STEP_LABELS = ['Upload', 'Map Columns', 'Preview', 'Resolve Issues', 'Confirm', 'Complete'];

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result);
      setHeaders(headers);
      setRawRows(rows);
      // Auto-map obvious columns
      const autoMap = {};
      const fieldLabels = IMPORT_FIELDS.map(([k]) => k.toLowerCase());
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
    const rows = rawRows.map((raw, idx) => {
      const mapped = {};
      Object.entries(mapping).forEach(([header, field]) => {
        if (field && raw[header] !== undefined) mapped[field] = raw[header];
      });
      mapped._rowIndex = raw._rowIndex || idx + 2;
      const issues = validateRow(mapped);
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

    const allItems = await base44.entities.PurchasedItem.list('-updated_date', 1000).catch(() => []);

    for (const row of previewRows) {
      if (row.action === 'skip') { skipped++; continue; }
      if (row.issues.length > 0 && row.action !== 'create') { skipped++; continue; }

      const d = row.mapped;
      // Only set non-blank fields
      const payload = {};
      Object.entries(d).forEach(([k, v]) => { if (v !== '' && v !== undefined && !k.startsWith('_')) payload[k] = v; });
      if (!payload.itemName) { skipped++; continue; }

      // Calculate numeric fields
      ['caseQuantity','caseCost','unitCost','conversionFactor','itemSize','edibleYieldPercent'].forEach(k => {
        if (payload[k]) payload[k] = parseFloat(payload[k]) || 0;
      });
      if (payload.active !== undefined) payload.active = ['true','yes','1','active'].includes(String(payload.active).toLowerCase());
      payload.normalizedName = payload.itemName.toLowerCase().trim();

      // Match existing
      const existing = allItems.find(i =>
        (payload.vendorItemNumber && i.vendorItemNumber === payload.vendorItemNumber && i.vendorName?.toLowerCase() === payload.vendorName?.toLowerCase()) ||
        (i.normalizedName === payload.normalizedName && i.vendorName?.toLowerCase() === payload.vendorName?.toLowerCase())
      );

      if (existing && row.action !== 'create') {
        // Track price change
        if (payload.caseCost && existing.caseCost !== payload.caseCost) {
          await base44.entities.PurchasedItemPriceHistory.create({
            purchasedItemId: existing.id, vendorName: payload.vendorName || existing.vendorName,
            oldCaseCost: existing.caseCost, newCaseCost: payload.caseCost,
            changePercent: existing.caseCost ? ((payload.caseCost - existing.caseCost) / existing.caseCost * 100).toFixed(1) : 0,
            source: 'import', changedAt: new Date().toISOString(),
          }).catch(() => {});
          payload.lastPriceUpdate = new Date().toISOString();
        }
        // Only update non-blank fields
        await base44.entities.PurchasedItem.update(existing.id, payload).catch(() => {});
        updated++;
      } else {
        payload.importBatchId = batchId;
        payload.lastPriceUpdate = new Date().toISOString();
        await base44.entities.PurchasedItem.create(payload).catch(() => {});
        created++;
      }
    }

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
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
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
              <button onClick={() => fileRef.current?.click()} className="btn-primary text-sm px-4 py-2">Choose File</button>
            </div>

            <button onClick={downloadSample} className="w-full flex items-center gap-2 justify-center text-xs font-bold text-muted-foreground py-2 border border-border rounded-lg bg-card">
              <Download className="h-3.5 w-3.5" /> Download Sample Template
            </button>

            <div className="bg-card border border-border rounded-xl p-4">
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
                <div key={header} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
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
              {previewRows.slice(0, 50).map((row, idx) => (
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
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
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
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
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