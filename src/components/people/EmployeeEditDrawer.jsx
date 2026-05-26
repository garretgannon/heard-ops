import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Trash2 } from 'lucide-react';

const DEFAULT_ROLES = ['Admin','General Manager','Manager','Kitchen Lead','Line Cook','Prep Cook','Dishwasher','Bartender','Server','Host','Busser','Expo'];
const DEPTS = ['BOH','FOH','Bar','Management'];
const ALL_PERMISSIONS = [
  'assign_tasks','approve_tasks','create_tasks','manage_logs','manage_templates',
  'manage_recipes','manage_prep','manage_schedules','manage_maintenance','manage_beos','manage_training',
];

export default function EmployeeEditDrawer({ employee, employees, onClose, onSaved }) {
  const isNew = !employee?.id;
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', employee_id: '', clock_in_code: '', job_code: '',
    rate_of_pay: '', pay_type: '/ hr', department: '', primary_role: '', status: 'active',
    manager_id: '', manager_name: '', hire_date: '',
    assigned_areas: [], assigned_stations: [], managed_areas: [], managed_stations: [],
    can_assign_to_roles: [], certifications: [], notes: '',
    ...employee,
  });
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Area.list('name', 100),
      base44.entities.Station.list('name', 200),
    ]).then(([a, s]) => { setAreas(a); setStations(s); });
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const toggleArr = (key, val) => setForm(p => {
    const arr = p[key] || [];
    return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
  });

  const handleManagerChange = (id) => {
    const mgr = employees.find(e => e.id === id);
    setForm(p => ({ ...p, manager_id: id, manager_name: mgr?.full_name || '' }));
  };

  const save = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    if (isNew) {
      await base44.entities.Employee.create(form);
    } else {
      await base44.entities.Employee.update(employee.id, form);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const del = async () => {
    if (!confirm(`Delete ${employee.full_name}?`)) return;
    await base44.entities.Employee.delete(employee.id);
    onSaved();
    onClose();
  };

  const otherEmployees = employees.filter(e => e.id !== employee?.id && e.status !== 'archived');

  const filteredStations = form.department
    ? stations.filter(s => !s.department || s.department === form.department || form.department === 'Management')
    : stations;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full lg:w-[560px] max-h-[92vh] overflow-y-auto card-glass border border-border rounded-t-2xl lg:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-base font-extrabold text-foreground">{isNew ? 'Add Employee' : 'Edit Employee'}</h2>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button onClick={del} className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Basic Info */}
          <Section label="Basic Info">
            <div className="grid grid-cols-2 gap-2">
              <FullRow><Input label="Full Name *" value={form.full_name} onChange={v => set('full_name', v)} /></FullRow>
              <Input label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
              <Input label="Phone" value={form.phone} onChange={v => set('phone', v)} />
              <Input label="Employee ID" value={form.employee_id} onChange={v => set('employee_id', v)} />
              <Input label="Clock-In Code" value={form.clock_in_code} onChange={v => set('clock_in_code', v)} />
              <Input label="Hire Date" value={form.hire_date} onChange={v => set('hire_date', v)} type="date" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <SelectInput label="Status" value={form.status} onChange={v => set('status', v)} options={[{v:'active',l:'Active'},{v:'inactive',l:'Inactive'},{v:'archived',l:'Archived'}]} />
            </div>
          </Section>

          {/* Role & Department */}
          <Section label="Role & Department">
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Department" value={form.department} onChange={v => set('department', v)} options={DEPTS.map(d => ({v:d,l:d}))} placeholder="Select dept" />
              <SelectInput label="Primary Role" value={form.primary_role} onChange={v => set('primary_role', v)} options={DEFAULT_ROLES.map(r => ({v:r,l:r}))} placeholder="Select role" />
              <Input label="Job Code" value={form.job_code} onChange={v => set('job_code', v)} />
              <SelectInput label="Pay Type" value={form.pay_type} onChange={v => set('pay_type', v)} options={[{v:'/ hr',l:'Hourly'},{v:'salary',l:'Salary'}]} />
              <Input label="Pay Rate" value={form.rate_of_pay} onChange={v => set('rate_of_pay', v)} type="number" />
            </div>
          </Section>

          {/* Reports To */}
          <Section label="Reports To (Chain of Command)">
            <select
              value={form.manager_id}
              onChange={e => handleManagerChange(e.target.value)}
              className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
            >
              <option value="">— No manager assigned —</option>
              {otherEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name} {e.primary_role ? `(${e.primary_role})` : ''}</option>
              ))}
            </select>
          </Section>

          {/* Area/Station Assignments */}
          <Section label="Assigned Work Areas">
            <p className="text-[10px] text-muted-foreground mb-2">Where this employee works day-to-day</p>
            <div className="flex flex-wrap gap-1.5">
              {areas.map(a => (
                <ChipToggle key={a.id} label={a.name} active={(form.assigned_areas||[]).includes(a.id)} onToggle={() => toggleArr('assigned_areas', a.id)} />
              ))}
            </div>
          </Section>

          <Section label="Assigned Stations">
            <p className="text-[10px] text-muted-foreground mb-2">Stations this employee is responsible for</p>
            <div className="flex flex-wrap gap-1.5">
              {filteredStations.map(s => (
                <ChipToggle key={s.id} label={s.name} sub={s.area_name} active={(form.assigned_stations||[]).includes(s.id)} onToggle={() => toggleArr('assigned_stations', s.id)} />
              ))}
            </div>
          </Section>

          {/* Managed / Ownership */}
          <Section label="Managed Areas (Ownership)">
            <p className="text-[10px] text-muted-foreground mb-2">Areas this employee owns — they receive all alerts, approvals, and reports for these</p>
            <div className="flex flex-wrap gap-1.5">
              {areas.map(a => (
                <ChipToggle key={a.id} label={a.name} active={(form.managed_areas||[]).includes(a.id)} onToggle={() => toggleArr('managed_areas', a.id)} color="orange" />
              ))}
            </div>
          </Section>

          <Section label="Managed Stations (Ownership)">
            <div className="flex flex-wrap gap-1.5">
              {stations.map(s => (
                <ChipToggle key={s.id} label={s.name} sub={s.area_name} active={(form.managed_stations||[]).includes(s.id)} onToggle={() => toggleArr('managed_stations', s.id)} color="orange" />
              ))}
            </div>
          </Section>

          {/* Assignment Authority */}
          <Section label="Can Assign Tasks To">
            <p className="text-[10px] text-muted-foreground mb-2">Which roles this employee can assign tasks to</p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_ROLES.map(r => (
                <ChipToggle key={r} label={r} active={(form.can_assign_to_roles||[]).includes(r)} onToggle={() => toggleArr('can_assign_to_roles', r)} color="blue" />
              ))}
            </div>
          </Section>

          {/* Certifications */}
          <Section label="Certifications">
            <CertInput value={form.certifications || []} onChange={v => set('certifications', v)} />
          </Section>

          {/* Notes */}
          <Section label="Notes">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Internal notes..."
              className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground resize-none"
            />
          </Section>
        </div>

        {/* Save */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4">
          <button onClick={save} disabled={saving} className="w-full btn-primary py-3">
            {saving ? 'Saving...' : isNew ? 'Add Employee' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      {children}
    </div>
  );
}

function FullRow({ children }) { return <div className="col-span-2">{children}</div>; }

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground block mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground" />
    </div>
  );
}

function SelectInput({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground block mb-1">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function ChipToggle({ label, sub, active, onToggle, color = 'default' }) {
  const colors = {
    default: active ? 'bg-primary/20 text-primary border-primary/40' : 'bg-muted text-muted-foreground border-border',
    orange:  active ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' : 'bg-muted text-muted-foreground border-border',
    blue:    active ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-muted text-muted-foreground border-border',
  };
  return (
    <button type="button" onClick={onToggle}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${colors[color]}`}>
      {label}{sub ? <span className="opacity-60 ml-1 text-[9px]">{sub}</span> : null}
    </button>
  );
}

function CertInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    if (!input.trim()) return;
    onChange([...value, input.trim()]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((c, i) => (
          <span key={i} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">
            {c}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-400">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add certification (e.g. ServSafe)"
          className="flex-1 px-3 py-1.5 liquid-card rounded-lg text-sm text-foreground" />
        <button onClick={add} className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded-lg">Add</button>
      </div>
    </div>
  );
}