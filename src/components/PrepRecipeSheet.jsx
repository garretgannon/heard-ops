import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import BottomSheet from '@/components/BottomSheet';
import { ChefHat, AlertTriangle } from 'lucide-react';

export default function PrepRecipeSheet({ open, onClose, recipeId }) {
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !recipeId) return;
    setLoading(true);
    Promise.all([
      base44.entities.Recipe.get(recipeId).catch(() => null),
      base44.entities.RecipeIngredient.filter({ recipeId }, 'sortOrder', 50).catch(() => []),
      base44.entities.RecipeStep.filter({ recipeId }, 'sortOrder', 50).catch(() => []),
    ]).then(([rec, ings, stps]) => {
      setRecipe(rec);
      setIngredients(ings.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      setSteps(stps.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      setLoading(false);
    });
  }, [open, recipeId]);

  return (
    <BottomSheet open={open} onClose={onClose} title={recipe?.name || 'Recipe'}>
      <div className="space-y-5 pb-2">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !recipe && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-400">Recipe not found.</p>
          </div>
        )}

        {!loading && recipe && (
          <>
            {/* Recipe meta */}
            <div className="flex items-start gap-3">
              {recipe.photo_url ? (
                <img src={recipe.photo_url} alt={recipe.name} className="h-16 w-16 rounded-xl object-cover shrink-0 border border-border/40" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center shrink-0">
                  <ChefHat className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-base font-black text-foreground">{recipe.name}</p>
                {(recipe.yieldAmount || recipe.prepTime) && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {recipe.yieldAmount && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                        Yield: {recipe.yieldAmount} {recipe.yieldUnit || ''}
                      </span>
                    )}
                    {recipe.prepTime && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                        ⏱ {recipe.prepTime}
                      </span>
                    )}
                    {recipe.storageLocation && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                        📦 {recipe.storageLocation}
                      </span>
                    )}
                  </div>
                )}
                {recipe.notes && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{recipe.notes}</p>
                )}
              </div>
            </div>

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
                  Ingredients ({ingredients.length})
                </p>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  {ingredients.map((ing, i) => (
                    <div key={ing.id || i} className={`flex items-center gap-3 px-3 py-2.5 ${i % 2 === 0 ? 'bg-card/40' : 'bg-muted/10'} ${i > 0 ? 'border-t border-border/30' : ''}`}>
                      <span className="flex-1 text-sm font-semibold text-foreground">{ing.ingredientName}</span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">{ing.quantity} {ing.unit}</span>
                      {ing.prepNote && (
                        <span className="text-[10px] text-muted-foreground/60 shrink-0 max-w-[80px] truncate">{ing.prepNote}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Steps */}
            {steps.length > 0 && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
                  Steps ({steps.length})
                </p>
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div key={step.id || i} className="flex gap-3 rounded-xl bg-muted/20 border border-border/30 p-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1">{step.instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plating / assembly notes */}
            {recipe.platingNotes && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Plating</p>
                <p className="text-sm text-foreground bg-muted/20 rounded-xl border border-border/30 p-3 leading-relaxed">{recipe.platingNotes}</p>
              </div>
            )}

            {ingredients.length === 0 && steps.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No ingredients or steps added to this recipe yet.</p>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
