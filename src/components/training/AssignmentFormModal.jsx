import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignmentFormModal({ assignment, modules, onClose, onSuccess }) {
  const [form, setForm] = useState({
    moduleId: '',
    assignedToEmployeeId: '',
    assignedToRoleId: '',
    assignedToStationId: '',
    dueDate: '',
    required: false,
  });
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stations, setStations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    if (assignment) {
      setForm(assignment);
    }
  }, [assignment]);

  const loadData = async () => {
    try {
      const [empData, rolesData, stationsData] = await Promise.all([
        base44.entities.Employee.list('full_name', 100).catch(() => []),
        base44.entities.Role?.list?.().catch(() => []),
        base44.entities.Station.list('name', 100).catch(() => []),
      ]);
      setEmployees(empData);
      setRoles(rolesData || []);
      setStations(stationsData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.moduleId) {
      toast.error('Please select a module');
      return;
    }
    if (!form.assignedToEmployeeId && !form.assignedToRoleId && !form.assignedToStationId) {
      toast.error('Assign to at least one: Employee, Role, or Station');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, assignedBy: 'admin', assignedAt: new Date().toISOString() };
      if (assignment?.id) {
        await base44.entities.TrainingAssignment.update(assignment.id, payload);
        toast.success('Assignment updated');
      } else {
        await base44.entities.TrainingAssignment.create(payload);
        toast.success('Training assigned');
      }
      onSuccess();
    } catch (err) {
      toast.error('Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end lg:items-center justify-center">
      <div className="bg-card w-full max-h-[90vh] lg:max-h-[95vh] lg:max-w-2xl rounded-t-2xl lg:rounded-xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/30 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-bold">{assignment ? 'Edit Assignment' : 'Assign Training'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Module *</label>
            <select
              required
              value={form.moduleId}
              onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="">Select a module...</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Assign to Employee</label>
            <select
              value={form.assignedToEmployeeId || ''}
              onChange={(e) => setForm({ ...form, assignedToEmployeeId: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="">-- None --</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Assign to Role</label>
            <select
              value={form.assignedToRoleId || ''}
              onChange={(e) => setForm({ ...form, assignedToRoleId: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="">-- None --</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Assign to Station</label>
            <select
              value={form.assignedToStationId || ''}
              onChange={(e) => setForm({ ...form, assignedToStationId: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="">-- None --</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={form.required}
              onChange={(e) => setForm({ ...form, required: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="required" className="text-sm font-semibold">Required Completion</label>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t border-border/30 bg-card/95 backdrop-blur-sm flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}