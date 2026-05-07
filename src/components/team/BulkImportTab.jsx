import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';

const TEMPLATE_COLUMNS = [
  'Full Name',
  'Phone Number',
  'Email Address',
  'Employee ID',
  'Clock-In Code',
  'Job Code',
  'Rate of Pay',
  'Pay Type',
  'Department',
  'Primary Role',
  'Secondary Roles',
  'Start Date',
  'Notes',
];

const SAMPLE_ROW = [
  'Jamie Lee',
  '555-123-4567',
  'jamie.lee@restaurant.com',
  '1023',
  '2580',
  'Server',
  '18.50',
  '/ hr',
  'FOH',
  'Server',
  'Bartender',
  '2026-05-01',
  'Example employee row',
];

export default function BulkImportTab({ onSuccess }) {
  const [importData, setImportData] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplate = (format) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, SAMPLE_ROW]);

    worksheet['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, `employee_template.${format}`);
  };

  const handleFileUpload = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setValidationResults({ error: 'No data found in file' });
        return;
      }

      const results = validateImport(jsonData);
      setPreviewRows(jsonData);
      setValidationResults(results);
      setImportData(jsonData);
    } catch (err) {
      setValidationResults({ error: 'Failed to parse file. Please check the format.' });
    }
  };

  const validateImport = (rows) => {
    const errors = [];
    const warnings = [];
    let readyCount = 0;

    rows.forEach((row, idx) => {
      const rowErrors = [];

      if (!row['Full Name']) rowErrors.push('Missing name');
      if (!row['Employee ID']) rowErrors.push('Missing employee ID');
      if (!row['Clock-In Code']) rowErrors.push('Missing clock-in code');
      if (!row['Job Code']) rowErrors.push('Missing job code');
      if (!row['Rate of Pay'] || isNaN(parseFloat(row['Rate of Pay']))) rowErrors.push('Invalid pay rate');
      if (row['Email Address'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Email Address'])) rowErrors.push('Invalid email');

      if (rowErrors.length > 0) {
        errors.push({ row: idx + 2, issues: rowErrors });
      } else {
        readyCount++;
      }
    });

    return {
      total: rows.length,
      ready: readyCount,
      errors: errors.length,
      errorDetails: errors,
    };
  };

  const handleImport = async () => {
    if (!validationResults || validationResults.errors > 0) return;

    setIsImporting(true);
    try {
      // Create all valid employee records
      const validRows = previewRows.filter(row => {
        return row['Full Name'] && row['Employee ID'] && row['Clock-In Code'] && row['Job Code'] && row['Rate of Pay'];
      });

      for (const row of validRows) {
        await base44.entities.Employee.create({
          full_name: row['Full Name'],
          email: row['Email Address'] || '',
          phone: row['Phone Number'] || '',
          employee_id: row['Employee ID'],
          clock_in_code: row['Clock-In Code'],
          job_code: row['Job Code'],
          rate_of_pay: parseFloat(row['Rate of Pay']),
          pay_type: row['Pay Type'] || '/ hr',
          department: row['Department'] || '',
          primary_role: row['Primary Role'] || '',
          secondary_roles: row['Secondary Roles'] ? [row['Secondary Roles']] : [],
          start_date: row['Start Date'] || '',
          notes: row['Notes'] || '',
          status: 'active',
        });
      }
      
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
    setIsImporting(false);
  };

  if (!previewRows.length) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Upload a CSV or Excel file to add multiple employees at once.</p>

        {/* Download Template */}
        <div className="p-4 rounded-lg border border-border/30 bg-secondary/30 space-y-3">
          <p className="text-sm font-semibold text-foreground">Step 1: Download Template</p>
          <p className="text-xs text-muted-foreground">Use our template to ensure proper formatting.</p>
          <div className="flex gap-2">
            <button
              onClick={() => downloadTemplate('xlsx')}
              className="flex-1 h-9 px-3 rounded-lg border border-border hover:bg-card flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
            <button
              onClick={() => downloadTemplate('csv')}
              className="flex-1 h-9 px-3 rounded-lg border border-border hover:bg-card flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>

        {/* Upload File */}
        <div className="p-4 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
          <label className="cursor-pointer space-y-3">
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Drag and drop your file</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground text-center">Supports CSV, Excel (.xlsx, .xls)</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 text-center">
          <p className="text-2xl font-bold text-foreground">{validationResults.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
          <p className="text-2xl font-bold text-green-400">{validationResults.ready}</p>
          <p className="text-xs text-green-400/70 mt-1">Ready</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-2xl font-bold text-red-400">{validationResults.errors}</p>
          <p className="text-xs text-red-400/70 mt-1">Issues</p>
        </div>
      </div>

      {/* Error Details */}
      {validationResults.errors > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm font-semibold text-red-400">Issues found</p>
          </div>
          <div className="space-y-1 text-xs text-red-300/80">
            {validationResults.errorDetails.slice(0, 5).map((err, idx) => (
              <p key={idx}>
                <span className="font-semibold">Row {err.row}:</span> {err.issues.join(', ')}
              </p>
            ))}
            {validationResults.errorDetails.length > 5 && (
              <p className="text-red-300/60">+{validationResults.errorDetails.length - 5} more issues</p>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Preview</p>
        <div className="overflow-x-auto rounded-lg border border-border/30">
          <table className="w-full text-xs">
            <thead className="bg-secondary/50 border-b border-border/30">
              <tr>
                {['Name', 'Email', 'Job Code', 'Employee ID', 'Clock Code', 'Pay'].map(col => (
                  <th key={col} className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="border-b border-border/10 hover:bg-secondary/20">
                  <td className="px-3 py-2 text-foreground font-medium">{row['Full Name'] || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row['Email Address'] || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row['Job Code'] || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row['Employee ID'] || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">••••</td>
                  <td className="px-3 py-2 text-muted-foreground">${row['Rate of Pay'] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {previewRows.length > 10 && (
          <p className="text-xs text-muted-foreground mt-2">Showing 10 of {previewRows.length} rows</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-0 pt-6 mt-6 border-t border-border/30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-card/50 backdrop-blur-sm">
        <button
          onClick={() => { setPreviewRows([]); setValidationResults(null); setImportData(null); }}
          className="flex-1 h-10 rounded-lg border border-border hover:bg-secondary font-bold text-sm transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleImport}
          disabled={validationResults.errors > 0 || isImporting}
          className={`flex-1 h-10 rounded-lg font-bold text-sm transition-all ${
            validationResults.errors === 0 && !isImporting
              ? 'bg-primary text-primary-foreground hover:brightness-110'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isImporting ? 'Importing...' : `Import ${validationResults.ready} Employees`}
        </button>
      </div>
    </div>
  );
}