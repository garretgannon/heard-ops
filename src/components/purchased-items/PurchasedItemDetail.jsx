import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { X, Edit2, Archive, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

const CATEGORY_LABELS = {
  protein: 'Protein', produce: 'Produce', dairy: 'Dairy',
  'dry-goods': 'Dry Goods', frozen: 'Frozen', beverage: 'Beverage',
  alcohol: 'Alcohol', chemicals: 'Chemicals', disposables: 'Disposables',
  smallwares: 'Smallwares', paper: 'Paper/Pkg', bakery: 'Bakery',
  seafood: 'Seafood', other: 'Other',
};

function SectionBlock({ title, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export default function PurchasedItemDetail({ item, isAdmin, onClose, onEdit, onSave }) {
  const [priceHistory, setPriceHistory] = useState([]);
  const [linkedRecipes, setLinkedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.PurchasedItemPriceHistory.filter({ purchasedItemId: item.id }, '-changedAt', 20).catch(() => []),
      base44.entities.RecipeIngredient.filter({ purchasedItemId: item.id }, '-created_date', 50).catch(() => []),
    ]).then(([history, ingredients]) => {
      setPriceHistory(history.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0)));
      // Get unique recipe IDs from ingredients
      const recipeIds = [...new Set(ingredients.map(i => i.recipeId).filter(Boolean))];
      if (recipeIds.length > 0) {
        Promise.all(recipeIds.slice(0, 10).map(id => base44.entities.Recipe.get(id).catch(() => null)))
          .then(recipes => setLinkedRecipes(recipes.filter(Boolean)));
      }
      setLoading(false);
    });
  }, [item.id]);

  const handleArchive = async () => {
    await base44.entities.PurchasedItem.update(item.id, { active: item.active !== false ? false : true });
    haptics.success();
    onSave?.();
  };

  const hasConversion = item.recipeUnit && item.conversionFactor;
  const costDisplay = item.costPerRecipeUnit
    ? `$${Number(item.costPerRecipeUnit).toFixed(4)} / ${item.recipeUnit}`
    : null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => { haptics.light?.(); onClose?.(); }} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-extrabold text-foreground truncate">{item.itemName}</h1>
          <p className="text-[10px] text-muted-foreground capitalize">
            {CATEGORY_LABELS[item.category] || item.category || 'Uncategorized'}
            {item.vendorName ? ` · ${item.vendorName}` : ''}
          </p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.active !== false ? 'bg-green-500/20 text-green-300' : 'bg-muted text-muted-foreground'}`}>
          {item.active !== false ? 'Active' : 'Archived'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4 py-4 space-y-1">
        {/* Cost summary banner */}
        {isAdmin && (
          <div className={`rounded-xl p-3 mb-3 ${hasConversion && costDisplay ? 'bg-primary/10 border border-primary/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            {costDisplay ? (
              <div>
                <p className="text-xs font-bold text-primary">{costDisplay}</p>
                {item.caseCost && <p className="text-[10px] text-muted-foreground mt-0.5">Case: ${Number(item.caseCost).toFixed(2)}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <p className="text-xs font-bold text-amber-400">
                  {!item.unitCost && !item.caseCost ? 'Missing cost — add case cost to calculate recipe costing.' : 'Conversion needed — add recipe unit and conversion factor.'}
                </p>
              </div>
            )}
          </div>
        )}

        <SectionBlock title="Item Summary">
          <div className="bg-muted/20 border border-border rounded-xl px-3 py-1">
            <InfoRow label="Item Name" value={item.itemName} />
            <InfoRow label="Category" value={CATEGORY_LABELS[item.category] || item.category} />
            <InfoRow label="Subcategory" value={item.subcategory} />
            <InfoRow label="Brand" value={item.brand} />
            <InfoRow label="Vendor" value={item.vendorName} />
            <InfoRow label="Vendor Item #" value={item.vendorItemNumber} />
          </div>
        </SectionBlock>

        <SectionBlock title="Purchasing Info">
          <div className="bg-muted/20 border border-border rounded-xl px-3 py-1">
            <InfoRow label="Purchase Unit" value={item.purchaseUnit} />
            <InfoRow label="Pack Size" value={item.packSize} />
            <InfoRow label="Case Quantity" value={item.caseQuantity} />
            <InfoRow label="Inner Pack Qty" value={item.innerPackQuantity} />
            <InfoRow label="Item Size" value={item.itemSize ? `${item.itemSize} ${item.itemUnit || ''}` : null} />
            {isAdmin && <InfoRow label="Case Cost" value={item.caseCost ? `$${Number(item.caseCost).toFixed(2)}` : null} highlight />}
            {isAdmin && <InfoRow label="Unit Cost" value={item.unitCost ? `$${Number(item.unitCost).toFixed(4)}` : null} highlight />}
            <InfoRow label="Last Price Update" value={item.lastPriceUpdate ? new Date(item.lastPriceUpdate).toLocaleDateString() : null} />
          </div>
        </SectionBlock>

        {isAdmin && (
          <SectionBlock title="Recipe Costing">
            <div className="bg-muted/20 border border-border rounded-xl px-3 py-1">
              <InfoRow label="Recipe Unit" value={item.recipeUnit} />
              <InfoRow label="Conversion Factor" value={item.conversionFactor} />
              <InfoRow label="Cost / Recipe Unit" value={costDisplay} highlight />
              <InfoRow label="Edible Yield" value={item.edibleYieldPercent ? `${item.edibleYieldPercent}%` : null} />
              <InfoRow label="Trim / Waste" value={item.trimWastePercent ? `${item.trimWastePercent}%` : null} />
              {!hasConversion && (
                <div className="flex items-center gap-1.5 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400 font-bold">Conversion needed for recipe costing</p>
                </div>
              )}
            </div>
          </SectionBlock>
        )}

        <SectionBlock title="Inventory & Storage">
          <div className="bg-muted/20 border border-border rounded-xl px-3 py-1">
            <InfoRow label="Inventory Unit" value={item.inventoryUnit} />
            <InfoRow label="Storage Area" value={item.storageArea} />
            <InfoRow label="Station" value={item.station} />
            <InfoRow label="Par Level" value={item.parLevel} />
            <InfoRow label="Reorder Point" value={item.reorderPoint} />
            <InfoRow label="Count Frequency" value={item.countFrequency} />
          </div>
        </SectionBlock>

        {/* Linked Recipes */}
        {!loading && linkedRecipes.length > 0 && (
          <SectionBlock title={`Linked Recipes (${linkedRecipes.length})`}>
            <div className="space-y-1.5">
              {linkedRecipes.map(r => (
                <div key={r.id} className="flex items-center gap-2 bg-muted/20 border border-border rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-foreground flex-1">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{r.category}</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Price History */}
        {isAdmin && !loading && priceHistory.length > 0 && (
          <SectionBlock title="Price History">
            <div className="space-y-1.5">
              {priceHistory.slice(0, 10).map((h, i) => {
                const pct = h.changePercent ? parseFloat(h.changePercent) : 0;
                const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
                const color = pct > 0 ? 'text-red-400' : pct < 0 ? 'text-green-400' : 'text-muted-foreground';
                return (
                  <div key={i} className="flex items-center gap-2 bg-muted/20 border border-border rounded-lg px-3 py-2">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">
                        ${h.oldCaseCost?.toFixed(2)} → ${h.newCaseCost?.toFixed(2)}
                        {pct !== 0 && <span className={`ml-1 ${color}`}>{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{h.source} · {h.changedAt ? new Date(h.changedAt).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionBlock>
        )}

        {item.notes && (
          <SectionBlock title="Notes">
            <p className="text-sm text-muted-foreground bg-muted/20 rounded-xl p-3">{item.notes}</p>
          </SectionBlock>
        )}
      </div>

      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
          <button onClick={() => onEdit(item)} className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 h-10">
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={handleArchive} className="btn-secondary text-xs flex items-center justify-center gap-1 h-10 px-3">
            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}