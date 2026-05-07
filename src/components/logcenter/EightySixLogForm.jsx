import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const UNITS = ['each', 'portions', 'servings', 'lbs', 'oz', 'gallons', 'quarts', 'cups', 'cases', 'boxes'];

export default function EightySixLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    item_name: '', quantity: 0, unit: 'each', notes: ''
  });

  const handleSave = () => {
    if (!form.item_name) {
      alert('Please enter the item name');
      return;
    }
    base44.entities.EightySixItem.create({
      item_name: form.item_name,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit,
      notes: form.notes,
      marked_by: user?.full_name || user?.email || 'Unknown',
      is_active: true,
    }).then(onSave);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Item Name *</label>
        <input type="text" placeholder="e.g. Ribeye Steak, Caesar Salad..." value={form.item_name}
          onChange={e => setForm({ ...form, item_name: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Quantity Out</label>
          <input type="number" min="0" step="1" placeholder="0" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Unit</label>
          <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
            className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Notes (e.g., when back in stock)</label>
        <textarea placeholder="Any notes..." value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark 86'}
      </button>
    </div>
  );
}