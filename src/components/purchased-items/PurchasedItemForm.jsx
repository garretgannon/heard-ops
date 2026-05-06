import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { X } from 'lucide-react';

const PURCHASE_UNITS = ['case','each','pound','ounce','gallon','quart','pint','cup','liter','milliliter','kilogram','gram','bottle','can','bag','box','sleeve','bunch','dozen','tray','pan','keg'];
const RECIPE_UNITS = ['each','lb','oz','gal','qt','pt','cup','tbsp','tsp','liter','ml','kg','g'];
const CATEGORIES = [
  ['protein','Protein'],['produce','Produce'],['dairy','Dairy'],['dry-goods','Dry Goods'],
  ['frozen','Frozen'],['beverage','Beverage'],['alcohol','Alcohol'],['chemicals','Chemicals'],
  ['disposables','Disposables'],['smallwares','Smallwares'],['paper','Paper/Packaging'],
  ['bakery','Bakery'],['seafood','Seafood'],['other','Other'],
];

export default function PurchasedItemForm({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    itemName: '', vendorName: '', vendorItemNumber: '', category: '',
    subcategory: '', brand: '', purchaseUnit: '', packSize: '',
    caseQuantity: '', innerPackQuantity: '', itemSize: '', itemUnit: '',
    caseCost: '', unitCost: '', recipeUnit: '', inventoryUnit: '',
    conversionFactor: '', edibleYieldPercent: 100, trimWastePercent: 0,
    storageArea: '', station: '', parLevel: '', reorderPoint: '',
    countFrequency: '', taxable: false, active: true, notes: '',
    ...item,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcCostPerRecipeUnit = (updated) => {
    const f = { ...form, ...updated };
    const caseCost = parseFloat(f.caseCost);
    const caseQty = parseFloat(f.caseQuantity);
    const conv = parseFloat(f.conversionFactor);
    let unitCost = parseFloat(f.unitCost);
    if (!isNaN(caseCost) && !isNaN(caseQty) && caseQty > 0) {
      unitCost = caseCost / caseQty;
    }
    if (!isNaN(unitCost) && !isNaN(conv) && conv > 0) {
      return { ...updated, unitCost: unitCost.toFixed(4), costPerRecipeUnit: (unitCost / conv).toFixed(6) };
    }
    return updated;
  };

  const handleChange = (k, v) => {
    const update = calcCostPerRecipeUnit({ [k]: v });
    setForm(p => ({ ...p, ...update }));
  };

  const save = async () => {
    if (!form.itemName.trim()) return;
    setSaving(true);
    const payload = { ...form };
    ['caseQuantity','innerPackQuantity','itemSize','caseCost','unitCost','conversionFactor',
     'costPerRecipeUnit','edibleYieldPercent','trimWastePercent','parLevel','reorderPoint'].forEach(k => {
      if (payload[k] !== '' && payload[k] !== undefined) payload[k] = parseFloat(payload[k]) || 0;
    });
    payload.normalizedName = form.itemName.toLowerCase().trim();

    if (item?.id) {
      if (item.caseCost !== payload.caseCost || item.unitCost !== payload.unitCost) {
        const changePercent = item.caseCost && payload.caseCost
          ? ((payload.caseCost - item.caseCost) / item.caseCost * 100).toFixed(1)
          : 0;
        await base44.entities.PurchasedItemPriceHistory.create({
          purchasedItemId: item.id,
          vendorName: payload.vendorName,
          oldCaseCost: item.caseCost,
          newCaseCost: payload.caseCost,
          oldUnitCost: item.unitCost,
          newUnitCost: payload.unitCost,
          changePercent,
          source: 'manual',
          changedAt: new Date().toISOString(),
        }).catch(() => {});
        payload.lastPriceUpdate = new Date().toISOString();
      }
      await base44.entities.PurchasedItem.update(item.id, payload);
    } else {
      payload.lastPriceUpdate = new Date().toISOString();
      await base44.entities.PurchasedItem.create(payload);
    }
    haptics.success();
    setSaving(false);
    onSave?.();
  };

  const F = ({ label, field, type = 'text', placeholder = '' }) => (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        onChange={e => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <h2 className="flex-1 text-sm font-extrabold text-foreground">{item ? 'Edit Purchased Item' : 'New Purchased Item'}</h2>
        <button onClick={save} disabled={saving} className="btn-primary text-xs px-4 h-8">{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-10">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Basic Info</p>
          <div className="space-y-2">
            <input value={form.itemName} onChange={e => set('itemName', e.target.value)} placeholder="Item name *" className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground font-bold" />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.category} onChange={e => set('category', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="">Category</option>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input value={form.subcategory} onChange={e => set('subcategory', e.target.value)} placeholder="Subcategory" className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Brand" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Vendor</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.vendorName} onChange={e => set('vendorName', e.target.value)} placeholder="Vendor name" className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            <input value={form.vendorItemNumber} onChange={e => set('vendorItemNumber', e.target.value)} placeholder="Vendor item #" className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Purchasing Info</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Purchase Unit</label>
              <select value={form.purchaseUnit} onChange={e => set('purchaseUnit', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="">Select</option>
                {PURCHASE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <F label="Pack Size" field="packSize" placeholder="e.g. 40 lb" />
            <F label="Case Quantity" field="caseQuantity" type="number" placeholder="e.g. 40" />
            <F label="Inner Pack Qty" field="innerPackQuantity" type="number" />
            <F label="Item Size" field="itemSize" type="number" />
            <F label="Item Unit" field="itemUnit" placeholder="e.g. lb, oz" />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Costs</p>
          <div className="grid grid-cols-2 gap-2">
            <F label="Case Cost ($)" field="caseCost" type="number" placeholder="0.00" />
            <F label="Unit Cost ($)" field="unitCost" type="number" placeholder="Auto-calculated" />
          </div>
          {form.costPerRecipeUnit && (
            <div className="mt-2 p-2 bg-primary/10 rounded-lg">
              <p className="text-xs font-bold text-primary">Cost / recipe unit: ${Number(form.costPerRecipeUnit).toFixed(4)} / {form.recipeUnit || '?'}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Recipe Costing</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Recipe Unit</label>
              <select value={form.recipeUnit} onChange={e => handleChange('recipeUnit', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="">Select</option>
                {RECIPE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <F label="Conversion Factor" field="conversionFactor" type="number" placeholder="Units per recipe unit" />
            <F label="Edible Yield %" field="edibleYieldPercent" type="number" placeholder="100" />
            <F label="Trim/Waste %" field="trimWastePercent" type="number" placeholder="0" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Conversion: how many recipe units per purchase unit (e.g. 1 lb case item converted to oz = 16)</p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Inventory and Storage</p>
          <div className="grid grid-cols-2 gap-2">
            <F label="Storage Area" field="storageArea" placeholder="Walk-in, dry storage…" />
            <F label="Station" field="station" />
            <F label="Par Level" field="parLevel" type="number" />
            <F label="Reorder Point" field="reorderPoint" type="number" />
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Count Frequency</label>
              <select value={form.countFrequency} onChange={e => set('countFrequency', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="">Select</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={form.active !== false} onChange={e => set('active', e.target.checked)} className="rounded" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={!!form.taxable} onChange={e => set('taxable', e.target.checked)} className="rounded" />
              Taxable
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}