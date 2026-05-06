import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, DollarSign, Link2, CheckCircle2 } from 'lucide-react';

/**
 * RecipeCosting — admin/chef-only panel shown inside RecipeDetail.
 * Loads purchasedItem records for each ingredient that has purchasedItemId,
 * calculates line costs, total recipe cost, cost per yield, cost per portion.
 */
export default function RecipeCosting({ recipe, ingredients }) {
  const [purchasedItems, setPurchasedItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = [...new Set(ingredients.map(i => i.purchasedItemId).filter(Boolean))];
    if (ids.length === 0) { setLoading(false); return; }
    Promise.all(ids.map(id => base44.entities.PurchasedItem.get(id).catch(() => null)))
      .then(items => {
        const map = {};
        items.forEach(item => { if (item) map[item.id] = item; });
        setPurchasedItems(map);
        setLoading(false);
      });
  }, [ingredients]);

  if (loading) return null;

  // Calculate costs per ingredient
  const rows = ingredients.filter(i => !i._deleted).map(ing => {
    const item = ing.purchasedItemId ? purchasedItems[ing.purchasedItemId] : null;
    const qty = parseFloat(ing.quantity) || 0;

    if (!item) {
      return { ...ing, item: null, lineCost: null, status: 'unlinked' };
    }

    if (!item.costPerRecipeUnit || !item.recipeUnit) {
      return { ...ing, item, lineCost: null, status: 'no-conversion' };
    }

    // Unit match check: recipe ingredient unit vs item.recipeUnit
    const recipeUnit = (ing.unit || '').toLowerCase().trim();
    const itemUnit = (item.recipeUnit || '').toLowerCase().trim();
    const unitsMatch = recipeUnit === itemUnit || !recipeUnit;

    if (!unitsMatch) {
      // Try to do simple unit conversion for common cases
      const conversionMap = {
        'oz_lb': 1/16, 'lb_oz': 16,
        'tbsp_cup': 1/16, 'cup_tbsp': 16,
        'tsp_cup': 1/48, 'cup_tsp': 48,
        'tsp_tbsp': 1/3, 'tbsp_tsp': 3,
        'ml_liter': 1/1000, 'liter_ml': 1000,
        'g_kg': 1/1000, 'kg_g': 1000,
      };
      const key = `${recipeUnit}_${itemUnit}`;
      const factor = conversionMap[key];
      if (factor) {
        const lineCost = qty * factor * parseFloat(item.costPerRecipeUnit);
        return { ...ing, item, lineCost, status: 'ok' };
      }
      return { ...ing, item, lineCost: null, status: 'unit-mismatch' };
    }

    const lineCost = qty * parseFloat(item.costPerRecipeUnit);
    return { ...ing, item, lineCost, status: 'ok' };
  });

  const linkedRows = rows.filter(r => r.status === 'ok' && r.lineCost !== null);
  const totalCost = linkedRows.reduce((sum, r) => sum + r.lineCost, 0);
  const unlinkedCount = rows.filter(r => r.status === 'unlinked').length;
  const missingConvCount = rows.filter(r => r.status === 'no-conversion' || r.status === 'unit-mismatch').length;
  const hasPartialCosting = linkedRows.length > 0 && (unlinkedCount > 0 || missingConvCount > 0);
  const hasFullCosting = linkedRows.length > 0 && unlinkedCount === 0 && missingConvCount === 0;

  const yieldAmt = parseFloat(recipe.yieldAmount) || 0;
  const portionStr = recipe.portionSize || '';
  const portionNum = parseFloat(portionStr) || 0;
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

      {/* Status banner */}
      {rows.length === 0 || (unlinkedCount === rows.length) ? (
        <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">No ingredients linked to Purchased Items. Edit this recipe and link ingredients to calculate cost.</p>
        </div>
      ) : hasPartialCosting ? (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">Partial costing — {unlinkedCount + missingConvCount} ingredient{unlinkedCount + missingConvCount !== 1 ? 's' : ''} missing link or conversion. Costs shown are estimates only.</p>
        </div>
      ) : hasFullCosting ? (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-3">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <p className="text-xs text-green-400">Full costing — all ingredients linked and converted.</p>
        </div>
      ) : null}

      {/* Cost totals */}
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

      {/* Per-ingredient breakdown */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] bg-muted/40 px-3 py-1.5 gap-2">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Ingredient</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase text-right w-12">Qty</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase w-10">Unit</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase text-right w-16">Cost</span>
        </div>
        {rows.map((row, i) => (
          <div key={row.id || i} className={`grid grid-cols-[1fr_auto_auto_auto] px-3 py-2 gap-2 items-center border-t border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{row.ingredientName}</p>
              {row.item && <p className="text-[9px] text-muted-foreground truncate flex items-center gap-0.5"><Link2 className="h-2.5 w-2.5" />{row.item.itemName}</p>}
            </div>
            <span className="text-xs text-muted-foreground text-right w-12">{row.quantity}</span>
            <span className="text-xs text-muted-foreground w-10">{row.unit}</span>
            <span className="text-right w-16">
              {row.status === 'ok' && row.lineCost !== null ? (
                <span className="text-xs font-bold text-foreground">${row.lineCost.toFixed(2)}</span>
              ) : row.status === 'unlinked' ? (
                <span className="text-[9px] font-bold text-muted-foreground">Unlinked</span>
              ) : row.status === 'no-conversion' ? (
                <span className="text-[9px] font-bold text-amber-400">No conv.</span>
              ) : (
                <span className="text-[9px] font-bold text-red-400">Unit mismatch</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}