import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Trash2, Archive } from 'lucide-react';
import { toast } from 'sonner';
import DesktopPageHeader from '@/components/DesktopPageHeader';

export default function PrepPlanTemplatesManager() {
  const { isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    item_name: '',
    station: '',
    assigned_role: '',
    default_par: '',
    unit: '',
    batch_size: '',
    shift: 'opening',
    due_time: '',
    requires_inventory_count: true,
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await base44.entities.PrepPlanTemplate?.list?.('-updated_date', 100).catch(() => []);
      setTemplates(data || []);
    } catch (e) {
      toast.error('Failed to load templates');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.item_name || !form.station || !form.default_par || !form.unit) {
      toast.error('Fill in required fields');
      return;
    }

    try {
      if (editing) {
        await base44.entities.PrepPlanTemplate?.update?.(editing.id, form);
        toast.success('Template updated');
      } else {
        await base44.entities.PrepPlanTemplate?.create?.(form);
        toast.success('Template created');
      }
      setShowForm(false);
      setEditing(null);
      setForm({
        item_name: '',
        station: '',
        assigned_role: '',
        default_par: '',
        unit: '',
        batch_size: '',
        shift: 'opening',
        due_time: '',
        requires_inventory_count: true,
        is_active: true,
      });
      await loadTemplates();
    } catch (e) {
      toast.error('Failed to save: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await base44.entities.PrepPlanTemplate?.delete?.(id);
      toast.success('Template deleted');
      await loadTemplates();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground font-bold">Admin only</p>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-background">
      <DesktopPageHeader
        title="Prep Plan Templates"
        subtitle="Define par-based prep items and defaults"
        actions={
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary text-xs h-8 px-3 flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-foreground font-bold mb-3">No prep templates yet</p>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create First Template
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {templates.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">{t.item_name}</p>
                  <p className="text-xs text-muted-foreground">{t.station} • Par: {t.default_par} {t.unit} • {t.shift}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!t.is_active && <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">Inactive</span>}
                  <button
                    onClick={() => { setEditing(t); setForm(t); setShowForm(true); }}
                    className="h-8 w-8 rounded border border-border hover:bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="h-8 w-8 rounded border border-border hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit' : 'New'} Prep Template</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Item Name *</label>
                <input value={form.item_name} onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Station *</label>
                <input value={form.station} onChange={e => setForm(p => ({ ...p, station: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Par Quantity *</label>
                <input type="number" value={form.default_par} onChange={e => setForm(p => ({ ...p, default_par: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Unit *</label>
                <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Shift</label>
                <select value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground">
                  <option value="opening">Opening</option>
                  <option value="mid">Mid</option>
                  <option value="closing">Closing</option>
                  <option value="any">Any</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Due Time</label>
                <input type="time" value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Role</label>
                <input value={form.assigned_role} onChange={e => setForm(p => ({ ...p, assigned_role: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Batch Size</label>
                <input type="number" value={form.batch_size} onChange={e => setForm(p => ({ ...p, batch_size: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.requires_inventory_count} onChange={e => setForm(p => ({ ...p, requires_inventory_count: e.target.checked }))} className="rounded border-border" />
                Requires Inventory Count
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded border-border" />
                Active
              </label>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="flex-1 btn-secondary text-xs h-9">Cancel</button>
              <button onClick={handleSave} className="flex-1 btn-primary text-xs h-9">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;