import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import * as XLSX from 'xlsx';

const CATEGORY_KEYWORDS = {
  dairy: ['yogurt', 'cheese', 'cream', 'milk', 'butter', 'sour cream'],
  protein: ['turkey', 'tuna', 'walleye', 'chicken', 'beef', 'pork', 'fish', 'shrimp'],
  'dry-goods': ['vinegar', 'oil', 'sauce', 'spice', 'flour', 'sugar', 'salt', 'rice'],
  paper: ['towel', 'foil', 'napkin', 'wrap', 'bag', 'container', 'box'],
  beverage: ['water', 'juice', 'soda', 'coffee', 'tea', 'milk'],
  produce: ['tomato', 'onion', 'lettuce', 'herb', 'vegetable', 'fruit', 'salad'],
  chemicals: ['chemical', 'soap', 'sanitizer', 'cleaner', 'bleach', 'detergent'],
};

function parseFile(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = e.target.result;
      let rows = [];
      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder('utf-8').decode(new Uint8Array(data));
        rows = parseCSV(text);
      } else {
        const wb = XLSX.read(data, { type: 'array' });
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
  const keywords = ['product', 'description', 'pack', 'price', 'unit'];
  for (let i = 0; i < Math.min(25, rows.length); i++) {
    const row = rows[i] || [];
    const rowStr = row.join(' ').toLowerCase();
    const matches = keywords.filter(kw => rowStr.includes(kw)).length;
    if (matches >= 2) return i;
  }
  return 0;
}

function suggestCategory(description) {
  const desc = (description || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) return category;
  }
  return null;
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  const cleaned = String(priceStr).replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseAverage(avgStr) {
  if (!avgStr) return { qty: null, unit: null };
  const match = String(avgStr).trim().match(/^([\d.]+)\s*([A-Z]+)$/i);
  if (match) return { qty: parseFloat(match[1]) || null, unit: match[2].toUpperCase() };
  return { qty: null, unit: null };
}

