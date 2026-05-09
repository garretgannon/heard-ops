import { useState, useEffect } from 'react';
import { X, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

const DEFAULT_PRESETS = [
  { label: 'Open', start: '07:00', end: '15:00' },
  { label: 'Mid', start: '11:00', end: '19:00' },
  { label: 'Close', start: '15:00', end: '23:00' },
  { label: 'Double', start: '09:00', end: '21:00' },
];

const ROLES = ['Manager', 'Bartender', 'Server', 'Host', 'Line Cook', 'Prep Cook', 'Dishwasher', 'Busser', 'Food Runner'];

export default function QuickAddShiftModal({ employee, day, onSave, onClose }) {
  const [form, setForm] = useState({
    start_time: '09:00',
    end_time: '17:00',
    role: employee?.role || '',
    area: '',
    station: '',
    notes: '',
    status: 'draft',
  });
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      const [areasData, stationsData] = await Promise.all([
        base44.entities.Area?.list?.().catch(() => []),
        base44.entities.Station?.list?.().catch(() => []),
      ]);
      setAreas(areasData || []);
      setStations(stationsData || []);
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
      <div className="w-full max-w-sm bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
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
            <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Select role…</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Area (optional)</label>
            <select value={form.area} onChange={e => setForm(f => ({...f, area: e.target.value}))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Select area…</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Station (optional)</label>
            <select value={form.station} onChange={e => setForm(f => ({...f, station: e.target.value}))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Select station…</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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