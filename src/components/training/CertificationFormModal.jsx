import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function CertificationFormModal({ certification, onClose, onSuccess }) {
  const [form, setForm] = useState({
    employeeId: '',
    moduleId: '',
    certificationName: '',
    issueDate: '',
    expirationDate: '',
    status: 'active',
    renewalRequired: false,
    renewalDueDate: '',
  });
  const [employees, setEmployees] = useState([]);
  const [modules, setModules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    if (certification) {
      setForm(certification);
    }
  }, [certification]);

  const loadData = async () => {
    try {
      const [empData, modData] = await Promise.all([
        base44.entities.Employee.list('full_name', 100).catch(() => []),
        base44.entities.TrainingModule.filter({ moduleType: 'certification' }).catch(() => []),
      ]);
      setEmployees(empData);
      setModules(modData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.certificationName || !form.issueDate) {
      toast.error('Fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (certification?.id) {
        await base44.entities.CertificationRecord.update(certification.id, form);
        toast.success('Certification updated');
      } else {
        await base44.entities.CertificationRecord.create(form);
        toast.success('Certification recorded');
      }
      onSuccess();
    } catch (err) {
      toast.error('Failed to save certification');
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
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/30 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-bold">{certification ? 'Edit Certification' : 'Record Certification'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Employee *</label>
            <select
              required
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="">Select employee...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Certification Name *</label>
            <input
              type="text"
              required
              value={form.certificationName}
              onChange={(e) => setForm({ ...form, certificationName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              placeholder="e.g., Food Handler Certification"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Issue Date *</label>
              <input
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Expiration Date</label>
              <input
                type="date"
                value={form.expirationDate}
                onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="renewal"
              checked={form.renewalRequired}
              onChange={(e) => setForm({ ...form, renewalRequired: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="renewal" className="text-sm font-semibold">Renewal Required</label>
          </div>

          {form.renewalRequired && (
            <div>
              <label className="block text-sm font-semibold mb-2">Renewal Due Date</label>
              <input
                type="date"
                value={form.renewalDueDate}
                onChange={(e) => setForm({ ...form, renewalDueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
            </div>
          )}
        </form>

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
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}