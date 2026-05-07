import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const WASTE_REASONS = ['Expired', 'Overproduction', 'Dropped', 'Contaminated', 'Trimming/Prep', 'Temperature Abuse', 'Other'];
const UNITS = ['lbs', 'oz', 'kg', 'g', 'portions', 'each', 'gallons', 'quarts', 'cups', 'other'];

export default function WasteLogForm({ onSave, loading }) {
  const [form, setForm] = useState({
    itemName: '', quantity: 1, unit: 'lbs', estimatedCost: '', reason: 'Other', notes: ''
  });

  const handleSave = () => {
    if (!form.itemName || form.quantity === '' || form.estimatedCost === '') {
      alert('Please fill in item name, quantity, and estimated cost');
      return;
    }
    base44.entities.WasteEntry.create({
      itemName: form.itemName,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      estimatedCost: parseFloat(form.estimatedCost),
      reason: form.reason,
      notes: form.notes,
      wasteDate: new Date().toISOString().split('T')[0],
      wasteTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }).then(onSave);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Item Name *</label>
        <input type="text" placeholder="e.g. Salmon, Lettuce..." value={form.itemName}
          onChange={e => setForm({ ...form, itemName: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Quantity *</label>
          <input type="number" min="0" step="0.5" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Unit *</label>
          <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
            className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Cost ($) *</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" value={form.estimatedCost}
            onChange={e => setForm({ ...form, estimatedCost: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Reason *</label>
        <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
          {WASTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Notes</label>
        <textarea placeholder="Additional details..." value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Waste Entry'}
      </button>
    </div>
  );
}