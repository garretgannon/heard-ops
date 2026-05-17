import { useState, useEffect } from 'react';
import { X, Clock, Zap, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

const DEFAULT_PRESETS = [
  { label: 'Open', start: '07:00', end: '15:00' },
  { label: 'Mid', start: '11:00', end: '19:00' },
  { label: 'Close', start: '15:00', end: '23:00' },
  { label: 'Double', start: '09:00', end: '21:00' },
];

const FALLBACK_ROLES = ['Manager', 'Bartender', 'Server', 'Host', 'Line Cook', 'Prep Cook', 'Dishwasher', 'Busser', 'Food Runner'];

function getEligibleRoles(employee) {
  const roles = new Set();
  if (employee?.job_code) roles.add(employee.job_code);
  if (employee?.primary_role) roles.add(employee.primary_role);
  (employee?.secondary_roles || []).forEach(r => roles.add(r));
  return [...roles].filter(Boolean);
}

export default function QuickAddShiftModal({ employee, day, onSave, onClose }) {
  const empPrimaryRole = employee?.job_code || employee?.primary_role || employee?.role || '';
  const [form, setForm] = useState({
    start_time: '09:00',
    end_time: '17:00',
    role: empPrimaryRole,
    area: '',
    station: '',
    notes: '',
    status: 'draft',
  });
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [jobCodes, setJobCodes] = useState([]);
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [loadingData, setLoadingData] = useState(false);

  const eligibleRoles = getEligibleRoles(employee);
  const isRoleIneligible = form.role && eligibleRoles.length > 0 && !eligibleRoles.map(r => r.toLowerCase()).includes(form.role.toLowerCase());

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      const [areasData, stationsData, jcData] = await Promise.all([
        base44.entities.Area?.list?.().catch(() => []),
        base44.entities.Station?.list?.().catch(() => []),
        base44.entities.JobCode?.list?.('-updated_date', 100).catch(() => []),
      ]);
      setAreas(areasData || []);
      setStations(stationsData || []);
      setJobCodes((jcData || []).filter(j => j.isActive !== false));
      setLoadingData(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadPresets = async () => {
      if (!form.role) {
        setPresets(DEFAULT_PRESETS);
        return;
      }
      try {
        const rolePresets = await base44.entities.RoleShiftPreset?.filter?.({ role_name: form.role }).catch(() => []);
        if (rolePresets?.length > 0) {
          setPresets(rolePresets[0].presets || DEFAULT_PRESETS);
        } else {
          setPresets(DEFAULT_PRESETS);
        }
      } catch {
        setPresets(DEFAULT_PRESETS);
      }
    };
    loadPresets();
  }, [form.role]);

  const applyPreset = (p) => setForm(f => ({ ...f, start_time: p.start, end_time: p.end }));

  const calcHours = () => {
    if (!form.start_time || !form.end_time) return 0;
    const [sh, sm] = form.start_time.split(':').map(Number);
    const [eh, em] = form.end_time.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? (diff / 60).toFixed(1) : 0;
  };

  const handleSave = () => {
    onSave({
      ...form,
      employee_name: employee.name,
      employee_email: employee.email,
      date: format(day, 'yyyy-MM-dd'),
      week_start_date: format(day, 'yyyy-MM-dd'),
      department: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm card-glass border border-border/50 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Add Shift</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {employee?.name} · {format(day, 'EEE, MMM d')}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Presets */}
        <div className="px-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Zap className="h-3 w-3" /> Quick Presets</p>
          <div className="flex gap-2">
            {presets.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className="flex-1 py-1.5 rounded-lg bg-secondary hover:bg-primary/15 border border-border/50 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="px-5 space-y-3 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Start</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">End</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({...f, end_time: e.target.value}))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({...f, role: e.target.value}))}
              className={`w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground ${isRoleIneligible ? 'border-amber-500/60' : 'border-border'}`}
            >
              <option value="">Select role…</option>
              {/* Employee's eligible roles first */}
              {eligibleRoles.length > 0 && (
                <optgroup label={`${employee?.name || 'Employee'}'s Roles`}>
                  {eligibleRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
              )}
              {/* All job codes */}
              {(jobCodes.length > 0 ? jobCodes : FALLBACK_ROLES.map(r => ({ name: r }))).filter(jc => !eligibleRoles.map(r => r.toLowerCase()).includes(jc.name.toLowerCase())).length > 0 && (
                <optgroup label="Other Roles">
                  {(jobCodes.length > 0 ? jobCodes : FALLBACK_ROLES.map(r => ({ name: r }))).filter(jc => !eligibleRoles.map(r => r.toLowerCase()).includes(jc.name.toLowerCase())).map(jc => (
                    <option key={jc.name} value={jc.name}>{jc.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            {isRoleIneligible && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-400 font-medium">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {employee?.name} isn't typically scheduled as {form.role}. Shift will save as draft.
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Area (optional)</label>
            <select value={form.area} onChange={e => setForm(f => ({...f, area: e.target.value}))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Select area…</option>
              {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Station (optional)</label>
            <select
              value={form.station}
              onChange={e => {
                const s = stations.find(st => st.name === e.target.value);
                setForm(f => ({ ...f, station: e.target.value, station_id: s?.id || '' }));
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              <option value="">Select station…</option>
              {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Notes (optional)</label>
            <input type="text" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
              placeholder="Any notes…"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>

          {calcHours() > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{calcHours()} hours</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-secondary transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 transition-all">Add Shift</button>
          </div>
        </div>
      </div>
    </div>
  );
}