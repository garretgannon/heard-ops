import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Plus, X, MapPin } from 'lucide-react';

export default function StationPrepAssignments({ templateId, templateName }) {
  const [assignments, setAssignments] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ station_id: '', override_par: '', override_unit: '', override_notes: '', display_order: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [asgns, stns] = await Promise.all([
      base44.entities.StationPrepAssignment.filter({ prep_template_id: templateId }).catch(() => []),
      base44.entities.Station.filter({ isActive: true }).catch(() => []),
    ]);
    setAssignments(asgns || []);
    setStations(stns || []);
    setLoading(false);
  };

  useEffect(() => { if (templateId) load(); }, [templateId]);

  const assignedIds = new Set((assignments || []).map(a => a.station_id));
  const available = (stations || []).filter(s => !assignedIds.has(s.id));

  const resetForm = () => setForm({ station_id: '', override_par: '', override_unit: '', override_notes: '', display_order: '' });

  const handleAdd = async () => {
    if (!form.station_id) { toast.error('Select a station'); return; }
    const station = stations.find(s => s.id === form.station_id);
    if (!station) return;
    if (assignments.find(a => a.station_id === form.station_id)) {
      toast.error('Already assigned to this station'); return;
    }
    setSaving(true);
    try {
      await base44.entities.StationPrepAssignment.create({
        prep_template_id: templateId,
        template_name: templateName || '',
        station_id: station.id,
        station_name: station.name,
        override_par: form.override_par ? parseFloat(form.override_par) : null,
        override_unit: form.override_unit || null,
        override_notes: form.override_notes || null,
        display_order: form.display_order !== '' ? parseInt(form.display_order) : null,
        active: true,
      });
      toast.success(`Assigned to ${station.name}`);
      resetForm();
      setAdding(false);
      load();
    } catch { toast.error('Failed to assign'); }
    setSaving(false);
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove assignment from ${name}?`)) return;
    try {
      await base44.entities.StationPrepAssignment.delete(id);
      toast.success('Assignment removed');
      load();
    } catch { toast.error('Failed to remove'); }
  };

  const handleToggleActive = async (a) => {
    try {
      await base44.entities.StationPrepAssignment.update(a.id, { active: !a.active });
      load();
    } catch { toast.error('Failed to update'); }
  };

  const handleUpdateOverride = async (a, field, value) => {
    try {
      await base44.entities.StationPrepAssignment.update(a.id, { [field]: value });
      load();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="card-glass border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase text-muted-foreground">Station Assignments</h3>
          {assignments.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
              {assignments.length}
            </span>
          )}
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
          >
            <Plus className="h-3 w-3" /> Assign Station
          </button>
        )}
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}

      {!loading && assignments.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-border/50 px-3 py-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground">No stations assigned</p>
          <p className="text-xs text-muted-foreground mt-1">Assign this template to one or more stations so it appears in their prep workflows.</p>
        </div>
      )}

      {assignments.map(a => (
        <AssignmentRow
          key={a.id}
          assignment={a}
          onRemove={() => handleRemove(a.id, a.station_name)}
          onToggleActive={() => handleToggleActive(a)}
          onUpdateOverride={(field, value) => handleUpdateOverride(a, field, value)}
        />
      ))}

      {adding && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
          <p className="text-xs font-bold text-foreground">Assign to Station</p>
          <select
            value={form.station_id}
            onChange={e => setForm(f => ({ ...f, station_id: e.target.value }))}
            className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
          >
            <option value="">Select station…</option>
            {available.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {available.length === 0 && (
            <p className="text-xs text-amber-400">This template is already assigned to all stations.</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Override Par</label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={form.override_par}
                onChange={e => setForm(f => ({ ...f, override_par: e.target.value }))}
                className="w-full px-2 py-1.5 liquid-card rounded-lg text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Override Unit</label>
              <input
                type="text"
                placeholder="e.g. lbs"
                value={form.override_unit}
                onChange={e => setForm(f => ({ ...f, override_unit: e.target.value }))}
                className="w-full px-2 py-1.5 liquid-card rounded-lg text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Display Order</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))}
                className="w-full px-2 py-1.5 liquid-card rounded-lg text-xs text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Station Notes</label>
            <input
              type="text"
              placeholder="Station-specific instructions (optional)"
              value={form.override_notes}
              onChange={e => setForm(f => ({ ...f, override_notes: e.target.value }))}
              className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving || !form.station_id || available.length === 0}
              className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Assigning…' : 'Assign'}
            </button>
            <button
              onClick={() => { setAdding(false); resetForm(); }}
              className="flex-1 py-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentRow({ assignment: a, onRemove, onToggleActive, onUpdateOverride }) {
  const [expanded, setExpanded] = useState(false);
  const [editPar, setEditPar] = useState(a.override_par ?? '');
  const [editUnit, setEditUnit] = useState(a.override_unit ?? '');
  const [editNotes, setEditNotes] = useState(a.override_notes ?? '');
  const [editOrder, setEditOrder] = useState(a.display_order ?? '');

  const saveField = async (field, value) => {
    const parsed = field === 'override_par' || field === 'display_order'
      ? (value !== '' ? parseFloat(value) : null)
      : (value || null);
    await onUpdateOverride(field, parsed);
  };

  return (
    <div className={cn('rounded-xl border border-border/40 overflow-hidden', !a.active && 'opacity-50')}>
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,107,0,0.12)' }}>
          <MapPin className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{a.station_name}</p>
          <div className="flex flex-wrap gap-2 mt-0.5">
            {a.override_par != null && (
              <span className="text-[10px] text-muted-foreground">Par: {a.override_par}{a.override_unit ? ` ${a.override_unit}` : ''}</span>
            )}
            {a.override_notes && <span className="text-[10px] text-muted-foreground italic">"{a.override_notes}"</span>}
            {a.display_order != null && <span className="text-[10px] text-muted-foreground">Order: {a.display_order}</span>}
          </div>
        </div>
        <button
          onClick={onToggleActive}
          className={cn('h-5 w-9 rounded-full border p-0.5 transition-all shrink-0', a.active ? 'border-green-500/50 bg-green-500/20' : 'border-border bg-muted/40')}
          title={a.active ? 'Active' : 'Inactive'}
        >
          <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', a.active && 'translate-x-4 bg-green-400')} />
        </button>
        <button
          onClick={() => setExpanded(e => !e)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-xs font-bold shrink-0"
        >
          ✎
        </button>
        <button
          onClick={onRemove}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border/30 px-3 py-3 bg-background/30 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Override Par</label>
              <input
                type="number"
                value={editPar}
                onChange={e => setEditPar(e.target.value)}
                onBlur={() => saveField('override_par', editPar)}
                className="w-full px-2 py-1.5 liquid-card rounded text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Override Unit</label>
              <input
                type="text"
                value={editUnit}
                onChange={e => setEditUnit(e.target.value)}
                onBlur={() => saveField('override_unit', editUnit)}
                className="w-full px-2 py-1.5 liquid-card rounded text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Display Order</label>
              <input
                type="number"
                value={editOrder}
                onChange={e => setEditOrder(e.target.value)}
                onBlur={() => saveField('display_order', editOrder)}
                className="w-full px-2 py-1.5 liquid-card rounded text-xs text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Station Notes</label>
            <input
              type="text"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              onBlur={() => saveField('override_notes', editNotes)}
              className="w-full px-2 py-1.5 liquid-card rounded text-xs text-foreground"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60">Fields save automatically on blur.</p>
        </div>
      )}
    </div>
  );
}
