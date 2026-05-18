import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MANAGER_LOG_TYPES = [
  { id: 'sales_notes', label: 'Sales Notes' },
  { id: 'guest_notes', label: 'Guest Notes' },
  { id: 'cash_log', label: 'Cash Log' },
  { id: 'employee_calendar', label: 'Employee Calendar' },
  { id: 'incident_report', label: 'Incident Report' },
  { id: 'other', label: 'Other' },
];

const DEPARTMENTS = ['FOH', 'BOH', 'Bar', 'Dish', 'Management', 'Whole restaurant'];
const SHIFTS = ['Opening', 'Mid', 'Closing', 'Other'];

export default function ManagerLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    manager_log_type: '',
    shift: 'Opening',
    manager_on_duty: user?.full_name || user?.email || '',
    date_time: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    summary: '',
    department: 'Whole restaurant',
    sales_notes: '',
    staffing_notes: '',
    guest_notes: '',
    maintenance_notes: '',
    food_safety_notes: '',
    follow_up_tasks: '',
  });

  const validate = () => {
    if (!form.manager_log_type) {
      toast.error('Manager log type is required');
      return false;
    }
    if (!form.summary.trim()) {
      toast.error('Summary is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const selectedType = MANAGER_LOG_TYPES.find(type => type.id === form.manager_log_type);
    base44.entities.UnifiedLog.create({
      type: 'manager_note',
      title: form.summary,
      description: [
        form.sales_notes && `Sales: ${form.sales_notes}`,
        form.staffing_notes && `Staffing: ${form.staffing_notes}`,
        form.guest_notes && `Guests: ${form.guest_notes}`,
        form.maintenance_notes && `Maintenance: ${form.maintenance_notes}`,
        form.food_safety_notes && `Food Safety: ${form.food_safety_notes}`,
        form.follow_up_tasks && `Follow-up: ${form.follow_up_tasks}`,
      ].filter(Boolean).join('\n\n'),
      employee_name: form.manager_on_duty,
      status: 'open',
      priority: 'medium',
      visibility: 'team_log',
      custom_metadata: {
        manager_log_type: form.manager_log_type,
        manager_log_type_label: selectedType?.label,
        shift: form.shift,
        department: form.department,
        manager_on_duty: form.manager_on_duty,
        date_time: form.date_time,
      },
    }).then(onSave).catch(err => {
      console.error('Failed to save manager log:', err);
      toast.error('Failed to save manager log');
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Log Type *</label>
        <div className="grid grid-cols-2 gap-2">
          {MANAGER_LOG_TYPES.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => setForm({
                ...form,
                manager_log_type: type.id,
                summary: form.summary || type.label,
              })}
              className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition-all ${
                form.manager_log_type === type.id
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Shift *</label>
          <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Department</label>
          <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Manager on Duty</label>
          <input type="text" value={form.manager_on_duty}
            onChange={e => setForm({ ...form, manager_on_duty: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Date/Time *</label>
          <input type="datetime-local" value={form.date_time}
            onChange={e => setForm({ ...form, date_time: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Summary *</label>
        <textarea placeholder="Overview of shift..." value={form.summary}
          onChange={e => setForm({ ...form, summary: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Sales Notes</label>
        <textarea placeholder="Revenue, covers, avg check..." value={form.sales_notes}
          onChange={e => setForm({ ...form, sales_notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Staffing Notes</label>
        <textarea placeholder="Attendance, call-outs, performance..." value={form.staffing_notes}
          onChange={e => setForm({ ...form, staffing_notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Guest Notes</label>
        <textarea placeholder="Feedback, complaints, compliments..." value={form.guest_notes}
          onChange={e => setForm({ ...form, guest_notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Maintenance Notes</label>
        <textarea placeholder="Equipment issues, repairs needed..." value={form.maintenance_notes}
          onChange={e => setForm({ ...form, maintenance_notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Food Safety Notes</label>
        <textarea placeholder="Temperature checks, compliance issues..." value={form.food_safety_notes}
          onChange={e => setForm({ ...form, food_safety_notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Follow-up Tasks</label>
        <textarea placeholder="Action items for next shift or team..." value={form.follow_up_tasks}
          onChange={e => setForm({ ...form, follow_up_tasks: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Manager Note'}
      </button>
    </div>
  );
}
