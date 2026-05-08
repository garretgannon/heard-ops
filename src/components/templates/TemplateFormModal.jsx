import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import MobileModalWrapper from '@/components/MobileModalWrapper';
import TemplateItemsEditor from './TemplateItemsEditor';

const TEMPLATE_TYPES = [
  { id: 'prep',        label: 'Prep' },
  { id: 'sidework',    label: 'Side Work' },
  { id: 'cleaning',    label: 'Cleaning' },
  { id: 'temperature', label: 'Temperature Log' },
  { id: 'waste_86',    label: 'Waste / 86' },
  { id: 'opening',     label: 'Opening Checklist' },
  { id: 'closing',     label: 'Closing Checklist' },
  { id: 'handoff',     label: 'Shift Handoff' },
  { id: 'beo_event',   label: 'BEO / Event' },
  { id: 'custom',      label: 'Custom' },
];

const RECURRENCE = [
  { id: 'daily',       label: 'Every Day' },
  { id: 'weekly',      label: 'Specific Days' },
  { id: 'every_shift', label: 'Every Shift' },
  { id: 'on_demand',   label: 'On Demand' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY_FORM = {
  name: '',
  template_type: 'prep',
  assigned_role: '',
  assigned_employee: '',
  assigned_station: '',
  shift: 'any',
  description: '',
  recurrence_type: 'daily',
  recurrence_days: [],
  due_time: '',
  priority: 'medium',
  photo_required: false,
  manager_review_required: false,
  is_active: true,
  // temp-specific
  temp_category: 'refrigerator',
  temp_min: '',
  temp_max: '',
  temp_check_frequency_minutes: 240,
  temp_grace_period_minutes: 15,
  temp_corrective_action: '',
  temp_review_on_failure: true,
  // handoff
  handoff_shift_type: '',
  handoff_next_shift_visible: true,
  // beo
  beo_event_date: '',
  beo_event_name: '',
  beo_department: '',
};

export default function TemplateFormModal({ template, isNew, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState(template ? { ...EMPTY_FORM, ...template } : EMPTY_FORM);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const type = form.template_type;

  useEffect(() => {
    if (!isNew && template?.id) {
      base44.entities.TemplateItem.filter({ templateId: template.id }, 'sort_order', 200)
        .then(data => setItems(data.map(i => ({ ...i, _localId: i.id }))))
        .catch(() => {})
        .finally(() => setLoadingItems(false));
    } else {
      setLoadingItems(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Template name is required'); return; }
    setSaving(true);
    try {
      let templateId;
      // Strip empty-string numeric fields so the API doesn't reject them
      const numericFields = ['temp_min', 'temp_max', 'temp_check_frequency_minutes', 'temp_grace_period_minutes'];
      const cleaned = { ...form };
      numericFields.forEach(f => {
        if (cleaned[f] === '' || cleaned[f] === null) delete cleaned[f];
        else if (cleaned[f] !== undefined) cleaned[f] = Number(cleaned[f]);
      });
      const payload = { ...cleaned, created_by: form.created_by || user?.email };
      if (isNew) {
        const created = await base44.entities.Template.create(payload);
        templateId = created.id;
        toast.success('Template created');
      } else {
        await base44.entities.Template.update(template.id, payload);
        templateId = template.id;
        toast.success('Template updated');
      }

      // Sync items: delete all existing, re-create
      if (!isNew) {
        const existing = await base44.entities.TemplateItem.filter({ templateId });
        await Promise.all(existing.map(e => base44.entities.TemplateItem.delete(e.id)));
      }
      await Promise.all(
        items.map((item, idx) => {
          const { _localId, id, ...rest } = item;
          return base44.entities.TemplateItem.create({ ...rest, templateId, sort_order: idx });
        })
      );

      onSuccess();
    } catch (err) {
      toast.error('Failed to save template');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (d) => {
    const days = form.recurrence_days || [];
    set('recurrence_days', days.includes(d) ? days.filter(x => x !== d) : [...days, d]);
  };

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary active:scale-95 transition-all">
        Cancel
      </button>
      <button onClick={handleSubmit} disabled={saving}
        className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all">
        {saving ? 'Saving...' : isNew ? 'Create Template' : 'Save Changes'}
      </button>
    </>
  );

  return (
    <MobileModalWrapper isOpen={true} onClose={onClose} title={isNew ? 'New Template' : 'Edit Template'} footer={footer}>
      {/* ── CORE FIELDS ── */}
      <Section label="Template Name *">
        <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="e.g., Morning Prep — Sauté Station"
          className="input-base" />
      </Section>

      <Section label="Template Type *">
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATE_TYPES.map(t => (
            <button key={t.id} type="button"
              onClick={() => set('template_type', t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                type === t.id ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section label="Assigned Role">
          <input type="text" value={form.assigned_role} onChange={e => set('assigned_role', e.target.value)}
            placeholder="e.g., Kitchen Lead" className="input-base" />
        </Section>
        <Section label="Station / Area">
          <input type="text" value={form.assigned_station} onChange={e => set('assigned_station', e.target.value)}
            placeholder="e.g., Sauté" className="input-base" />
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Section label="Shift">
          <select value={form.shift} onChange={e => set('shift', e.target.value)} className="input-base">
            {[['any','Any'],['opening','Opening'],['mid','Mid'],['closing','Closing']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Section>
        <Section label="Priority">
          <select value={form.priority} onChange={e => set('priority', e.target.value)} className="input-base">
            {['low','medium','high','critical'].map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
            ))}
          </select>
        </Section>
      </div>

      <Section label="Assigned Employee (optional)">
        <input type="text" value={form.assigned_employee || ''} onChange={e => set('assigned_employee', e.target.value)}
          placeholder="Email address" className="input-base" />
      </Section>

      {/* ── RECURRENCE ── */}
      <Section label="Recurrence">
        <select value={form.recurrence_type} onChange={e => set('recurrence_type', e.target.value)} className="input-base">
          {RECURRENCE.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {form.recurrence_type === 'weekly' && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {DAYS.map((d, i) => (
              <button key={i} type="button" onClick={() => toggleDay(i)}
                className={`h-8 w-10 rounded-lg text-xs font-bold border transition-all ${
                  (form.recurrence_days || []).includes(i)
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-muted border-border text-muted-foreground'
                }`}>{d}</button>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section label="Due Time">
          <input type="time" value={form.due_time || ''} onChange={e => set('due_time', e.target.value)} className="input-base" />
        </Section>
        <Section label="Status">
          <select value={form.is_active ? 'active' : 'inactive'} onChange={e => set('is_active', e.target.value === 'active')} className="input-base">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Section>
      </div>

      <Section label="Instructions / Notes">
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2}
          placeholder="Additional context for whoever completes this…"
          className="input-base resize-none" />
      </Section>

      <div className="flex gap-4">
        <Toggle label="Photo Required" checked={form.photo_required} onChange={v => set('photo_required', v)} />
        <Toggle label="Manager Review" checked={form.manager_review_required} onChange={v => set('manager_review_required', v)} />
      </div>

      {/* ── TEMPERATURE-SPECIFIC ── */}
      {type === 'temperature' && (
        <div className="space-y-3 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Temperature Settings</p>

          <Section label="Equipment / Category">
            <select value={form.temp_category} onChange={e => set('temp_category', e.target.value)} className="input-base">
              {[['refrigerator','Refrigerator'],['freezer','Freezer'],['hot_holding','Hot Holding'],['cooling','Cooling']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Section label="Min Temp (°F)">
              <input type="number" value={form.temp_min || ''} onChange={e => set('temp_min', e.target.value)} className="input-base" />
            </Section>
            <Section label="Max Temp (°F)">
              <input type="number" value={form.temp_max || ''} onChange={e => set('temp_max', e.target.value)} className="input-base" />
            </Section>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Section label="Check Every (min)">
              <input type="number" value={form.temp_check_frequency_minutes || ''} onChange={e => set('temp_check_frequency_minutes', e.target.value)} className="input-base" />
            </Section>
            <Section label="Grace Period (min)">
              <input type="number" value={form.temp_grace_period_minutes || ''} onChange={e => set('temp_grace_period_minutes', e.target.value)} className="input-base" />
            </Section>
          </div>

          <Section label="Corrective Action Instructions">
            <textarea value={form.temp_corrective_action || ''} onChange={e => set('temp_corrective_action', e.target.value)} rows={2}
              className="input-base resize-none" placeholder="What to do if out of range…" />
          </Section>

          <Toggle label="Manager Review on Failure" checked={form.temp_review_on_failure} onChange={v => set('temp_review_on_failure', v)} />
        </div>
      )}

      {/* ── HANDOFF-SPECIFIC ── */}
      {type === 'handoff' && (
        <div className="space-y-3 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Handoff Settings</p>
          <div className="grid grid-cols-2 gap-3">
            <Section label="Shift Type">
              <input type="text" value={form.handoff_shift_type || ''} onChange={e => set('handoff_shift_type', e.target.value)}
                placeholder="e.g., AM → PM" className="input-base" />
            </Section>
            <Section label="Next Shift Visibility">
              <select value={form.handoff_next_shift_visible ? 'yes' : 'no'} onChange={e => set('handoff_next_shift_visible', e.target.value === 'yes')} className="input-base">
                <option value="yes">Visible</option>
                <option value="no">Hidden</option>
              </select>
            </Section>
          </div>
        </div>
      )}

      {/* ── BEO-SPECIFIC ── */}
      {type === 'beo_event' && (
        <div className="space-y-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Event / BEO Details</p>
          <div className="grid grid-cols-2 gap-3">
            <Section label="Event Name">
              <input type="text" value={form.beo_event_name || ''} onChange={e => set('beo_event_name', e.target.value)} className="input-base" />
            </Section>
            <Section label="Event Date">
              <input type="date" value={form.beo_event_date || ''} onChange={e => set('beo_event_date', e.target.value)} className="input-base" />
            </Section>
          </div>
          <Section label="Department">
            <input type="text" value={form.beo_department || ''} onChange={e => set('beo_department', e.target.value)} placeholder="e.g., FOH, BOH, Bar" className="input-base" />
          </Section>
        </div>
      )}

      {/* ── ITEMS ── */}
      {type !== 'temperature' && (
        loadingItems ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <TemplateItemsEditor items={items} onChange={setItems} templateType={type} />
        )
      )}
    </MobileModalWrapper>
  );
}

function Section({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-muted-foreground uppercase block">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer flex-1 p-2.5 rounded-lg hover:bg-muted/50 min-h-10">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 cursor-pointer" />
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
    </label>
  );
}

// Inject a quick input style via JS (avoids global CSS pollution)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `.input-base { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); color: hsl(var(--foreground)); font-size: 0.875rem; outline: none; } .input-base:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 2px hsl(var(--primary)/0.15); }`;
  document.head.appendChild(style);
}