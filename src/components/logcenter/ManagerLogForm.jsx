import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const DEPARTMENTS = ['BOH', 'FOH', 'Bar', 'Management'];

export default function ManagerLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    title: '', department: 'BOH', priority: 'medium', notes: ''
  });

  const handleSave = () => {
    if (!form.title) {
      alert('Please enter a title');
      return;
    }
    base44.entities.ManagerLog.create({
      title: form.title,
      department: form.department,
      priority: form.priority,
      notes: form.notes,
      logged_by_name: user?.full_name || user?.email || 'Unknown',
      status: 'needs_review',
    }).then(onSave);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Note Title *</label>
        <input type="text" placeholder="e.g. Staff meeting notes..." value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Department</label>
          <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Priority</label>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Details / Notes</label>
        <textarea placeholder="What happened? Any follow-up needed?" value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Manager Note'}
      </button>
    </div>
  );
}