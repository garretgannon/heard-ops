import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { X, Upload, AlertTriangle, CheckCircle2, Edit2, AlertCircle } from 'lucide-react';
import {
  mapRole,
  extractPDFText,
  parsePDFScheduleText,
} from '@/utils/r365Parser';



export default function R365ImportFlow({ onClose, onComplete, user }) {
  const [step, setStep] = useState(1);
  const [shifts, setShifts] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [roleMappings, setRoleMappings] = useState({});
  const [unmappedRoles, setUnmappedRoles] = useState(new Set());
  const [mappingRole, setMappingRole] = useState(null);
  const [mappingTo, setMappingTo] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    base44.entities.RoleMapping.filter({ sourceSystem: 'r365' }).then(maps => {
      const obj = {};
      maps.forEach(m => { obj[m.sourceRole.toLowerCase()] = m.mappedRole; });
      setRoleMappings(obj);
    }).catch(() => {});
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf')) {
      alert('R365 exports must be PDF files');
      return;
    }
    try {
      const text = await extractPDFText(file);
      const { shifts, confidence } = parsePDFScheduleText(text);
      if (shifts.length === 0) {
        alert('Could not extract any shifts from PDF. Please verify the file format.');
        return;
      }
      setShifts(shifts);
      setStep(2); // Go to role mapping if needed, else preview
    } catch (err) {
      alert('PDF parsing failed: ' + err.message);
    }
  };

  // Skip role mapping step and go directly to preview

  const saveRoleMapping = async () => {
    if (!mappingRole || !mappingTo.trim()) return;
    const lower = mappingRole.toLowerCase();
    const newMappings = { ...roleMappings, [lower]: mappingTo };
    setRoleMappings(newMappings);

    await base44.entities.RoleMapping.create({
      sourceRole: mappingRole,
      mappedRole: mappingTo,
      sourceSystem: 'r365',
      createdBy: user?.email,
      createdAt: new Date().toISOString(),
    }).catch(() => {});

    setUnmappedRoles(prev => {
      const updated = new Set(prev);
      updated.delete(mappingRole);
      return updated;
    });
    setMappingRole(null);
    setMappingTo('');

    if (unmappedRoles.size === 1) setStep(4);
  };

  const doImport = async () => {
    setImporting(true);
    const readyShifts = shifts.filter(s => s.status !== 'error');
    const existingUsers = await base44.entities.User.list('-updated_date', 500).catch(() => []);

    let created = 0, skipped = 0, warnings = 0;
    const shiftsToCreate = [];

    for (const shift of readyShifts) {
      const user = existingUsers.find(u => 
        u.full_name?.toLowerCase() === shift.raw_employee_name.toLowerCase()
      );

      if (!user) {
        skipped++;
        continue;
      }

      const mappedRole = mapRole(shift.raw_role, roleMappings) || shift.raw_role || 'FOH';

      shiftsToCreate.push({
        employee_name: shift.raw_employee_name,
        employee_email: user.email,
        date: shift.shift_date,
        start_time: shift.parsed_start_time,
        end_time: shift.parsed_end_time === 'CLOSE' ? null : shift.parsed_end_time,
        role: mappedRole,
        department: 'FOH',
        source: 'r365',
        imported_by: user?.email || '',
        import_date: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (shiftsToCreate.length > 0) {
      await base44.entities.StaffShift.bulkCreate(shiftsToCreate).catch(() => {});
      created = shiftsToCreate.length;
    }

    haptics.success?.();
    setResult({ created, skipped, warnings, total: shifts.length });
    setStep(5);
    setImporting(false);
  };

  const readyCount = shifts.filter(s => s.status !== 'skipped').length;
  const errorCount = shifts.filter(s => s.status === 'error').length;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => { haptics.light?.(); onClose?.(); }} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold">Import R365 Schedule</h2>
          <p className="text-[10px] text-muted-foreground">Step {step} of 5</p>
        </div>
      </div>

      <div className="flex px-4 py-2 gap-1 bg-muted/30 border-b border-border shrink-0">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center py-8 bg-card border-2 border-dashed border-border rounded-xl">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold mb-1">Upload R365 Schedule Export</p>
              <p className="text-xs text-muted-foreground mb-3">PDF file</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <p className="text-[11px] text-blue-300">💡 R365 PDFs require manual review before importing.</p>
            </div>
            </div>
            )}

            {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-green-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-green-400">{shifts.filter(s => s.status !== 'skipped').length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">To Review</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-red-400">{shifts.filter(s => s.status === 'skipped').length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Skipped</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-foreground">{shifts.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <p className="text-[11px] text-amber-300">💡 Review and edit the extracted shifts below, then approve to proceed.</p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {shifts.map((shift, idx) => (
                <div key={idx} className="card-glass border border-border rounded-lg p-3 space-y-2">
                  {editingIdx === idx ? (
                    <div className="space-y-2">
                      <input type="text" value={shift.raw_employee_name} onChange={e => { const ns = [...shifts]; ns[idx].raw_employee_name = e.target.value; setShifts(ns); }} placeholder="Employee" className="w-full px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={shift.shift_date || ''} onChange={e => { const ns = [...shifts]; ns[idx].shift_date = e.target.value; setShifts(ns); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                        <input type="text" value={shift.raw_role || ''} onChange={e => { const ns = [...shifts]; ns[idx].raw_role = e.target.value; setShifts(ns); }} placeholder="Role" className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="time" value={shift.parsed_start_time || ''} onChange={e => { const ns = [...shifts]; ns[idx].parsed_start_time = e.target.value; setShifts(ns); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                        <input type="time" value={shift.parsed_end_time === 'CLOSE' ? '' : (shift.parsed_end_time || '')} onChange={e => { const ns = [...shifts]; ns[idx].parsed_end_time = e.target.value; setShifts(ns); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      </div>
                      <button onClick={() => setEditingIdx(null)} className="w-full py-1 bg-primary text-primary-foreground rounded text-xs font-bold">Done</button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{shift.raw_employee_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{shift.shift_date || '(no date)'} · {shift.parsed_start_time}-{shift.parsed_end_time === 'CLOSE' ? 'Close' : shift.parsed_end_time} · {shift.raw_role || '(no role)'}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setEditingIdx(idx)} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded font-bold">Edit</button>
                          <button onClick={() => { const ns = [...shifts]; ns[idx].status = ns[idx].status === 'skipped' ? 'ready' : 'skipped'; setShifts(ns); }} className={`px-2 py-1 text-xs rounded font-bold ${shift.status === 'skipped' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {shift.status === 'skipped' ? 'Skip' : 'Keep'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setStep(3)} className="w-full btn-primary text-sm py-2.5">Confirm Shifts</button>
            </div>
            )}

            {step === 3 && (
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-400">PDF requires manual review</p>
                <p className="text-[11px] text-amber-300">Verify all details before importing</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-400">{readyCount}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Ready</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-red-400">{errorCount}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Errors</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-foreground">{shifts.length}</p>
                <p className="text-[9px] font-bold text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {shifts.slice(0, 50).map((shift, idx) => (
                <div key={idx} className={`bg-card border rounded px-2 py-1.5 text-xs transition-all ${shift.status === 'error' ? 'border-red-500/30' : shift.status === 'warning' ? 'border-amber-500/30' : 'border-border'}`}>
                  {editingIdx === idx ? (
                    <div className="space-y-2">
                      <input type="text" value={shift.raw_employee_name} onChange={e => { const ns = [...shifts]; ns[idx].raw_employee_name = e.target.value; setShifts(ns); }} placeholder="Employee" className="w-full px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={shift.shift_date || ''} onChange={e => { const ns = [...shifts]; ns[idx].shift_date = e.target.value; setShifts(ns); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                        <input type="text" value={shift.raw_role || ''} onChange={e => { const ns = [...shifts]; ns[idx].raw_role = e.target.value; setShifts(ns); }} placeholder="Role" className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="time" value={shift.parsed_start_time || ''} onChange={e => { const ns = [...shifts]; ns[idx].parsed_start_time = e.target.value; setShifts(ns); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                        <input type="time" value={shift.parsed_end_time === 'CLOSE' ? '' : (shift.parsed_end_time || '')} onChange={e => { const ns = [...shifts]; ns[idx].parsed_end_time = e.target.value; setShifts(ns); }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground" />
                      </div>
                      <button onClick={() => setEditingIdx(null)} className="w-full py-1 bg-primary text-primary-foreground rounded text-xs font-bold">Done</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{shift.raw_employee_name}</p>
                          <p className="text-muted-foreground truncate">{shift.shift_date} · {shift.parsed_start_time}-{shift.parsed_end_time === 'CLOSE' ? 'Close' : shift.parsed_end_time}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingIdx(idx)} className="p-1 hover:bg-muted rounded">
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                          {shift.status === 'error' ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          ) : shift.status === 'warning' ? (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                          )}
                        </div>
                      </div>
                      {shift.error_message && <p className="text-[10px] text-red-400 mt-1">{shift.error_message}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>

            <button onClick={doImport} disabled={readyCount === 0} className={`w-full text-sm py-2.5 rounded-lg font-bold transition-all ${readyCount === 0 ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed' : 'btn-primary'}`}>
              Import {readyCount} Shift{readyCount !== 1 ? 's' : ''}
            </button>
            </div>
            )}

            {step === 4 && result && (
          <div className="space-y-3">
            <div className="text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
              <p className="font-bold">Import Complete!</p>
            </div>
            <div className="card-glass border border-border rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Shifts Created</span><span className="font-bold text-green-400">{result.created}</span></div>
              {result.skipped > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Skipped</span><span className="font-bold text-amber-400">{result.skipped}</span></div>}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3">
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => { handleFile(e.target.files[0]); }} />
        {step === 1 && <button onClick={() => fileRef.current?.click()} className="w-full btn-primary text-sm">Choose PDF</button>}
        {step === 3 && <button onClick={doImport} disabled={shifts.filter(s => s.status !== 'skipped').length === 0} className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">Import {shifts.filter(s => s.status !== 'skipped').length} Shift{shifts.filter(s => s.status !== 'skipped').length !== 1 ? 's' : ''}</button>}
        {step === 4 && <button onClick={onComplete} className="w-full btn-primary text-sm">View Schedule</button>}
      </div>
    </div>
  );
}