import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const DEPARTMENTS = ['BOH', 'FOH', 'Bar', 'Management'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function IssueLogForm({ onSave, loading }) {
  const [form, setForm] = useState({
    title: '', department: 'BOH', location: '', priority: 'high', notes: ''
  });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    base44.entities.Area.list('-updated_date', 50).then(data => {
      setLocations(data.map(a => a.name));
    }).catch(() => setLocations([]));
  }, []);

  const handleSave = () => {
    if (!form.title || !form.department) {
      alert('Please fill in title and department');
      return;
    }
    base44.entities.Issue.create({
      title: form.title,
      department: form.department,
      location: form.location,
      priority: form.priority,
      notes: form.notes,
      status: 'open',
    }).then(onSave);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Issue Title *</label>
        <input type="text" placeholder="e.g. Fryer not heating..." value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Department *</label>
          <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Priority *</label>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Location / Area</label>
        <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="">Select location...</option>
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Description / Notes</label>
        <textarea placeholder="What happened? What needs to be fixed?" value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Issue'}
      </button>
    </div>
  );
}