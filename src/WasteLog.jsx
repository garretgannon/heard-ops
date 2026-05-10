import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { haptics } from '@/utils/haptics';
import { Trash2, Plus, X, Search, AlertTriangle, Package } from 'lucide-react';

const WASTE_REASONS = ['Expired','Overproduction','Dropped','Contaminated','Trimming/Prep','Temperature Abuse','Other'];
const WASTE_UNITS = ['oz','lb','each','cup','qt','gal','portion','case'];

function WasteEntryModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    itemName: '', purchasedItemId: '', quantity: '', unit: '', reason: '',
    notes: '', wastedBy: '', estimatedCost: '',
  });
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.PurchasedItem.filter({ active: true }, '-updated_date', 200).catch(() => []).then(setPurchasedItems);
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = purchasedItems.filter(i =>
    !search || i.itemName?.toLowerCase().includes(search.toLowerCase()) || i.vendorName?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  const selectItem = (item) => {
    setForm(p => ({
      ...p,
      itemName: item.itemName,
      purchasedItemId: item.id,
      unit: item.recipeUnit || item.inventoryUnit || '',
    }));
    setSearch('');
    recalcCost({ ...form, purchasedItemId: item.id, _item: item });
  };

  const recalcCost = (f) => {
    const item = f._item || purchasedItems.find(i => i.id === f.purchasedItemId);
    const qty = parseFloat(f.quantity || form.quantity) || 0;
    if (item && item.costPerRecipeUnit && qty > 0) {
      set('estimatedCost', (qty * parseFloat(item.costPerRecipeUnit)).toFixed(2));
    }
  };

  const handleQtyChange = (v) => {
    set('quantity', v);
    const item = purchasedItems.find(i => i.id === form.purchasedItemId);
    if (item && item.costPerRecipeUnit && v) {
      set('estimatedCost', (parseFloat(v) * parseFloat(item.costPerRecipeUnit)).toFixed(2));
    }
  };

  const save = async () => {
    if (!form.itemName || !form.quantity) return;
    setSaving(true);
    await base44.entities.WasteEntry.create({
      ...form,
      quantity: parseFloat(form.quantity) || 0,
      estimatedCost: parseFloat(form.estimatedCost) || 0,
      wasteDate: new Date().toISOString().split('T')[0],
      wasteTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }).catch(() => {});
    haptics.success();
    setSaving(false);
    onSave?.();
  };

  const linkedItem = purchasedItems.find(i => i.id === form.purchasedItemId);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <h2 className="flex-1 text-sm font-extrabold text-foreground">Log Waste</h2>
        <button onClick={save} disabled={saving || !form.itemName || !form.quantity} className="btn-primary text-xs px-4 h-8 disabled:opacity-50">
          {saving ? 'Saving…' : 'Log It'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-10">
        {/* Item search */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Item *</label>
          {form.purchasedItemId ? (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{form.itemName}</p>
                {linkedItem && <p className="text-[10px] text-muted-foreground">{linkedItem.vendorName} · ${linkedItem.costPerRecipeUnit ? `$${Number(linkedItem.costPerRecipeUnit).toFixed(4)}/${linkedItem.recipeUnit}` : 'No cost'}</p>}
              </div>
              <button onClick={() => { set('purchasedItemId', ''); set('estimatedCost', ''); }} className="text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); if (!form.purchasedItemId) set('itemName', e.target.value); }}
                  placeholder="Search purchased items or type name…"
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                />
              </div>
              {search.length > 0 && filtered.length > 0 && (
                <div className="bg-card border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {filtered.map(item => (
                    <button key={item.id} onClick={() => selectItem(item)} className="w-full text-left px-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 active:scale-[0.99] transition-all">
                      <p className="text-xs font-bold text-foreground">{item.itemName}</p>
                      <p className="text-[10px] text-muted-foreground">{item.vendorName} · {item.category}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Quantity *</label>
            <input type="number" value={form.quantity} onChange={e => handleQtyChange(e.target.value)} placeholder="0"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Unit</label>
            <select value={form.unit} onChange={e => set('unit', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Select</option>
              {WASTE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Estimated Cost */}
        {form.estimatedCost && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-xs font-bold text-primary">Estimated waste cost: <span className="text-lg">${Number(form.estimatedCost).toFixed(2)}</span></p>
          </div>
        )}
        {form.purchasedItemId && !form.estimatedCost && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs text-amber-400">Item is linked but missing cost data. Add cost in Purchased Items.</p>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Reason</label>
          <div className="flex flex-wrap gap-1.5">
            {WASTE_REASONS.map(r => (
              <button key={r} onClick={() => set('reason', r)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold transition-all ${form.reason === r ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes (optional)" rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
      </div>
    </div>
  );
}

export default function WasteLog() {
  const { isAdmin } = useCurrentUser();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.WasteEntry.list('-created_date', 100).catch(() => []);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const todayEntries = entries.filter(e => e.wasteDate === todayStr);
  const todayCost = todayEntries.reduce((s, e) => s + (parseFloat(e.estimatedCost) || 0), 0);
  const totalCost = entries.reduce((s, e) => s + (parseFloat(e.estimatedCost) || 0), 0);

  const filtered = entries.filter(e =>
    !search || e.itemName?.toLowerCase().includes(search.toLowerCase()) || e.reason?.toLowerCase().includes(search.toLowerCase())
  );

  if (showForm) return <WasteEntryModal onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />;

  return (
    <div className="pb-28">
      <div className="bg-card border-b border-border sticky top-0 z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-primary" />
            <h1 className="text-lg font-extrabold text-foreground">Waste Log</h1>
          </div>
          <button onClick={() => { setShowForm(true); haptics.medium(); }}
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Track food waste and calculate waste cost.</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search waste log…"
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Summary */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Today's Waste Cost</p>
              <p className="text-lg font-extrabold text-red-400">${todayCost.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">{todayEntries.length} entries</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Logged</p>
              <p className="text-lg font-extrabold text-foreground">${totalCost.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">{entries.length} entries</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Trash2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No waste entries yet</p>
            <button onClick={() => setShowForm(true)} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto">
              <Plus className="h-3.5 w-3.5" /> Log Waste
            </button>
          </div>
        ) : (
          filtered.map(entry => (
            <div key={entry.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{entry.itemName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.quantity} {entry.unit}
                    {entry.reason ? ` · ${entry.reason}` : ''}
                  </p>
                  {entry.wasteDate && <p className="text-[10px] text-muted-foreground mt-0.5">{entry.wasteDate}{entry.wasteTime ? ` at ${entry.wasteTime}` : ''}</p>}
                </div>
                <div className="text-right shrink-0">
                  {isAdmin && entry.estimatedCost ? (
                    <p className="text-sm font-extrabold text-red-400">${Number(entry.estimatedCost).toFixed(2)}</p>
                  ) : isAdmin && entry.purchasedItemId && !entry.estimatedCost ? (
                    <p className="text-[10px] text-amber-400 font-bold">No cost data</p>
                  ) : null}
                  {entry.purchasedItemId && (
                    <span className="text-[9px] font-bold text-primary">Linked</span>
                  )}
                </div>
              </div>
              {entry.notes && <p className="text-[10px] text-muted-foreground mt-1.5 italic">{entry.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;