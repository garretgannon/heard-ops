import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Link2, CheckCircle2, X, ExternalLink, Package } from 'lucide-react';

const STATIC_CONVERSIONS = {
  'oz_lb': 1/16, 'lb_oz': 16,
  'tbsp_cup': 1/16, 'cup_tbsp': 16,
  'tsp_cup': 1/48, 'cup_tsp': 48,
  'tsp_tbsp': 1/3, 'tbsp_tsp': 3,
  'ml_liter': 1/1000, 'liter_ml': 1000,
  'ml_l': 1/1000, 'l_ml': 1000,
  'g_kg': 1/1000, 'kg_g': 1000,
};

function buildConversionMap(recipeUnitConversions) {
  const map = { ...STATIC_CONVERSIONS };
  if (Array.isArray(recipeUnitConversions)) {
    for (const { fromUnit, toUnit, factor } of recipeUnitConversions) {
      const f = parseFloat(factor);
      if (!fromUnit || !toUnit || !f) continue;
      const from = fromUnit.toLowerCase().trim();
      const to = toUnit.toLowerCase().trim();
      map[`${from}_${to}`] = f;
      map[`${to}_${from}`] = 1 / f;
    }
  }
  return map;
}

function computeSubRecipeCost(subIngs, subItemMap, convMap) {
  let total = 0;
  let fullyCosted = true;
  for (const ing of subIngs) {
    const item = ing.purchasedItemId ? subItemMap[ing.purchasedItemId] : null;
    if (!item || !item.costPerRecipeUnit) { fullyCosted = false; continue; }
    const qty = parseFloat(ing.quantity) || 0;
    const from = (ing.unit || '').toLowerCase().trim();
    const to = (item.recipeUnit || '').toLowerCase().trim();
    if (from === to || !from) {
      total += qty * parseFloat(item.costPerRecipeUnit);
    } else {
      const factor = convMap[`${from}_${to}`];
      if (factor) {
        total += qty * factor * parseFloat(item.costPerRecipeUnit);
      } else {
        fullyCosted = false;
      }
    }
  }
  return { total, fullyCosted };
}

function ItemBottomSheet({ item, onClose, onViewFull }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-4 pb-8 shadow-2xl max-w-lg mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-extrabold text-foreground truncate">{item.itemName}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.vendorName || 'No vendor'}{item.category ? ` · ${item.category}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 ml-2">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {item.costPerRecipeUnit && item.recipeUnit && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Cost / {item.recipeUnit}</p>
              <p className="text-sm font-extrabold text-primary">${Number(item.costPerRecipeUnit).toFixed(4)}</p>
            </div>
          )}
          {item.caseCost && (
            <div className="bg-muted/30 border border-border rounded-lg p-2">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Case Cost</p>
              <p className="text-sm font-extrabold text-foreground">${Number(item.caseCost).toFixed(2)}</p>
            </div>
          )}
          {item.unitCost && (
            <div className="bg-muted/30 border border-border rounded-lg p-2">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Unit Cost</p>
              <p className="text-sm font-extrabold text-foreground">${Number(item.unitCost).toFixed(4)}</p>
            </div>
          )}
          {item.recipeUnit && item.conversionFactor && (
            <div className="bg-muted/30 border border-border rounded-lg p-2">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Conversion</p>
              <p className="text-sm font-extrabold text-foreground">{item.conversionFactor} / {item.recipeUnit}</p>
            </div>
          )}
        </div>

        {(item.packSize || item.purchaseUnit || item.brand) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
            {item.brand && <span><span className="font-bold text-foreground">Brand:</span> {item.brand}</span>}
            {item.purchaseUnit && <span><span className="font-bold text-foreground">Unit:</span> {item.purchaseUnit}</span>}
            {item.packSize && <span><span className="font-bold text-foreground">Pack:</span> {item.packSize}</span>}
          </div>
        )}

        <button
          onClick={onViewFull}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-xs font-bold text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View Full Item
        </button>
      </div>
    </>
  );
}

