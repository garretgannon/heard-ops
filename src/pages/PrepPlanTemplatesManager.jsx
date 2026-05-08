import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const DEFAULT_FORM = {
  template_name: '',
  station: '',
  shift: 'opening',
  assigned_role: '',
  assigned_employee: '',
  due_time: '',
  requires_inventory_count: true,
  is_active: true,
  items: [],
  notes: '',
};

const DEFAULT_ITEM = {
  item_name: '',
  par_quantity: '',
  unit: '',
  priority: 'medium',
  requires_photo: false,
  requires_manager_review: false,
  notes: '',
};

export default function PrepPlanTemplatesManager() {
  const { isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [newItem, setNewItem] = useState(DEFAULT_ITEM);

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

  const resetForm = () => {
    setForm({ ...DEFAULT_FORM });
    setNewItem({ ...DEFAULT_ITEM });
  };

  const addItem = () => {
    if (!newItem.item_name?.trim() || !newItem.par_quantity || !newItem.unit?.trim()) {
      toast.error('Fill in item name, par quantity, and unit');
      return;
    }
    const updated = {
      ...form,
      items: [...(form.items || []), { ...newItem, par_quantity: parseFloat(newItem.par_quantity) }],
    };
    setForm(updated);
    setNewItem({ ...DEFAULT_ITEM });
    toast.success('Item added');
  };

  const removeItem = (idx) => {
    setForm(p => ({
      ...p,
      items: (p.items || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!form.template_name?.trim() || !form.station?.trim() || !form.items || form.items.length === 0) {
      toast.error('Fill in template name, station, and add at least one item');
      return;
    }

    try {
      const saveData = {
        ...form,
        template_name: form.template_name.trim(),
        station: form.station.trim(),
      };
      if (editing) {
        await base44.entities.PrepPlanTemplate?.update?.(editing.id, saveData);
        toast.success('Template updated');
      } else {
        await base44.entities.PrepPlanTemplate?.create?.(saveData);
        toast.success('Template created');
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
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
        subtitle="Build templates with multiple items, each with priority and photo requirements"
        actions={
          <button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="btn-primary text-xs h-8 px-3 flex items-center gap-1">
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
              onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}
              className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create First Template
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-bold text-foreground">{t.template_name}</p>
                  <p className="text-xs text-muted-foreground">{t.station} • {t.items?.length || 0} items • {t.shift}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!t.is_active && <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">Inactive</span>}
                  <button
                    onClick={() => { setEditing(t); setForm({ ...DEFAULT_FORM, ...t, items: t.items || [] }); setShowForm(true); }}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit' : 'New'} Prep Template</h2>

            <div className="space-y-3 pb-4 border-b border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Template Name *</label>
                  <input value={form.template_name} onChange={e => setForm(p => ({ ...p, template_name: e.target.value }))} placeholder="e.g. Opening Line Prep" className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Station *</label>
                  <input value={form.station} onChange={e => setForm(p => ({ ...p, station: e.target.value }))} placeholder="e.g. Grill" className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
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
                  <label className="block text-xs font-bold text-foreground mb-1">Assign to Email</label>
                  <input type="email" value={form.assigned_employee} onChange={e => setForm(p => ({ ...p, assigned_employee: e.target.value }))} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.requires_inventory_count} onChange={e => setForm(p => ({ ...p, requires_inventory_count: e.target.checked }))} className="rounded border-border" />
                  Requires Inventory Count
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded border-border" />
                  Active
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-foreground text-sm">Prep Items ({form.items?.length || 0})</h3>
              
              {form.items && form.items.length > 0 && (
                <div className="space-y-2 bg-background/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="bg-card border border-border rounded p-2.5 flex items-start justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{item.item_name}</p>
                        <p className="text-xs text-muted-foreground">{item.par_quantity} {item.unit} • {item.priority}</p>
                        {item.requires_photo && <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded inline-block mt-1">📸 Photo</span>}
                      </div>
                      <button onClick={() => removeItem(idx)} className="h-6 w-6 rounded hover:bg-red-500/10 flex items-center justify-center text-muted-foreground hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-background/50 rounded-lg p-3 space-y-2 border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase">Add Item</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={newItem.item_name} onChange={e => setNewItem(p => ({ ...p, item_name: e.target.value }))} placeholder="Item name" className="px-2 py-1.5 bg-card border border-border rounded text-xs text-foreground" />
                  <input type="number" value={newItem.par_quantity} onChange={e => setNewItem(p => ({ ...p, par_quantity: e.target.value }))} placeholder="Par qty" className="px-2 py-1.5 bg-card border border-border rounded text-xs text-foreground" />
                  <input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} placeholder="Unit" className="px-2 py-1.5 bg-card border border-border rounded text-xs text-foreground" />
                  <select value={newItem.priority} onChange={e => setNewItem(p => ({ ...p, priority: e.target.value }))} className="px-2 py-1.5 bg-card border border-border rounded text-xs text-foreground">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input type="checkbox" checked={newItem.requires_photo} onChange={e => setNewItem(p => ({ ...p, requires_photo: e.target.checked }))} className="rounded border-border" />
                    Requires Photo
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input type="checkbox" checked={newItem.requires_manager_review} onChange={e => setNewItem(p => ({ ...p, requires_manager_review: e.target.checked }))} className="rounded border-border" />
                    Manager Review
                  </label>
                </div>
                <button onClick={addItem} className="w-full py-1.5 bg-primary text-white text-xs font-bold rounded hover:brightness-110 transition-all flex items-center justify-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 btn-secondary text-xs h-9">Cancel</button>
              <button onClick={handleSave} className="flex-1 btn-primary text-xs h-9">Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;