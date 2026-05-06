import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';

/**
 * BuildCardCosting — admin/chef-only cost panel shown inside BuildCardDetail.
 * Loads recipe costs for linked recipes, sums with direct component costs.
 */
export default function BuildCardCosting({ card, components }) {
  const [recipeCosts, setRecipeCosts] = useState({});
  const [purchasedItems, setPurchasedItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const linkedRecipeIds = [...new Set(components.map(c => c.linkedRecipeId).filter(Boolean))];
    const linkedItemIds = [...new Set(components.map(c => c.purchasedItemId).filter(Boolean))];

    Promise.all([
      // Load recipe totalRecipeCost fields
      ...linkedRecipeIds.map(id => base44.entities.Recipe.get(id).catch(() => null)),
      // Load purchased items for direct component costs
      ...linkedItemIds.map(id => base44.entities.PurchasedItem.get(id).catch(() => null)),
    ]).then(results => {
      const recipeMap = {};
      const itemMap = {};
      results.forEach(r => {
        if (!r) return;
        if (r.yieldAmount !== undefined || r.name) {
          // It's a recipe if it has recipe-like fields
          if (linkedRecipeIds.includes(r.id)) recipeMap[r.id] = r;
          else itemMap[r.id] = r;
        }
      });
      // Separate by id type
      linkedRecipeIds.forEach((id, i) => { if (results[i]) recipeMap[id] = results[i]; });
      linkedItemIds.forEach((id, i) => { if (results[linkedRecipeIds.length + i]) itemMap[id] = results[linkedRecipeIds.length + i]; });
      setRecipeCosts(recipeMap);
      setPurchasedItems(itemMap);
      setLoading(false);
    });
  }, [components]);

  if (loading) return null;

  // Calculate component costs
  const componentRows = components.filter(c => !c._deleted).map(comp => {
    const qty = parseFloat(comp.quantity) || 0;

    // Linked recipe cost
    if (comp.linkedRecipeId) {
      const recipe = recipeCosts[comp.linkedRecipeId];
      if (!recipe) return { ...comp, lineCost: null, status: 'recipe-missing', label: comp.componentName };
      // Use totalRecipeCost if available, else null
      if (recipe.totalRecipeCost) {
        // Scale by portion if yieldAmount known
        const yieldAmt = parseFloat(recipe.yieldAmount) || 0;
        const portionCost = yieldAmt > 0 ? (recipe.totalRecipeCost / yieldAmt) * qty : null;
        return { ...comp, lineCost: portionCost, status: portionCost ? 'ok' : 'no-yield', label: comp.componentName, note: recipe.name };
      }
      return { ...comp, lineCost: null, status: 'recipe-no-cost', label: comp.componentName, note: recipe.name };
    }

    // Direct purchased item cost
    if (comp.purchasedItemId) {
      const item = purchasedItems[comp.purchasedItemId];
      if (!item || !item.costPerRecipeUnit) return { ...comp, lineCost: null, status: 'no-conversion', label: comp.componentName };
      const lineCost = qty * parseFloat(item.costPerRecipeUnit);
      return { ...comp, lineCost, status: 'ok', label: comp.componentName };
    }

    return { ...comp, lineCost: null, status: 'unlinked', label: comp.componentName };
  });

  const costedRows = componentRows.filter(r => r.lineCost !== null);
  const totalBuildCost = costedRows.reduce((sum, r) => sum + r.lineCost, 0);
  const menuPrice = parseFloat(card.menuPrice) || 0;
  const foodCostPct = menuPrice > 0 && totalBuildCost > 0 ? (totalBuildCost / menuPrice) * 100 : null;

  const uncostedCount = componentRows.filter(r => r.status !== 'ok').length;
  const isPartial = costedRows.length > 0 && uncostedCount > 0;
  const isFull = costedRows.length > 0 && uncostedCount === 0;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Build Card Costing</p>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Manager Only</span>
      </div>

      {componentRows.length === 0 || costedRows.length === 0 ? (
        <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">No components linked to recipes or purchased items. Add links in Edit to calculate build cost.</p>
        </div>
      ) : isPartial ? (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">{uncostedCount} component{uncostedCount !== 1 ? 's' : ''} missing cost — partial estimate shown.</p>
        </div>
      ) : isFull ? (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-3">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <p className="text-xs text-green-400">Full costing — all components have cost data.</p>
        </div>
      ) : null}

      {totalBuildCost > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-center">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Build Cost</p>
            <p className="text-sm font-extrabold text-primary">${totalBuildCost.toFixed(2)}</p>
          </div>
          {menuPrice > 0 && (
            <div className="bg-muted/30 border border-border rounded-lg p-2 text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Menu Price</p>
              <p className="text-sm font-extrabold text-foreground">${menuPrice.toFixed(2)}</p>
            </div>
          )}
          {foodCostPct !== null && (
            <div className={`rounded-lg p-2 text-center border ${foodCostPct > 35 ? 'bg-red-500/10 border-red-500/20' : foodCostPct > 28 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Food Cost %</p>
              <p className={`text-sm font-extrabold ${foodCostPct > 35 ? 'text-red-400' : foodCostPct > 28 ? 'text-amber-400' : 'text-green-400'}`}>{foodCostPct.toFixed(1)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Component breakdown */}
      {componentRows.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] bg-muted/40 px-3 py-1.5 gap-2">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Component</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase w-14 text-right">Qty</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase text-right w-16">Cost</span>
          </div>
          {componentRows.map((row, i) => (
            <div key={row.id || i} className={`grid grid-cols-[1fr_auto_auto] px-3 py-2 gap-2 items-center border-t border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
              <div>
                <p className="text-xs font-semibold text-foreground truncate">{row.label}</p>
                {row.note && <p className="text-[9px] text-muted-foreground">via {row.note}</p>}
              </div>
              <span className="text-xs text-muted-foreground text-right w-14">{row.quantity} {row.unit}</span>
              <span className="text-right w-16">
                {row.status === 'ok' ? (
                  <span className="text-xs font-bold text-foreground">${row.lineCost.toFixed(2)}</span>
                ) : (
                  <span className="text-[9px] font-bold text-amber-400">
                    {row.status === 'unlinked' ? 'Unlinked' : row.status === 'no-conversion' ? 'No conv.' : 'Needs cost'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}