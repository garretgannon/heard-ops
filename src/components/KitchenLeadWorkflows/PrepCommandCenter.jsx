import { useState } from 'react';
import { X, Plus, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';

const PREP_ITEMS = [
  { name: 'Chicken breasts', par: 40, unit: 'each' },
  { name: 'Vegetables mix', par: 20, unit: 'lbs' },
  { name: 'Stock', par: 5, unit: 'gallons' },
  { name: 'Sauces', par: 12, unit: 'containers' },
  { name: 'Proteins', par: 15, unit: 'lbs' },
];

const PRIORITY_LEVELS = [
  { label: 'Standard', value: 'standard', color: 'text-blue-400' },
  { label: 'High', value: 'high', color: 'text-amber-400' },
  { label: 'Urgent', value: 'urgent', color: 'text-red-400' },
];

export default function PrepCommandCenter({ isOpen, onClose, onSuccess }) {
  const [prepItems, setPrepItems] = useState(
    PREP_ITEMS.map(item => ({
      ...item,
      assignedQty: 0,
      priority: 'standard',
      assignedTo: 'Team',
      dueTime: '14:00',
    }))
  );
  const [submitting, setSubmitting] = useState(false);

  const handleAssignPrep = async () => {
    setSubmitting(true);
    haptics.medium?.();

    try {
      const assignments = prepItems
        .filter(item => item.assignedQty > 0)
        .map(item => ({
          name: item.name,
          quantity: item.assignedQty,
          unit: item.unit,
          priority: item.priority,
          assigned_to: item.assignedTo,
          due_time: item.dueTime,
          shift_date: new Date().toISOString().split('T')[0],
          status: 'pending',
        }));

      for (const assignment of assignments) {
        await base44.entities.PrepItem.create(assignment);
      }

      onSuccess?.();
      onClose?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasAssignments = prepItems.some(item => item.assignedQty > 0);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-2xl border-t border-border p-5 space-y-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between sticky top-0 bg-card pb-3 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">Prep Command Center</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {prepItems.map((item, idx) => (
            <div key={idx} className="bg-muted/40 border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.name}</p>
                  <p className="text-xs text-secondary-text">Par: {item.par} {item.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Assign Qty */}
                <div>
                  <label className="text-[10px] font-bold text-secondary-text uppercase block mb-1">Assign</label>
                  <input
                    type="number"
                    min="0"
                    value={item.assignedQty}
                    onChange={e => {
                      const newItems = [...prepItems];
                      newItems[idx].assignedQty = parseInt(e.target.value) || 0;
                      setPrepItems(newItems);
                    }}
                    placeholder="0"
                    className="w-full p-1.5 rounded text-sm bg-background border border-border text-foreground text-center"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[10px] font-bold text-secondary-text uppercase block mb-1">Priority</label>
                  <select
                    value={item.priority}
                    onChange={e => {
                      const newItems = [...prepItems];
                      newItems[idx].priority = e.target.value;
                      setPrepItems(newItems);
                    }}
                    className="w-full p-1.5 rounded text-sm bg-background border border-border text-foreground"
                  >
                    {PRIORITY_LEVELS.map(({ label, value }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Time */}
              <input
                type="time"
                value={item.dueTime}
                onChange={e => {
                  const newItems = [...prepItems];
                  newItems[idx].dueTime = e.target.value;
                  setPrepItems(newItems);
                }}
                className="w-full p-1.5 rounded text-sm bg-background border border-border text-foreground"
              />
            </div>
          ))}
        </div>

        {!hasAssignments && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-amber-300">Assign quantities to create prep tasks →</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleAssignPrep}
          disabled={!hasAssignments || submitting}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Publishing...' : `Publish ${prepItems.filter(i => i.assignedQty > 0).length} Assignments`}
        </button>
      </div>
    </div>
  );
}