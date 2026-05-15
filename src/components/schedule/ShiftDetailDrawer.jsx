import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, MapPin, Save, Trash2, Copy, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ROLES = ['Manager', 'Bartender', 'Server', 'Host', 'Line Cook', 'Prep Cook', 'Dishwasher', 'Busser', 'Food Runner', 'Sous Chef'];

function calcHours(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? (diff / 60).toFixed(1) : null;
}

export default function ShiftDetailDrawer({ shift, employees, conflicts, onClose, onUpdate, onCopy, onDuplicate }) {
  const [form, setForm] = useState({
    start_time: shift.start_time || '',
    end_time: shift.end_time || '',
    area: shift.area || '',
    station: shift.station || '',
    role: shift.role || '',
    notes: shift.notes || '',
    status: shift.status || 'draft',
    employee_name: shift.employee_name || '',
    employee_email: shift.employee_email || '',
    date: shift.date || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [areasData, stationsData] = await Promise.all([
        base44.entities.Area?.list?.().catch(() => []),
        base44.entities.Station?.list?.().catch(() => []),
      ]);
      setAreas(areasData || []);
      setStations(stationsData || []);
    };
    loadData();
  }, []);

  const hours = calcHours(form.start_time, form.end_time);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.StaffShift.update(shift.id, form);
      toast.success('Shift saved');
      onUpdate?.();
      onClose();
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.StaffShift.delete(shift.id);
      toast.success('Shift deleted');
      onUpdate?.();
      onClose();
    } catch { toast.error('Failed to delete'); }
    setDeleting(false);
  };

  const handlePublish = async () => {
    try {
      await base44.entities.StaffShift.update(shift.id, { status: 'published' });
      toast.success('Shift published');
      onUpdate?.();
      onClose();
    } catch { toast.error('Failed to publish'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()} className="w-full max-w-[380px] h-full bg-card border-l border-border/30 flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-border/30 bg-card px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Shift Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{form.employee_name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onCopy?.(shift)} title="Copy shift"
              className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Conflicts */}
        {conflicts && conflicts.length > 0 && (
          <div className="mx-5 mt-4 rounded-xl border border-border/40 bg-background overflow-hidden">
            {conflicts.map((c, i) => (
              <div key={i} className={cn('flex items-start gap-2.5 px-3 py-2.5 text-xs', i > 0 && 'border-t border-border/30')}>
                {c.type === 'error' ? <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />}
                <span className={c.type === 'error' ? 'text-red-300' : 'text-amber-300'}>{c.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="flex-1 px-5 py-4 space-y-4">
          {/* Employee */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Employee</label>
            <select value={form.employee_email} onChange={e => {
              const emp = employees.find(em => em.email === e.target.value);
              setForm(f => ({ ...f, employee_email: e.target.value, employee_name: emp?.name || f.employee_name }));
            }} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              {employees.map(e => <option key={e.id} value={e.email}>{e.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>

          {/* Time */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Time {hours && <span className="text-primary font-bold">· {hours}h</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({...f, end_time: e.target.value}))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">No role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Area */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Area</label>
            <select value={form.area} onChange={e => setForm(f => ({...f, area: e.target.value}))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Select area…</option>
              {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>

          {/* Station */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Station</label>
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

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Status</label>
            <div className="flex gap-2">
              {['draft', 'published', 'needs_review'].map(s => (
                <button key={s} onClick={() => setForm(f => ({...f, status: s}))}
                  className={cn('flex-1 py-1.5 rounded-lg border text-[11px] font-bold capitalize transition-all',
                    form.status === s ? 'bg-primary border-primary text-white' : 'border-border bg-secondary text-muted-foreground hover:text-foreground')}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
              rows={2} placeholder="Add notes…" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 border-t border-border/30 bg-card px-5 py-4 space-y-2">
          {/* Primary row */}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-60">
              <Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save'}
            </button>
            {form.status !== 'published' && (
              <button onClick={handlePublish}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600/80 text-white text-sm font-bold hover:brightness-110 transition-all">
                <CheckCircle className="h-3.5 w-3.5" />Publish
              </button>
            )}
          </div>

          {/* Secondary row */}
          <div className="flex gap-2">
            <button onClick={() => onDuplicate?.(shift)}
              className="flex-1 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              Duplicate
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="flex-1 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors">
                Delete
              </button>
            ) : (
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 rounded-xl border border-red-500 bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors">
                {deleting ? '…' : 'Confirm Delete'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}