import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, X, FileText, Loader2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import * as XLSX from 'xlsx';

export default function PrepListImportFlow({ isOpen, onClose, onImportComplete }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [importData, setImportData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importingCount, setImportingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    haptics.light();
    setFile(selectedFile);
    setErrors([]);
    setImportData([]);
    setParsing(true);

    // Auto-suggest template name from filename
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (!templateName) setTemplateName(baseName);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let rows = [];
        if (selectedFile.name.endsWith('.csv')) {
          // Parse CSV manually
          const text = new TextDecoder().decode(event.target.result);
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          rows = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.replace(/"/g, '').trim());
            const obj = {};
            headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
            return obj;
          }).filter(r => r['itemName']);
        } else {
          const workbook = XLSX.read(event.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(worksheet);
        }

        if (rows.length === 0) {
          setErrors(['No data rows found in file. Make sure the file has headers and at least one row.']);
          setParsing(false);
          return;
        }

        // Support our CSV format: itemName, quantity, unit, priority, jobCode, notes
        const parsed = [];
        const newErrors = [];
        rows.forEach((row, idx) => {
          const itemName = row['itemName'] || row['Item Name'] || row['item_name'];
          if (!itemName) {
            newErrors.push(`Row ${idx + 2}: Missing item name — skipped`);
            return;
          }
          parsed.push({
            itemName: itemName.trim(),
            quantity: parseFloat(row['quantity'] || row['Quantity'] || 1) || 1,
            unit: (row['unit'] || row['Unit'] || '').trim(),
            priority: (row['priority'] || row['Priority'] || 'medium').toLowerCase(),
            jobCode: (row['jobCode'] || row['Job Code'] || row['job_code'] || 'Prep Cook').trim(),
            notes: (row['notes'] || row['Notes'] || '').trim(),
          });
        });

        if (parsed.length === 0) {
          setErrors(['No valid items found. Ensure your file uses the downloaded template format (itemName, quantity, unit, priority, jobCode, notes).']);
          setParsing(false);
          return;
        }

        setImportData(parsed);
        setErrors(newErrors);
        setParsing(false);
        setStep(2);
      } catch (error) {
        haptics.medium();
        setErrors([`Failed to parse file: ${error.message}`]);
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!templateName.trim()) {
      setErrors(['Please enter a template name before importing.']);
      return;
    }
    haptics.medium();
    setStep(3);
    setTotalCount(importData.length);
    setImportingCount(0);
    setSuccessCount(0);
    setFailCount(0);

    let success = 0;
    let fail = 0;

    try {
      // Create one template for all items
      const newTemplate = await base44.entities.PrepTemplate.create({
        name: templateName.trim(),
        station: 'Prep',
        jobCode: 'Prep Cook',
        shift: 'all',
        itemCount: importData.length,
        isActive: true,
        repeatType: 'weekly',
        repeatDays: [1, 2, 3, 4, 5],
      });

      for (let i = 0; i < importData.length; i++) {
        const item = importData[i];
        setImportingCount(i + 1);
        try {
          await base44.entities.PrepTemplateItem.create({
            prepTemplateId: newTemplate.id,
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            priority: item.priority,
            jobCode: item.jobCode,
            notes: item.notes,
            sortOrder: i,
          });
          success++;
        } catch (err) {
          console.error(`Failed to import item "${item.itemName}":`, err);
          fail++;
        }
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      fail = importData.length;
    }

    setSuccessCount(success);
    setFailCount(fail);
    setStep(4);
    haptics.medium();
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setParsing(false);
    setTemplateName('');
    setImportData([]);
    setErrors([]);
    setSuccessCount(0);
    setFailCount(0);
  };

  const handleClose = () => {
    if (step === 4) {
      onImportComplete?.();
    }
    onClose?.();
    handleReset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-border overflow-hidden max-h-[85vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between sticky top-0">
          <h2 className="font-bold text-foreground">Import Prep Templates</h2>
          <button onClick={handleClose} className="text-secondary-text hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary-text block mb-1">Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Prep List"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
                />
              </div>

              <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-6 text-center space-y-2">
                {parsing ? (
                  <>
                    <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
                    <p className="text-sm font-bold text-foreground">Parsing file...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-secondary-text mx-auto" />
                    <p className="text-sm font-bold text-foreground">Upload CSV or Excel File</p>
                    <p className="text-xs text-secondary-text">Supports .csv, .xlsx and .xls</p>
                  </>
                )}
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="ops-input hidden"
                  id="file-input"
                />
                <button
                  onClick={() => document.getElementById('file-input').click()}
                  disabled={parsing}
                  className="w-full bg-primary text-primary-foreground font-bold text-sm py-2 rounded-lg active:scale-95 disabled:opacity-50"
                >
                  {file ? 'Choose Different File' : 'Choose File'}
                </button>
              </div>

              {file && !parsing && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-400 shrink-0" />
                  <p className="text-xs font-bold text-green-300">{file.name}</p>
                </div>
              )}

              {errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-1">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-300">⚠ {err}</p>
                  ))}
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-1">
                <p className="text-xs font-bold text-blue-300">Expected columns (use Download Template):</p>
                <p className="text-[10px] text-blue-200">itemName · quantity · unit · priority · jobCode · notes</p>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              {errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-1">
                  {errors.map((err, i) => (
                    <p key={i} className="text-[10px] text-red-300">⚠ {err}</p>
                  ))}
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-secondary-text mb-2">
                  Found {importData.length} item{importData.length !== 1 ? 's' : ''} → will be added to template "{templateName}"
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {importData.map((item, i) => (
                    <div key={i} className="bg-muted/40 border border-border/50 rounded-lg p-2.5 text-xs flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        item.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        item.priority === 'low' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>{item.priority}</span>
                      <span className="font-bold text-foreground flex-1">{item.itemName}</span>
                      <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto" />
              <p className="font-bold text-foreground">Importing Templates...</p>
              <p className="text-sm text-secondary-text">{importingCount} / {totalCount}</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(importingCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
              <p className="font-bold text-foreground">Import Complete</p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-1">
                <p className="text-sm text-green-300">✓ {successCount} templates imported</p>
                {failCount > 0 && <p className="text-sm text-red-300">✗ {failCount} templates failed</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-card border-t border-border p-4 flex gap-2">
          {step === 1 && (
            <button onClick={handleClose} className="flex-1 btn-secondary">
              Cancel
            </button>
          )}
          {step === 2 && (
            <>
              <button onClick={handleReset} className="flex-1 btn-secondary">
                Back
              </button>
              <button onClick={handleImport} className="flex-1 btn-primary" disabled={importData.length === 0}>
                Import {importData.length} Template{importData.length !== 1 ? 's' : ''}
              </button>
            </>
          )}
          {step === 4 && (
            <button onClick={handleClose} className="w-full btn-primary">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}