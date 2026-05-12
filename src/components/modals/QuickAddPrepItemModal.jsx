import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const DEFAULT_FORM = {
  item_name: '',
  station: '',
  par_quantity: '',
  unit: '',
  shift: 'any',
  due_time: '',
  assigned_role: '',
  batch_size: '',
  requires_inventory_count: true,
  is_active: true,
};

export default function QuickAddPrepItemModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.item_name?.trim() || !form.station?.trim() || !form.par_quantity || !form.unit?.trim()) {
      toast.error('Fill in item name, station, par quantity, and unit');
      return;
    }

    setSaving(true);
    try {
      const data = {
        item_name: form.item_name.trim(),
        station: form.station.trim(),
        par_quantity: parseFloat(form.par_quantity),
        unit: form.unit.trim(),
        shift: form.shift,
        due_time: form.due_time,
        assigned_role: form.assigned_role.trim(),
        batch_size: form.batch_size ? parseFloat(form.batch_size) : null,
        requires_inventory_count: form.requires_inventory_count,
        is_active: form.is_active,
      };
      
      // Create a single-item template
      await base44.entities.PrepPlanTemplate?.create?.({
        template_name: `${form.item_name} - Quick Add`,
        station: form.station,
        shift: form.shift,
        assigned_role: form.assigned_role,
        is_active: form.is_active,
        status: 'published',
        items: [data],
      });

      toast.success('Prep item added');
      setForm(DEFAULT_FORM);
      onSuccess?.();
      onClose();
    } catch (e) {
      toast.error('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card-glass border border-border rounded-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Quick Add Prep Item</h2>
          <button onClick={onClose} className="h-8 w-8 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Item Name *</label>
            <input value={form.item_name} onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Diced Onions" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Station *</label>
            <input value={form.station} onChange={e => setForm(p => ({ ...p, station: e.target.value }))} placeholder="e.g. Grill" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Par Qty *</label>
              <input type="number" value={form.par_quantity} onChange={e => setForm(p => ({ ...p, par_quantity: e.target.value }))} placeholder="5" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Unit *</label>
              <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="lb" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Shift</label>
              <select value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="opening">Opening</option>
                <option value="mid">Mid</option>
                <option value="closing">Closing</option>
                <option value="any">Any</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Due Time</label>
              <input type="time" value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Role</label>
              <input value={form.assigned_role} onChange={e => setForm(p => ({ ...p, assigned_role: e.target.value }))} placeholder="e.g. Cook" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Batch Size</label>
              <input type="number" value={form.batch_size} onChange={e => setForm(p => ({ ...p, batch_size: e.target.value }))} placeholder="Optional" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input type="checkbox" checked={form.requires_inventory_count} onChange={e => setForm(p => ({ ...p, requires_inventory_count: e.target.checked }))} className="rounded border-border" />
              Requires Inventory Count
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded border-border" />
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="flex-1 btn-secondary text-xs h-9">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-xs h-9">{saving ? 'Saving…' : 'Add Item'}</button>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;