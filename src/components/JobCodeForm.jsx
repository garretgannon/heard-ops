import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { SYSTEM_ROLES } from '@/lib/roleVisibilityConfig';

const departments = ['BOH', 'FOH', 'Bar', 'Management'];

export default function JobCodeForm({ jobCode, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: jobCode?.name || '',
    department: jobCode?.department || 'BOH',
    description: jobCode?.description || '',
    maps_to_role: jobCode?.maps_to_role || '',
    isActive: jobCode?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Job code name is required');
      return;
    }
    setSaving(true);
    // Duplicate check
    const existing = await base44.entities.JobCode.list();
    const isDuplicate = existing.some(j =>
      j.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
      j.id !== jobCode?.id
    );
    if (isDuplicate) {
      alert(`A job code named "${formData.name.trim()}" already exists.`);
      setSaving(false);
      return;
    }
    if (jobCode?.id) {
      await base44.entities.JobCode.update(jobCode.id, formData);
    } else {
      await base44.entities.JobCode.create(formData);
    }
    setSaving(false);
    await onSave();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase text-secondary-text mb-2">Job Code Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
          placeholder="e.g., Cook, Server, Bartender"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-secondary-text mb-2">Department</label>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        >
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-secondary-text mb-2">Maps to System Role</label>
        <select
          name="maps_to_role"
          value={formData.maps_to_role}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
        >
          <option value="">— None —</option>
          {SYSTEM_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">Determines what the app shows/hides for employees with this job code.</p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-secondary-text mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="2"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none"
          placeholder="Optional notes"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded" />
        <label className="text-sm font-semibold text-foreground">Active</label>
      </div>

      <div className="flex gap-2 pt-4 border-t border-border mt-4">
        <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-50">
          {saving ? 'Saving...' : jobCode ? 'Update' : 'Create'}
        </button>
        <button onClick={onClose} className="flex-1 btn-secondary text-sm">Cancel</button>
      </div>
    </div>
  );
}