export default function VendorImportFlow({ onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [rawRows, setRawRows] = useState([]);
  const [headerRowIdx, setHeaderRowIdx] = useState(0);
  const [columnMapping, setColumnMapping] = useState({});
  const [vendorName, setVendorName] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    parseFile(file, (rows, error) => {
      if (error) {
        alert('Error reading file: ' + error);
        return;
      }
      setRawRows(rows);
      const headerIdx = detectHeaderRow(rows);
      setHeaderRowIdx(headerIdx);
      const headers = rows[headerIdx] || [];
      const mapping = {};
      const fieldMap = {
        product: 'vendorItemCode',
        description: 'itemName',
        pack: 'packSize',
        brand: 'brand',
        price: 'caseCost',
        cost: 'caseCost',
        case: 'caseCost',
        unit: 'purchaseUnit',
        avg: 'averageOrderQty',
        lwp: 'lastWeekPurchase',
      };
      headers.forEach((header, idx) => {
        const lower = (header || '').toLowerCase();
        for (const [keyword, field] of Object.entries(fieldMap)) {
          if (lower.includes(keyword)) {
            mapping[idx] = field;
            break;
          }
        }
      });
      setColumnMapping(mapping);
      setStep(2);
    });
  };

  const buildPreview = () => {
    const rows = rawRows.slice(headerRowIdx + 1)
      .filter(row => row.some(cell => String(cell).trim().length > 0))
      .map((row, idx) => {
        const mapped = {};
        Object.entries(columnMapping).forEach(([colIdx, field]) => {
          const val = row[parseInt(colIdx)] || '';
          if (field === 'caseCost') {
            mapped[field] = parsePrice(val);
          } else if (field === 'averageOrderQty') {
            const avg = parseAverage(val);
            mapped[field] = avg.qty;
            mapped.averageOrderUnit = avg.unit;
          } else {
            mapped[field] = String(val).trim();
          }
        });
        mapped.vendorName = vendorName;
        mapped.category = suggestCategory(mapped.itemName);
        mapped.rawPackSize = mapped.packSize;
        const issues = [];
        if (!mapped.itemName) issues.push('Missing description');
        if (mapped.caseCost === null || mapped.caseCost === undefined) issues.push('Missing/invalid price');
        if (!mapped.purchaseUnit) issues.push('Missing unit');
        return { row, mapped, issues, status: issues.length > 0 ? 'error' : 'ok' };
      });
    setPreviewRows(rows);
    setStep(4);
  };

  const doImport = async () => {
    setImporting(true);
    const okCount = previewRows.filter(r => r.issues.length === 0).length;
    setImportProgress({ current: 0, total: okCount });
    let created = 0, updated = 0, skipped = 0, processed = 0;
    const errors = [];

    try {
      const existing = await base44.entities.PurchasedItem.list('-updated_date', 5000).catch(() => []);
      for (const row of previewRows) {
        if (row.issues.length > 0) {
          errors.push({ itemName: row.mapped.itemName, issues: row.issues });
          skipped++;
          continue;
        }
        const payload = {};
        Object.entries(row.mapped).forEach(([k, v]) => {
          if (v !== null && v !== '' && !k.startsWith('_')) {
            const fieldMap = {
              itemName: 'itemName',
              vendorName: 'vendorName',
              vendorItemCode: 'vendorItemNumber',
              brand: 'brand',
              packSize: 'packSize',
              purchaseUnit: 'purchaseUnit',
              caseCost: 'caseCost',
              category: 'category',
              averageOrderQty: 'averageOrderQuantity',
              averageOrderUnit: 'averageOrderUnit',
            };
            const appField = fieldMap[k];
            if (appField) payload[appField] = v;
          }
        });
        const match = existing.find(item =>
          item.vendorNumber === payload.vendorItemNumber && 
          item.vendorName?.toLowerCase() === vendorName.toLowerCase()
        );
        if (match) {
          await base44.entities.PurchasedItem.update(match.id, payload).catch(() => {});
          updated++;
        } else {
          try {
            await base44.entities.PurchasedItem.create(payload);
            created++;
          } catch (err) {
            errors.push({ itemName: row.mapped.itemName, issues: [err.message] });
            skipped++;
          }
        }
        processed++;
        setImportProgress({ current: processed, total: okCount });
      }
      haptics.success?.() || haptics.medium?.();
      setResult({ created, updated, skipped, errors, total: previewRows.length });
      setStep(6);
    } catch (err) {
      console.error(err);
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const errorRows = previewRows.filter(r => r.issues.length > 0);
  const okRows = previewRows.filter(r => r.issues.length === 0);

  const progressWidth = importProgress.total > 0 ? `${(importProgress.current / importProgress.total) * 100}%` : '0%';

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => { haptics.light?.(); onClose?.(); }} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold">Import Vendor Purchase History</h2>
          <p className="text-[10px] text-muted-foreground">Step {step} of 6</p>
        </div>
      </div>

      <div className="flex px-4 py-2 gap-1 bg-muted/30 border-b border-border shrink-0">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center py-8 bg-card border-2 border-dashed border-border rounded-xl">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold mb-1">Upload Purchase History Export</p>
              <p className="text-xs text-muted-foreground mb-3">CSV, XLS, or XLSX</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Which vendor is this file from?</p>
            <input
              value={vendorName}
              onChange={e => setVendorName(e.target.value)}
              placeholder="Enter vendor name (e.g., US Foods, Sysco)"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            />
            <p className="text-[10px] text-muted-foreground">All items in this file will be tagged with this vendor.</p>
          </div>
        )}

        {step === 4 && (
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
                <p className="text-lg font-bold">{previewRows.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto">
              {previewRows.slice(0, 50).map((row, idx) => (
                <div key={idx} className={`bg-card border rounded px-2 py-1.5 text-xs ${row.issues.length > 0 ? 'border-red-500/30' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{row.mapped.itemName || 'unnamed'}</p>
                      <p className="text-muted-foreground truncate">{row.mapped.vendorItemCode} - ${row.mapped.caseCost} - {row.mapped.purchaseUnit}</p>
                    </div>
                    {row.issues.length > 0 ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    )}
                  </div>
                  {row.issues.length > 0 && (
                    <p className="text-[9px] text-red-400 mt-1">{row.issues.join(' - ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 6 && result && (
          <div className="space-y-3">
            <div className="text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
              <p className="font-bold">Import Complete</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-bold text-green-400">{result.created}</span></div>
              {result.updated > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span className="font-bold text-primary">{result.updated}</span></div>}
              {result.errors.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Errors</span><span className="font-bold text-red-400">{result.errors.length}</span></div>}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3">
        <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={e => { handleFile(e.target.files[0]); setStep(2); }} />
        {step === 1 && <button onClick={() => fileRef.current?.click()} className="w-full btn-primary text-sm">Choose File</button>}
        {step === 2 && <button onClick={() => setStep(3)} disabled={!vendorName} className="w-full btn-primary text-sm disabled:opacity-50">Continue to Step 3</button>}
        {step === 3 && <button onClick={buildPreview} className="w-full btn-primary text-sm">Preview Import</button>}
        {step === 4 && !importing && <button onClick={doImport} disabled={okRows.length === 0} className="w-full btn-primary text-sm disabled:opacity-50">Start Import</button>}
        {step === 4 && importing && (
          <div className="space-y-1">
            <div className="w-full h-10 rounded-lg bg-background border border-primary flex items-center justify-center relative overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: progressWidth }} />
              <span className="absolute text-xs font-bold text-foreground">{importProgress.current}/{importProgress.total}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">Importing items...</p>
          </div>
        )}
        {step === 6 && <button onClick={onComplete} className="w-full btn-primary text-sm">View Purchased Goods</button>}
      </div>
    </div>
  );
}