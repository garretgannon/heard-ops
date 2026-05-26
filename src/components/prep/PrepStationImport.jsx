import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Upload, Download, X, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

const MODE_ASSIGN = 'assign';
const MODE_CREATE = 'create';

const SAMPLE_ASSIGN = [
  ['Template Name', 'Station Name', 'Override Par', 'Override Unit', 'Override Notes', 'Display Order', 'Active'],
  ['Opening Line Prep', 'Hot Line', '10', 'lbs', 'Double on Fridays', '1', 'TRUE'],
  ['Sauce Station Setup', 'Cold Line', '', '', '', '2', 'TRUE'],
  ['Opening Line Prep', 'Cold Line', '5', 'portions', '', '1', 'TRUE'],
];

const SAMPLE_CREATE = [
  ['Template Name', 'Station', 'Shift', 'Role', 'Notes', 'Active'],
  ['Opening Line Prep', 'Hot Line', 'opening', 'Line Cook', 'Complete before 10am', 'TRUE'],
  ['Closing Cold Line', 'Cold Line', 'closing', 'Prep Cook', 'Cover all pans', 'TRUE'],
];

function downloadSample(mode) {
  const rows = mode === MODE_ASSIGN ? SAMPLE_ASSIGN : SAMPLE_CREATE;
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import');
  XLSX.writeFile(wb, mode === MODE_ASSIGN ? 'prep_station_assignments_sample.xlsx' : 'prep_templates_sample.xlsx');
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function normalize(str) {
  return (str || '').toString().trim().toLowerCase();
}

function boolVal(v) {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') return !['false', '0', 'no', ''].includes(v.trim().toLowerCase());
  return Boolean(v);
}

export default function PrepStationImport({ isOpen, onClose, onImportComplete }) {
  const [step, setStep] = useState(1); // 1=upload, 2=mode, 3=preview, 4=confirm, 5=result
  const [mode, setMode] = useState(MODE_ASSIGN);
  const [file, setFile] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null); // { valid, skipped, warnings }
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep(1); setMode(MODE_ASSIGN); setFile(null); setRawRows([]);
    setParsing(false); setPreview(null); setImporting(false); setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsing(true);
    try {
      const rows = await parseFile(f);
      setRawRows(rows);
      setParsing(false);
      setStep(2);
    } catch {
      toast.error('Failed to parse file');
      setParsing(false);
    }
  };

  const buildPreview = async () => {
    const [templates, stations, existingAssignments] = await Promise.all([
      base44.entities.PrepPlanTemplate?.filter?.({ archived: false }).catch(() => []),
      base44.entities.Station.filter({ isActive: true }).catch(() => []),
      mode === MODE_ASSIGN
        ? base44.entities.StationPrepAssignment.list('-created_date', 500).catch(() => [])
        : Promise.resolve([]),
    ]);

    const templateMap = {};
    (templates || []).forEach(t => { templateMap[normalize(t.template_name)] = t; });

    const stationMap = {};
    (stations || []).forEach(s => { stationMap[normalize(s.name)] = s; });

    const valid = [];
    const skipped = [];

    if (mode === MODE_ASSIGN) {
      rawRows.forEach((row, idx) => {
        const tName = normalize(row['Template Name'] ?? row['template_name'] ?? row['TemplateName'] ?? '');
        const sName = normalize(row['Station Name'] ?? row['Station'] ?? row['station_name'] ?? row['station'] ?? '');
        const template = templateMap[tName];
        const station = stationMap[sName];

        const errors = [];
        if (!tName) errors.push('Missing template name');
        if (!sName) errors.push('Missing station name');
        if (tName && !template) errors.push(`Template not found: "${row['Template Name'] ?? row['template_name']}"`);
        if (sName && !station) errors.push(`Station not found: "${row['Station Name'] ?? row['Station'] ?? row['station_name'] ?? row['station']}"`);

        const isDuplicate = template && station
          ? (existingAssignments || []).some(a => a.prep_template_id === template.id && a.station_id === station.id)
          : false;

        const item = {
          rowNum: idx + 2,
          raw: row,
          template,
          station,
          override_par: row['Override Par'] !== '' ? parseFloat(row['Override Par']) || null : null,
          override_unit: row['Override Unit'] || null,
          override_notes: row['Override Notes'] || null,
          display_order: row['Display Order'] !== '' ? parseInt(row['Display Order']) || null : null,
          active: boolVal(row['Active'] !== undefined ? row['Active'] : true),
          errors,
          isDuplicate,
        };

        if (errors.length > 0) {
          skipped.push({ ...item, reason: errors.join('; ') });
        } else if (isDuplicate) {
          skipped.push({ ...item, reason: 'Already assigned — will skip (no duplicate created)' });
        } else {
          valid.push(item);
        }
      });
    } else {
      // Mode 2: create/update templates
      rawRows.forEach((row, idx) => {
        const tName = (row['Template Name'] ?? row['template_name'] ?? '').toString().trim();
        const sName = normalize(row['Station'] ?? row['station'] ?? '');
        const station = stationMap[sName];

        const errors = [];
        if (!tName) errors.push('Missing template name');
        if (sName && !station) errors.push(`Station not found: "${row['Station'] ?? row['station']}"`);

        const existing = templateMap[normalize(tName)];

        const item = {
          rowNum: idx + 2,
          raw: row,
          templateName: tName,
          station,
          existing,
          shift: row['Shift'] || 'any',
          assigned_role: row['Role'] || '',
          notes: row['Notes'] || '',
          active: boolVal(row['Active'] !== undefined ? row['Active'] : true),
          errors,
          action: existing ? 'update' : 'create',
        };

        if (errors.length > 0) {
          skipped.push({ ...item, reason: errors.join('; ') });
        } else {
          valid.push(item);
        }
      });
    }

    setPreview({ valid, skipped });
    setStep(3);
  };

  const handleImport = async () => {
    if (!preview?.valid?.length) return;
    setImporting(true);
    let success = 0;
    let fail = 0;
    const errors = [];

    for (const item of preview.valid) {
      try {
        if (mode === MODE_ASSIGN) {
          await base44.entities.StationPrepAssignment.create({
            prep_template_id: item.template.id,
            template_name: item.template.template_name,
            station_id: item.station.id,
            station_name: item.station.name,
            override_par: item.override_par,
            override_unit: item.override_unit,
            override_notes: item.override_notes,
            display_order: item.display_order,
            active: item.active,
          });
        } else {
          const payload = {
            template_name: item.templateName,
            station: item.station?.name || '',
            shift: item.shift,
            assigned_role: item.assigned_role,
            notes: item.notes,
            is_active: item.active,
            status: 'draft',
            items: [],
            recurring_days: [],
          };
          if (item.existing) {
            await base44.entities.PrepPlanTemplate?.update?.(item.existing.id, payload);
          } else {
            await base44.entities.PrepPlanTemplate?.create?.(payload);
          }
        }
        success++;
      } catch (e) {
        fail++;
        errors.push(`Row ${item.rowNum}: ${e.message || 'Unknown error'}`);
      }
    }

    setResult({ success, fail, skipped: preview.skipped.length, errors });
    setImporting(false);
    setStep(5);
    if (success > 0) onImportComplete?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-2xl bg-card border border-border/40 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Prep Library Import</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Step {step} of 5 — {
                step === 1 ? 'Upload file' :
                step === 2 ? 'Choose mode' :
                step === 3 ? 'Preview' :
                step === 4 ? 'Confirm' : 'Done'
              }
            </p>
          </div>
          <button onClick={handleClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex px-6 py-3 gap-1 shrink-0">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={cn('flex-1 h-1 rounded-full transition-all', s <= step ? 'bg-primary' : 'bg-border/40')} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload an Excel (.xlsx) or CSV file. Download a sample below to see the expected format.</p>
              <div className="flex gap-2">
                <button onClick={() => downloadSample(MODE_ASSIGN)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Download className="h-3.5 w-3.5" /> Sample: Assign to Stations
                </button>
                <button onClick={() => downloadSample(MODE_CREATE)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Download className="h-3.5 w-3.5" /> Sample: Create Templates
                </button>
              </div>
              <label className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-background/50 px-6 py-10 cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5',
                parsing && 'opacity-60 pointer-events-none'
              )}>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{parsing ? 'Parsing…' : 'Click to upload file'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Excel (.xlsx) or CSV</p>
                </div>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="ops-input hidden" />
              </label>
              {file && !parsing && (
                <p className="text-xs text-muted-foreground">📄 {file.name} — {rawRows.length} data rows found</p>
              )}
            </div>
          )}

          {/* Step 2: Mode */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{rawRows.length} rows</strong> found in <strong className="text-foreground">{file?.name}</strong>. Choose what to do with them.
              </p>
              <div className="space-y-3">
                <ModeCard
                  selected={mode === MODE_ASSIGN}
                  onClick={() => setMode(MODE_ASSIGN)}
                  title="Assign existing templates to stations"
                  description="Match template names and station names from your spreadsheet to existing records. Creates StationPrepAssignment links. Safe default — never creates duplicate templates."
                  tag="Recommended"
                  columns="Template Name · Station Name · Override Par · Override Unit · Override Notes · Display Order · Active"
                />
                <ModeCard
                  selected={mode === MODE_CREATE}
                  onClick={() => setMode(MODE_CREATE)}
                  title="Create or update prep templates"
                  description="Creates new PrepPlanTemplate records or updates existing ones by name. Items must be added manually in the builder after import. Does not delete any existing templates."
                  columns="Template Name · Station · Shift · Role · Notes · Active"
                />
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && preview && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl border border-green-500/25 bg-green-500/5 p-3 text-center">
                  <p className="text-2xl font-black text-green-400">{preview.valid.length}</p>
                  <p className="text-xs text-muted-foreground">Will import</p>
                </div>
                <div className="flex-1 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-center">
                  <p className="text-2xl font-black text-amber-400">{preview.skipped.length}</p>
                  <p className="text-xs text-muted-foreground">Will skip</p>
                </div>
              </div>

              {preview.valid.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Will import ({preview.valid.length})</p>
                  <div className="rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30 max-h-48 overflow-y-auto">
                    {preview.valid.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                        <div>
                          {mode === MODE_ASSIGN ? (
                            <span className="text-foreground">
                              <strong>{item.template.template_name}</strong> → <strong>{item.station.name}</strong>
                              {item.override_par != null && <span className="text-muted-foreground"> (par: {item.override_par}{item.override_unit ? ` ${item.override_unit}` : ''})</span>}
                            </span>
                          ) : (
                            <span className="text-foreground">
                              <strong className={item.action === 'create' ? 'text-green-400' : 'text-blue-400'}>{item.action === 'create' ? 'CREATE' : 'UPDATE'}</strong>{' '}
                              {item.templateName}
                              {item.station && <span className="text-muted-foreground"> @ {item.station.name}</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.skipped.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Will skip ({preview.skipped.length})</p>
                  <div className="rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30 max-h-48 overflow-y-auto">
                    {preview.skipped.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-muted-foreground">Row {item.rowNum}: </span>
                          <span className="text-amber-300">{item.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && preview && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-bold text-foreground">Ready to import</p>
                <p className="text-sm text-muted-foreground">
                  This will write <strong className="text-foreground">{preview.valid.length} records</strong> to the database.
                  {preview.skipped.length > 0 && <> {preview.skipped.length} rows will be skipped.</>}
                  {' '}No existing prep templates will be deleted or modified.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Result */}
          {step === 5 && result && (
            <div className="space-y-4 py-4 text-center">
              {result.success > 0 && (
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
              )}
              <p className="text-xl font-black text-foreground">
                {result.success} imported{result.fail > 0 ? `, ${result.fail} failed` : ''}{result.skipped > 0 ? `, ${result.skipped} skipped` : ''}
              </p>
              {result.errors.length > 0 && (
                <div className="text-left space-y-1 max-h-40 overflow-y-auto rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  {result.errors.map((e, i) => <p key={i} className="text-xs text-red-300">{e}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 shrink-0">
          {step > 1 && step < 5 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step === 2 && (
            <button
              onClick={buildPreview}
              className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-lg bg-primary text-white hover:brightness-110 transition-all"
            >
              Preview <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {step === 3 && preview?.valid?.length > 0 && (
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-lg bg-primary text-white hover:brightness-110 transition-all"
            >
              Confirm Import <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {step === 4 && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-lg bg-green-600 text-white hover:brightness-110 transition-all disabled:opacity-60"
            >
              {importing ? 'Importing…' : `Import ${preview?.valid?.length} Records`}
            </button>
          )}

          {step === 5 && (
            <button
              onClick={handleClose}
              className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-lg bg-primary text-white hover:brightness-110 transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({ selected, onClick, title, description, tag, columns }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border p-4 space-y-2 transition-all',
        selected ? 'border-primary/60 bg-primary/8' : 'border-border/40 hover:border-border hover:bg-background/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <div className="flex items-center gap-2 shrink-0">
          {tag && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">{tag}</span>}
          <div className={cn('h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all', selected ? 'border-primary bg-primary' : 'border-border')}>
            {selected && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide">Columns: {columns}</p>
    </button>
  );
}
