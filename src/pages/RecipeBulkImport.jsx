import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChefHat, ArrowLeft, Sparkles, X, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';

const EXAMPLE_TEXT = `Classic Tomato Sauce
Yield: 2 qt | Category: Sauce | Station: Saute
Prep time: 15 min | Cook time: 45 min
Shelf life: 5 days | Storage: Walk-in cooler

Ingredients:
- 2 cans (28 oz) crushed tomatoes
- 1/4 cup olive oil
- 6 cloves garlic, minced
- 1 tsp dried oregano
- 1 tsp kosher salt
- 1/2 tsp black pepper
- Fresh basil to taste

Steps:
1. Heat olive oil in large saucepan over medium heat
2. Saute garlic until fragrant, about 2 minutes
3. Add crushed tomatoes and remaining ingredients
4. Simmer 40 minutes, stirring occasionally
5. Adjust seasoning and fold in fresh basil

---

Herb Compound Butter
Yield: 1 lb | Category: Prep | Station: Grill
Shelf life: 2 weeks

Ingredients:
- 1 lb unsalted butter, softened
- 2 tbsp fresh parsley, minced
- 1 tbsp fresh thyme
- 1 tsp garlic powder
- 1 tsp lemon zest

Steps:
1. Combine all ingredients in mixer on medium until fully incorporated
2. Roll in plastic wrap into 2-inch logs
3. Refrigerate until firm`;

const CATEGORY_COLORS = {
  prep: 'bg-blue-500/20 text-blue-300',
  sauce: 'bg-orange-500/20 text-orange-300',
  protein: 'bg-red-500/20 text-red-300',
  pantry: 'bg-yellow-500/20 text-yellow-300',
  bakery: 'bg-amber-500/20 text-amber-300',
  bar: 'bg-purple-500/20 text-purple-300',
  dessert: 'bg-pink-500/20 text-pink-300',
  other: 'bg-muted text-muted-foreground',
};

export default function RecipeBulkImport() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('input'); // input | parsing | preview | creating | done
  const [rawText, setRawText] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [removed, setRemoved] = useState(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState({ created: 0, failed: 0 });
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setError('');
    setStage('parsing');
    try {
      const res = await base44.functions.invoke('bulkImportRecipes', { rawText });
      if (res.error) throw new Error(res.error);
      setRecipes(res.recipes || []);
      setRemoved(new Set());
      setStage('preview');
    } catch (err) {
      setError(err.message || 'Failed to parse recipes');
      setStage('input');
    }
  };

  const handleCreate = async () => {
    const toCreate = recipes.filter((_, i) => !removed.has(i));
    if (!toCreate.length) return;
    setProgress({ done: 0, total: toCreate.length });
    setStage('creating');

    let created = 0;
    let failed = 0;

    for (const recipe of toCreate) {
      try {
        const { ingredients = [], steps = [], ...recipeFields } = recipe;
        const created_recipe = await base44.entities.Recipe.create({
          ...recipeFields,
          status: recipeFields.status || 'draft',
        });

        await Promise.all(
          ingredients.map((ing, idx) =>
            base44.entities.RecipeIngredient.create({
              recipeId: created_recipe.id,
              ingredientName: ing.ingredientName,
              quantity: ing.quantity || null,
              unit: ing.unit || '',
              prepNote: ing.prepNote || '',
              sortOrder: idx,
            })
          )
        );

        await Promise.all(
          steps.map((step, idx) =>
            base44.entities.RecipeStep.create({
              recipeId: created_recipe.id,
              instruction: step.instruction,
              stepNumber: idx + 1,
              sortOrder: idx,
            })
          )
        );

        created++;
      } catch {
        failed++;
      }
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }

    setResults({ created, failed });
    setStage('done');
  };

  const visibleCount = recipes.filter((_, i) => !removed.has(i)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/recipes')} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">Bulk Import</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* INPUT STAGE */}
        {stage === 'input' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Paste any recipe text — handwritten notes, copied docs, multiple recipes at once. The AI will parse them automatically.</p>
            </div>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={EXAMPLE_TEXT}
              rows={16}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <button
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              <Sparkles className="h-4 w-4" />
              Parse Recipes
            </button>
          </div>
        )}

        {/* PARSING STAGE */}
        {stage === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-foreground">AI is reading your recipes…</p>
            <p className="text-xs text-muted-foreground">This usually takes 5–15 seconds</p>
          </div>
        )}

        {/* PREVIEW STAGE */}
        {stage === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{visibleCount} recipe{visibleCount !== 1 ? 's' : ''} ready to import</p>
              <button onClick={() => { setStage('input'); }} className="text-xs text-muted-foreground hover:text-foreground underline">Back</button>
            </div>

            {recipes.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">No recipes could be parsed. Try adding more detail to your text.</div>
            )}

            <div className="space-y-2">
              {recipes.map((recipe, i) => {
                if (removed.has(i)) return null;
                return (
                  <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{recipe.name || 'Untitled Recipe'}</span>
                        {recipe.category && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS.other}`}>
                            {recipe.category}
                          </span>
                        )}
                        {recipe.station && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{recipe.station}</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[11px] text-muted-foreground flex-wrap">
                        {recipe.yieldAmount && <span>{recipe.yieldAmount}{recipe.yieldUnit ? ` ${recipe.yieldUnit}` : ''} yield</span>}
                        {recipe.ingredients?.length > 0 && <span>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>}
                        {recipe.steps?.length > 0 && <span>{recipe.steps.length} step{recipe.steps.length !== 1 ? 's' : ''}</span>}
                        {recipe.prepTime && <span>{recipe.prepTime}m prep</span>}
                        {recipe.cookTime && <span>{recipe.cookTime}m cook</span>}
                      </div>
                    </div>
                    <button onClick={() => setRemoved(s => new Set([...s, i]))} className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0 hover:bg-destructive/20 hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {removed.size > 0 && (
              <button onClick={() => setRemoved(new Set())} className="text-xs text-muted-foreground hover:text-foreground underline">
                Restore {removed.size} removed recipe{removed.size !== 1 ? 's' : ''}
              </button>
            )}

            <button
              onClick={handleCreate}
              disabled={visibleCount === 0}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              <Plus className="h-4 w-4" />
              Create {visibleCount} Recipe{visibleCount !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* CREATING STAGE */}
        {stage === 'creating' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-foreground">Creating recipes…</p>
            <p className="text-xs text-muted-foreground">{progress.done} of {progress.total} done</p>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* DONE STAGE */}
        {stage === 'done' && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground mb-1">
                {results.created} recipe{results.created !== 1 ? 's' : ''} created
              </p>
              {results.failed > 0 && (
                <p className="text-sm text-red-400">{results.failed} failed — check your connection and try again</p>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button onClick={() => navigate('/recipes')} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
                <ChefHat className="h-4 w-4" />
                View Recipes
              </button>
              <button onClick={() => { setStage('input'); setRawText(''); setRecipes([]); setResults({ created: 0, failed: 0 }); }} className="w-full h-11 rounded-xl bg-muted text-foreground font-bold text-sm">
                Import More
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export const hideBase44Index = true;
