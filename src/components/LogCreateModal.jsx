import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Save, Loader2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const LOG_TYPES = [
  { id: 'manager', label: 'Manager Note', color: 'bg-blue-500', desc: 'General shift note or observation' },
  { id: 'issue', label: 'Issue / Incident', color: 'bg-red-500', desc: 'Equipment, safety, or operational issue' },
  { id: 'waste', label: 'Waste Entry', color: 'bg-amber-500', desc: 'Log food or product waste' },
  { id: 'eighty_six', label: '86 Item', color: 'bg-orange-500', desc: 'Mark an item as out of stock' },
  { id: 'maintenance', label: 'Maintenance', color: 'bg-purple-500', desc: 'Equipment repair or maintenance request' },
];

export default function LogCreateModal({ onClose, onCreated }) {
  const { user } = useCurrentUser();
  const [type, setType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', notes: '', priority: 'medium', department: 'BOH',
    location: '', itemName: '', quantity: 1, unit: 'each',
    estimatedCost: '', reason: 'Other',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title && type !== 'waste' && type !== 'eighty_six') return;
    setSaving(true);
    haptics.medium();
    try {
      if (type === 'manager') {
        await base44.entities.ManagerLog.create({
          title: form.title,
          notes: form.notes,
          priority: form.priority,
          department: form.department,
          logged_by_name: user?.full_name || user?.email,
          status: 'needs_review',
        });
      } else if (type === 'issue') {
        await base44.entities.Issue.create({
          title: form.title,
          notes: form.notes,
          priority: form.priority,
          department: form.department,
          location: form.location,
          status: 'open',
        });
      } else if (type === 'waste') {
        await base44.entities.WasteEntry.create({
          itemName: form.title || form.itemName,
          quantity: parseFloat(form.quantity) || 1,
          unit: form.unit,
          estimatedCost: parseFloat(form.estimatedCost) || 0,
          reason: form.reason,
          notes: form.notes,
          wastedBy: user?.full_name || user?.email,
          wasteDate: new Date().toISOString().split('T')[0],
        });
      } else if (type === 'eighty_six') {
        await base44.entities.EightySixItem.create({
          item_name: form.title,
          quantity: parseFloat(form.quantity) || 0,
          unit: form.unit,
          notes: form.notes,
          marked_by: user?.full_name || user?.email,
          is_active: true,
        });
      } else if (type === 'maintenance') {
        await base44.entities.MaintenanceRequest.create({
          title: form.title,
          description: form.notes,
          priority: form.priority,
          location: form.location,
          status: 'open',
          reported_by: user?.full_name || user?.email,
        }).catch(() =>
          base44.entities.Issue.create({
            title: `[Maintenance] ${form.title}`,
            notes: form.notes,
            priority: form.priority,
            location: form.location,
            status: 'open',
          })
        );
      }
      haptics.success?.();
      onCreated?.();
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-bold text-foreground">New Log Entry</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Type selector */}
          {!type ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Select Log Type</p>
              {LOG_TYPES.map(lt => (
                <button key={lt.id} onClick={() => setType(lt.id)}
                  className="w-full flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 hover:border-primary/40 active:scale-[0.98] transition-all text-left">
                  <div className={`h-3 w-3 rounded-full shrink-0 ${lt.color}`} />
                  <div>
                    <p className="text-sm font-bold text-foreground">{lt.label}</p>
                    <p className="text-xs text-muted-foreground">{lt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-3 w-3 rounded-full shrink-0 ${LOG_TYPES.find(l => l.id === type)?.color}`} />
                <p className="text-sm font-bold text-foreground">{LOG_TYPES.find(l => l.id === type)?.label}</p>
                <button onClick={() => setType(null)} className="ml-auto text-xs text-primary font-bold">Change</button>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  {type === 'waste' || type === 'eighty_six' ? 'Item Name *' : 'Title *'}
                </label>
                <input type="text" placeholder="Enter title..." value={form.title}
                  onChange={e => set('title', e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
              </div>

              {(type === 'waste' || type === 'eighty_six') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Quantity</label>
                    <input type="number" min="0" step="0.5" value={form.quantity}
                      onChange={e => set('quantity', e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Unit</label>
                    <input type="text" placeholder="lbs, each..." value={form.unit}
                      onChange={e => set('unit', e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
                  </div>
                </div>
              )}

              {type === 'waste' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Est. Cost ($)</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={form.estimatedCost}
                      onChange={e => set('estimatedCost', e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Reason</label>
                    <select value={form.reason} onChange={e => set('reason', e.target.value)}
                      className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
                      {['Expired','Overproduction','Dropped','Contaminated','Trimming/Prep','Temperature Abuse','Other'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {(type === 'issue' || type === 'maintenance' || type === 'manager') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Priority</label>
                    <select value={form.priority} onChange={e => set('priority', e.target.value)}
                      className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Department</label>
                    <select value={form.department} onChange={e => set('department', e.target.value)}
                      className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
                      <option value="BOH">BOH</option>
                      <option value="FOH">FOH</option>
                      <option value="Bar">Bar</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>
              )}

              {(type === 'issue' || type === 'maintenance') && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Location / Area</label>
                  <input type="text" placeholder="e.g. Walk-in Cooler, Line 2..." value={form.location}
                    onChange={e => set('location', e.target.value)}
                    className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Notes</label>
                <textarea placeholder="Details, context, follow-up needed..." value={form.notes}
                  onChange={e => set('notes', e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}