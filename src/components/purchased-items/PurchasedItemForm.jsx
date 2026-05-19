import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { X, Package, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PURCHASE_UNITS = ['case','each','pound','ounce','gallon','quart','pint','cup','liter','milliliter','kilogram','gram','bottle','can','bag','box','sleeve','bunch','dozen','tray','pan','keg'];
const RECIPE_UNITS = ['each','lb','oz','gal','qt','pt','cup','tbsp','tsp','liter','ml','kg','g'];
const CATEGORIES = [
  ['protein','Protein'],['produce','Produce'],['dairy','Dairy'],['dry-goods','Dry Goods'],
  ['frozen','Frozen'],['beverage','Beverage'],['alcohol','Alcohol'],['chemicals','Chemicals'],
  ['disposables','Disposables'],['smallwares','Smallwares'],['paper','Paper/Packaging'],
  ['bakery','Bakery'],['seafood','Seafood'],['other','Other'],
];

const FIELD_CLASS = 'w-full px-3 py-2.5 bg-background border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors';
const LABEL_CLASS = 'block text-xs font-semibold text-foreground/80 mb-1.5';
const SECTION_TITLE_CLASS = 'text-sm font-black tracking-tight text-foreground mb-4';

function SectionCard({ title, children, helper }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-5 space-y-4">
      <div>
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
        {helper && <p className="text-xs text-muted-foreground -mt-2 mb-3 leading-relaxed">{helper}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function buildPackSentence(form) {
  const unit = form.purchaseUnit || 'case';
  const caseQty = parseFloat(form.caseQuantity);
  const innerQty = parseFloat(form.innerPackQuantity);
  const itemSz = parseFloat(form.itemSize);
  const itemUt = form.itemUnit;
  if (isNaN(caseQty) || caseQty <= 0) return null;
  if (!isNaN(innerQty) && innerQty > 0 && !isNaN(itemSz) && itemSz > 0 && itemUt) {
    const total = caseQty * innerQty * itemSz;
    return `1 ${unit} = ${caseQty} × ${innerQty} ${itemUt} = ${total % 1 === 0 ? total : total.toFixed(2)} ${itemUt} total`;
  }
  if (!isNaN(itemSz) && itemSz > 0 && itemUt) {
    const total = caseQty * itemSz;
    return `1 ${unit} = ${caseQty} × ${itemSz} ${itemUt} = ${total % 1 === 0 ? total : total.toFixed(2)} ${itemUt} total`;
  }
  if (caseQty > 0) {
    return `1 ${unit} = ${caseQty} unit${caseQty !== 1 ? 's' : ''}`;
  }
  return null;
}

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
  const [linkedRecipes, setLinkedRecipes] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [areas, setAreas] = useState([]);
  const [stationsList, setStationsList] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Area.list('name', 100).catch(() => []),
      base44.entities.Station.list('name', 100).catch(() => []),
    ]).then(([a, s]) => {
      setAreas(a.filter(x => x.name));
      setStationsList(s.filter(x => x.name && x.isActive !== false));
    });
  }, []);

  useEffect(() => {
    if (!item?.id) return;
    setLoadingLinks(true);
    base44.entities.RecipeIngredient.filter({ purchasedItemId: item.id }, '-created_date', 50)
      .catch(() => [])
      .then(ingredients => {
        const ids = [...new Set(ingredients.map(i => i.recipeId).filter(Boolean))];
        if (ids.length === 0) { setLoadingLinks(false); return; }
        Promise.all(ids.slice(0, 8).map(id => base44.entities.Recipe.get(id).catch(() => null)))
          .then(recipes => { setLinkedRecipes(recipes.filter(Boolean)); setLoadingLinks(false); });
      });
  }, [item?.id]);

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
    if (!isNaN(caseCost) && !isNaN(caseQty) && caseQty > 0) {
      return { ...updated, unitCost: (caseCost / caseQty).toFixed(4) };
    }
    return updated;
  };

  const handleChange = (k, v) => {
    const update = calcCostPerRecipeUnit({ [k]: v });
    setForm(p => ({ ...p, ...update }));
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.itemName.trim()) { setNameError(true); toast.error('Item name is required'); return; }
    setNameError(false);
    setSaving(true);
    try {
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
      onSave?.();
    } catch (err) {
      console.error('Failed to save item:', err);
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const packSentence = buildPackSentence(form);
  const unitCostNum = parseFloat(form.unitCost);
  const caseCostNum = parseFloat(form.caseCost);
  const caseQtyNum = parseFloat(form.caseQuantity);
  const derivedUnitCost = !isNaN(caseCostNum) && !isNaN(caseQtyNum) && caseQtyNum > 0
    ? caseCostNum / caseQtyNum
    : unitCostNum;
  const costPerRecipeUnitNum = parseFloat(form.costPerRecipeUnit);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/40 px-4 lg:px-8 py-3 flex items-center gap-3"
        style={{ background: 'rgba(5,8,14,0.97)', backdropFilter: 'blur(12px)' }}>
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors shrink-0">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-foreground">
            {item?.id ? 'Edit Item' : 'New Inventory Item'}
          </h2>
          {form.itemName && <p className="text-[11px] text-muted-foreground truncate">{form.itemName}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors hidden sm:flex items-center">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="h-8 px-4 rounded-lg bg-primary text-white text-xs font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {saving ? 'Saving…' : item?.id ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 space-y-5 lg:space-y-0">

            {/* ── LEFT: main form ─────────────────────────────────── */}
            <div className="space-y-4 min-w-0">

              {/* 1. Basic Info */}
              <SectionCard title="Basic Info">
                <Field label="Item Name" required>
                  <input
                    value={form.itemName}
                    onChange={e => { set('itemName', e.target.value); if (nameError) setNameError(false); }}
                    placeholder="e.g. Roma Tomatoes, Chicken Breast"
                    className={cn(FIELD_CLASS, nameError && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20')}
                  />
                  {nameError && <p className="text-xs text-red-400 mt-1">Item name is required.</p>}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={FIELD_CLASS}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Subcategory">
                    <input value={form.subcategory} onChange={e => set('subcategory', e.target.value)} placeholder="e.g. Fresh, Canned" className={FIELD_CLASS} />
                  </Field>
                </div>
                <Field label="Brand">
                  <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Brand or supplier name" className={FIELD_CLASS} />
                </Field>
              </SectionCard>

              {/* 2. Vendor / Purchasing */}
              <SectionCard title="Vendor & Purchasing">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vendor Name">
                    <input value={form.vendorName} onChange={e => set('vendorName', e.target.value)} placeholder="e.g. Sysco, US Foods" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Vendor Item #">
                    <input value={form.vendorItemNumber} onChange={e => set('vendorItemNumber', e.target.value)} placeholder="Supplier SKU" className={FIELD_CLASS} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Purchase Unit">
                    <select value={form.purchaseUnit} onChange={e => set('purchaseUnit', e.target.value)} className={FIELD_CLASS}>
                      <option value="">Select unit</option>
                      {PURCHASE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Pack Size">
                    <input value={form.packSize} onChange={e => set('packSize', e.target.value)} placeholder="e.g. 40 lb, 4×5 lb" className={FIELD_CLASS} />
                  </Field>
                </div>
              </SectionCard>

              {/* 3. Pack Breakdown */}
              <SectionCard
                title="Pack Breakdown"
                helper="Describe how the item is purchased and broken down. Used to calculate accurate unit costs."
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Case Quantity">
                    <input type="number" value={form.caseQuantity} onChange={e => handleChange('caseQuantity', e.target.value)} placeholder="e.g. 4" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Inner Pack Qty">
                    <input type="number" value={form.innerPackQuantity} onChange={e => handleChange('innerPackQuantity', e.target.value)} placeholder="e.g. 5" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Item Size">
                    <input type="number" value={form.itemSize} onChange={e => handleChange('itemSize', e.target.value)} placeholder="e.g. 5" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Item Unit">
                    <input value={form.itemUnit} onChange={e => handleChange('itemUnit', e.target.value)} placeholder="e.g. lb, oz, each" className={FIELD_CLASS} />
                  </Field>
                </div>

                {packSentence && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs font-semibold text-foreground">{packSentence}</p>
                  </div>
                )}
              </SectionCard>

              {/* 4. Costs */}
              <SectionCard title="Costs">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Case Cost ($)">
                    <input type="number" value={form.caseCost} onChange={e => handleChange('caseCost', e.target.value)} placeholder="0.00" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Unit Cost ($)">
                    <input
                      type="number"
                      value={form.unitCost}
                      onChange={e => handleChange('unitCost', e.target.value)}
                      placeholder="Auto-calculated"
                      className={cn(FIELD_CLASS, !isNaN(caseCostNum) && !isNaN(caseQtyNum) && caseQtyNum > 0 && 'text-muted-foreground/60')}
                    />
                    {!isNaN(caseCostNum) && !isNaN(caseQtyNum) && caseQtyNum > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">Calculated from case cost ÷ quantity</p>
                    )}
                  </Field>
                </div>

                {!isNaN(derivedUnitCost) && derivedUnitCost > 0 && (
                  <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(230,106,31,0.07)' }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Estimated Unit Cost</p>
                      <p className="text-xl font-black text-primary mt-0.5">
                        ${derivedUnitCost.toFixed(4)}
                        {form.itemUnit && <span className="text-sm font-semibold text-muted-foreground"> / {form.itemUnit}</span>}
                      </p>
                    </div>
                    {!isNaN(caseCostNum) && caseCostNum > 0 && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Case cost</p>
                        <p className="text-sm font-black text-foreground">${caseCostNum.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}

                {!isNaN(costPerRecipeUnitNum) && costPerRecipeUnitNum > 0 && (
                  <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2">
                    <p className="text-xs font-bold text-foreground">
                      Recipe cost: <span className="text-primary">${costPerRecipeUnitNum.toFixed(4)}</span>
                      {form.recipeUnit && <span className="text-muted-foreground font-normal"> / {form.recipeUnit}</span>}
                    </p>
                  </div>
                )}
              </SectionCard>

              {/* 5. Recipe Costing */}
              <SectionCard title="Recipe Costing">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Recipe Unit">
                    <select value={form.recipeUnit} onChange={e => handleChange('recipeUnit', e.target.value)} className={FIELD_CLASS}>
                      <option value="">Select unit</option>
                      {RECIPE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Conversion Factor">
                    <input type="number" value={form.conversionFactor} onChange={e => handleChange('conversionFactor', e.target.value)} placeholder="e.g. 16 (lb → oz)" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Edible Yield %">
                    <input type="number" value={form.edibleYieldPercent} onChange={e => handleChange('edibleYieldPercent', e.target.value)} placeholder="100" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Trim / Waste %">
                    <input type="number" value={form.trimWastePercent} onChange={e => handleChange('trimWastePercent', e.target.value)} placeholder="0" className={FIELD_CLASS} />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conversion factor: how many recipe units per purchase unit.
                  Example: 1 lb purchased → 16 oz in recipe = factor of 16.
                </p>
              </SectionCard>

              {/* 6. Inventory & Storage */}
              <SectionCard title="Inventory & Storage">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Storage Area">
                    <select value={form.storageArea} onChange={e => set('storageArea', e.target.value)} className={FIELD_CLASS}>
                      <option value="">Select area</option>
                      {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                      {form.storageArea && !areas.find(a => a.name === form.storageArea) && (
                        <option value={form.storageArea}>{form.storageArea}</option>
                      )}
                    </select>
                  </Field>
                  <Field label="Station">
                    <select value={form.station} onChange={e => set('station', e.target.value)} className={FIELD_CLASS}>
                      <option value="">Select station</option>
                      {stationsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      {form.station && !stationsList.find(s => s.name === form.station) && (
                        <option value={form.station}>{form.station}</option>
                      )}
                    </select>
                  </Field>
                  <Field label="Par Level">
                    <input type="number" value={form.parLevel} onChange={e => set('parLevel', e.target.value)} placeholder="Minimum stock" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Reorder Point">
                    <input type="number" value={form.reorderPoint} onChange={e => set('reorderPoint', e.target.value)} placeholder="Order trigger level" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Inventory Unit">
                    <input value={form.inventoryUnit} onChange={e => set('inventoryUnit', e.target.value)} placeholder="e.g. lb, each" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Count Frequency">
                    <select value={form.countFrequency} onChange={e => set('countFrequency', e.target.value)} className={FIELD_CLASS}>
                      <option value="">Select</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </Field>
                </div>
              </SectionCard>

              {/* 7. Notes & flags */}
              <SectionCard title="Notes & Settings">
                <Field label="Notes">
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Handling notes, substitutions, allergens…"
                    rows={3}
                    className={cn(FIELD_CLASS, 'resize-none')}
                  />
                </Field>
                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.active !== false}
                      onChange={e => set('active', e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm font-semibold text-foreground">Active</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={!!form.taxable}
                      onChange={e => set('taxable', e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm font-semibold text-foreground">Taxable</span>
                  </label>
                </div>
              </SectionCard>

              {/* Mobile save button */}
              <div className="lg:hidden pt-2 pb-8">
                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full h-11 rounded-xl bg-primary text-white text-sm font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving…' : item?.id ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </div>

            {/* ── RIGHT: sticky sidebar ────────────────────────────── */}
            <div className="hidden lg:block space-y-4">
              <div className="sticky top-6 space-y-4">

                {/* Item Preview */}
                <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/30">
                    <h3 className="text-xs font-black text-foreground">Item Preview</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Live summary of entered values</p>
                  </div>
                  <div className="divide-y divide-border/20">
                    {[
                      { label: 'Name', value: form.itemName },
                      { label: 'Category', value: CATEGORIES.find(([v]) => v === form.category)?.[1] },
                      { label: 'Brand', value: form.brand },
                      { label: 'Vendor', value: form.vendorName },
                      { label: 'Purchase Unit', value: form.purchaseUnit },
                      { label: 'Pack Size', value: form.packSize },
                      { label: 'Case Cost', value: caseCostNum > 0 ? `$${caseCostNum.toFixed(2)}` : null },
                      { label: 'Unit Cost', value: !isNaN(derivedUnitCost) && derivedUnitCost > 0 ? `$${derivedUnitCost.toFixed(4)}${form.itemUnit ? ' / ' + form.itemUnit : ''}` : null, highlight: true },
                    ].map(({ label, value, highlight }) => value ? (
                      <div key={label} className="flex items-center justify-between px-4 py-2">
                        <span className="text-[11px] text-muted-foreground">{label}</span>
                        <span className={cn('text-[11px] font-bold truncate max-w-[140px] text-right', highlight ? 'text-primary' : 'text-foreground')}>
                          {value}
                        </span>
                      </div>
                    ) : null)}
                    {!form.itemName && (
                      <p className="px-4 py-4 text-xs text-muted-foreground/60 text-center">Fill in details to see preview</p>
                    )}
                  </div>
                </div>

                {/* Costing Helper */}
                <div className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3">
                  <h3 className="text-xs font-black text-foreground">Costing Formula</h3>
                  <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground font-mono">Case Cost ÷ Case Qty = Unit Cost</p>
                  </div>
                  {packSentence && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-foreground leading-relaxed">{packSentence}</p>
                    </div>
                  )}
                  {!isNaN(derivedUnitCost) && derivedUnitCost > 0 && (
                    <div className="text-center pt-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Est. Unit Cost</p>
                      <p className="text-lg font-black text-primary">${derivedUnitCost.toFixed(4)}{form.itemUnit ? <span className="text-xs text-muted-foreground font-normal"> / {form.itemUnit}</span> : ''}</p>
                    </div>
                  )}
                </div>

                {/* Connected Usage — edit mode only */}
                <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/30">
                    <h3 className="text-xs font-black text-foreground">Connected Usage</h3>
                  </div>
                  {!item?.id ? (
                    <p className="px-4 py-4 text-[11px] text-muted-foreground leading-relaxed">
                      Usage connections will appear here once this item is linked to recipes or prep templates.
                    </p>
                  ) : loadingLinks ? (
                    <div className="px-4 py-4 space-y-2">
                      {[1,2].map(i => <div key={i} className="h-4 skeleton rounded" />)}
                    </div>
                  ) : linkedRecipes.length > 0 ? (
                    <div className="divide-y divide-border/20">
                      <div className="px-4 py-2 flex items-center gap-2">
                        <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recipes ({linkedRecipes.length})</span>
                      </div>
                      {linkedRecipes.map(r => (
                        <div key={r.id} className="px-4 py-2.5">
                          <p className="text-xs font-semibold text-foreground truncate">{r.name || r.recipeName || 'Recipe'}</p>
                          {r.category && <p className="text-[10px] text-muted-foreground capitalize">{r.category}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-4 text-[11px] text-muted-foreground leading-relaxed">
                      No recipe connections found for this item yet.
                    </p>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