export default function RecipeCosting({ recipe, ingredients, onCostCalculated }) {
  const navigate = useNavigate();
  const [purchasedItems, setPurchasedItems] = useState({});
  const [subRecipeCosts, setSubRecipeCosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const convMap = buildConversionMap(recipe.unitConversions);
    const purchasedIds = [...new Set(ingredients.map(i => i.purchasedItemId).filter(Boolean))];
    const linkedRecipeIds = [...new Set(ingredients.map(i => i.linkedRecipeId).filter(Boolean))];

    const fetchPurchasedItems = purchasedIds.length > 0
      ? Promise.all(purchasedIds.map(id => base44.entities.PurchasedItem.get(id).catch(() => null)))
      : Promise.resolve([]);

    const fetchSubRecipes = async () => {
      const costs = {};
      for (const recipeId of linkedRecipeIds) {
        try {
          const [subRecipe, subIngs] = await Promise.all([
            base44.entities.Recipe.get(recipeId),
            base44.entities.RecipeIngredient.filter({ recipeId }, 'sortOrder', 50).catch(() => []),
          ]);
          const subPurchasedIds = [...new Set(subIngs.map(i => i.purchasedItemId).filter(Boolean))];
          const subItems = subPurchasedIds.length > 0
            ? await Promise.all(subPurchasedIds.map(id => base44.entities.PurchasedItem.get(id).catch(() => null)))
            : [];
          const subItemMap = {};
          subItems.forEach(item => { if (item) subItemMap[item.id] = item; });
          const subConvMap = buildConversionMap(subRecipe.unitConversions);
          const { total, fullyCosted } = computeSubRecipeCost(subIngs, subItemMap, subConvMap);
          const yieldAmt = parseFloat(subRecipe.yieldAmount) || 1;
          costs[recipeId] = { costPerUnit: total / yieldAmt, yieldUnit: subRecipe.yieldUnit, fullyCosted };
        } catch {
          // skip if sub-recipe fetch fails
        }
      }
      return costs;
    };

    Promise.all([fetchPurchasedItems, fetchSubRecipes()]).then(([items, costs]) => {
      const map = {};
      items.forEach(item => { if (item) map[item.id] = item; });
      setPurchasedItems(map);
      setSubRecipeCosts(costs);
      setLoading(false);

      if (onCostCalculated) {
        const cMap = buildConversionMap(recipe.unitConversions);
        let total = 0;
        for (const ing of ingredients.filter(i => !i._deleted)) {
          if (ing.linkedRecipeId) {
            const sub = costs[ing.linkedRecipeId];
            if (sub) total += (parseFloat(ing.quantity) || 0) * sub.costPerUnit;
            continue;
          }
          const item = ing.purchasedItemId ? map[ing.purchasedItemId] : null;
          if (!item?.costPerRecipeUnit) continue;
          const qty = parseFloat(ing.quantity) || 0;
          const from = (ing.unit || '').toLowerCase().trim();
          const to = (item.recipeUnit || '').toLowerCase().trim();
          if (from === to || !from) { total += qty * parseFloat(item.costPerRecipeUnit); }
          else { const f = cMap[`${from}_${to}`]; if (f) total += qty * f * parseFloat(item.costPerRecipeUnit); }
        }
        onCostCalculated(total > 0 ? total : null);
      }
    });
  }, [ingredients]);

  if (loading) return null;

  const convMap = buildConversionMap(recipe.unitConversions);

  const rows = ingredients.filter(i => !i._deleted).map(ing => {
    const qty = parseFloat(ing.quantity) || 0;

    if (ing.linkedRecipeId) {
      const sub = subRecipeCosts[ing.linkedRecipeId];
      if (!sub) return { ...ing, lineCost: null, status: 'unlinked', isSubRecipe: true };
      return { ...ing, lineCost: qty * sub.costPerUnit, status: sub.fullyCosted ? 'ok' : 'partial', isSubRecipe: true };
    }

    const item = ing.purchasedItemId ? purchasedItems[ing.purchasedItemId] : null;
    if (!item) return { ...ing, item: null, lineCost: null, status: 'unlinked' };
    if (!item.costPerRecipeUnit || !item.recipeUnit) return { ...ing, item, lineCost: null, status: 'no-conversion' };

    const from = (ing.unit || '').toLowerCase().trim();
    const to = (item.recipeUnit || '').toLowerCase().trim();
    if (from === to || !from) {
      return { ...ing, item, lineCost: qty * parseFloat(item.costPerRecipeUnit), status: 'ok' };
    }
    const factor = convMap[`${from}_${to}`];
    if (factor) {
      return { ...ing, item, lineCost: qty * factor * parseFloat(item.costPerRecipeUnit), status: 'ok' };
    }
    return { ...ing, item, lineCost: null, status: 'unit-mismatch' };
  });

  const linkedRows = rows.filter(r => (r.status === 'ok' || r.status === 'partial') && r.lineCost !== null);
  const totalCost = linkedRows.reduce((sum, r) => sum + r.lineCost, 0);
  const unlinkedCount = rows.filter(r => r.status === 'unlinked').length;
  const missingConvCount = rows.filter(r => r.status === 'no-conversion' || r.status === 'unit-mismatch').length;
  const hasPartialCosting = linkedRows.length > 0 && (unlinkedCount > 0 || missingConvCount > 0);
  const hasFullCosting = linkedRows.length > 0 && unlinkedCount === 0 && missingConvCount === 0;

  const yieldAmt = parseFloat(recipe.yieldAmount) || 0;
  const portionNum = parseFloat(recipe.portionSize) || 0;
  const costPerYield = yieldAmt > 0 ? totalCost / yieldAmt : null;
  const portions = portionNum > 0 && yieldAmt > 0 ? yieldAmt / portionNum : null;
  const costPerPortion = portions ? totalCost / portions : null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Recipe Costing</p>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Manager Only</span>
      </div>

      {rows.length === 0 || (unlinkedCount === rows.length) ? (
        <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">No ingredients linked to Purchased Items or sub-recipes. Edit this recipe and link ingredients to calculate cost.</p>
        </div>
      ) : hasPartialCosting ? (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">Partial costing — {unlinkedCount + missingConvCount} ingredient{unlinkedCount + missingConvCount !== 1 ? 's' : ''} missing link or conversion. Costs are estimates only.</p>
        </div>
      ) : hasFullCosting ? (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-3">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <p className="text-xs text-green-400">Full costing — all ingredients linked and converted.</p>
        </div>
      ) : null}

      {totalCost > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-center">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Total Cost</p>
            <p className="text-sm font-extrabold text-primary">${totalCost.toFixed(2)}</p>
          </div>
          {costPerYield && (
            <div className="bg-muted/30 border border-border rounded-lg p-2 text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Cost / {recipe.yieldUnit || 'Yield'}</p>
              <p className="text-sm font-extrabold text-foreground">${costPerYield.toFixed(4)}</p>
            </div>
          )}
          {costPerPortion && (
            <div className="bg-muted/30 border border-border rounded-lg p-2 text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Cost / Portion</p>
              <p className="text-sm font-extrabold text-foreground">${costPerPortion.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] bg-muted/40 px-3 py-1.5 gap-2">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Ingredient</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase text-right w-12">Qty</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase w-10">Unit</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase text-right w-16">Cost</span>
        </div>
        {rows.map((row, i) => {
          const isLinkedToPurchased = !!row.purchasedItemId && row.item;
          const isLinkedToRecipe = !!row.isSubRecipe;
          const displayName = row.ingredientName || row.linkedLabel || row.item?.itemName || '—';
          return (
            <div key={row.id || i} className={`grid grid-cols-[1fr_auto_auto_auto] px-3 py-2 gap-2 items-center border-t border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
              <div className="min-w-0">
                {isLinkedToPurchased ? (
                  <button
                    onClick={() => setSelectedItem(row.item)}
                    className="flex items-center gap-1 text-left hover:text-primary transition-colors group w-full min-w-0"
                  >
                    <Link2 className="h-3 w-3 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary truncate transition-colors">{displayName}</span>
                  </button>
                ) : isLinkedToRecipe ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <Link2 className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">{displayName}</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-foreground truncate block">{displayName}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground text-right w-12">{row.quantity}</span>
              <span className="text-xs text-muted-foreground w-10">{row.unit}</span>
              <span className="text-right w-16">
                {(row.status === 'ok' || row.status === 'partial') && row.lineCost !== null ? (
                  <span className={`text-xs font-bold ${row.status === 'partial' ? 'text-amber-400' : 'text-foreground'}`}>${row.lineCost.toFixed(2)}</span>
                ) : row.status === 'unlinked' ? (
                  <span className="text-[9px] font-bold text-muted-foreground">Unlinked</span>
                ) : row.status === 'no-conversion' ? (
                  <span className="text-[9px] font-bold text-amber-400">No conv.</span>
                ) : (
                  <span className="text-[9px] font-bold text-red-400">Unit mismatch</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <ItemBottomSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onViewFull={() => {
            setSelectedItem(null);
            navigate(`/purchased-items?id=${selectedItem.id}`);
          }}
        />
      )}
    </div>
  );
}
