import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import {
  BookOpen, Search, Plus, ChevronRight, Clock, Package, Archive,
  AlertTriangle, Link2, Camera, Edit2, Copy, X, CheckCircle2, Utensils
} from 'lucide-react';
import RecipeCosting from '@/components/recipes/RecipeCosting';

const CATEGORIES = ['all','prep','sauce','protein','pantry','bakery','bar','dessert','archived'];
const STATIONS = ['Grill','Fry','Pantry','Prep','Bakery','Bar','Expo'];
const ALLERGEN_LIST = ['Gluten','Dairy','Egg','Soy','Shellfish','Nuts','Peanuts'];
const DIETARY_FLAGS = ['Vegetarian','Vegan','Spicy','GF'];
const UNITS = ['oz','lb','cup','qt','gal','each','bunch','tsp','tbsp','fl oz','g','kg','L','mL','slice','bag','case'];

const STATUS_STYLE = {
  active: 'bg-green-500/20 text-green-300',
  draft: 'bg-amber-500/20 text-amber-300',
  archived: 'bg-muted text-muted-foreground',
};

function RecipeCard({ recipe, onClick }) {
  const getCostStatus = () => {
    if (recipe.costStatus === 'complete') return { label: 'Costed', color: 'bg-green-500/15 text-green-400' };
    if (recipe.costStatus === 'incomplete') return { label: 'Incomplete', color: 'bg-amber-500/15 text-amber-300' };
    if (recipe.costStatus === 'needs_links') return { label: 'No Links', color: 'bg-red-500/15 text-red-400' };
    return { label: 'Draft', color: 'bg-slate-500/15 text-slate-400' };
  };

  const costStatus = getCostStatus();
  const typeLabel = recipe.recipeType === 'menu_item' ? 'Menu Item' : recipe.recipeType === 'build_card' ? 'Build Card' : recipe.recipeType === 'sauce' ? 'Sauce' : 'Recipe';

  return (
    <button onClick={onClick} className="w-full text-left bg-card/50 border border-border rounded-lg overflow-hidden hover:border-border/60 hover:bg-card/70 transition-all active:scale-[0.98]">
      <div className="px-3 py-2.5">
        {/* Name + Type */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{recipe.name}</h3>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">{typeLabel}</span>
              {recipe.station && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">📍 {recipe.station}</span>}
            </div>
          </div>
        </div>

        {/* Yield + Cost + Approval */}
        <div className="grid grid-cols-3 gap-2 text-[10px] mb-1.5">
          {recipe.yieldAmount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yield:</span>
              <span className="font-bold text-foreground">{recipe.yieldAmount} {recipe.yieldUnit}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cost:</span>
            <span className={cn('font-bold text-[9px] px-1.5 py-0.5 rounded', costStatus.color)}>{costStatus.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={cn('font-bold text-[9px] px-1.5 py-0.5 rounded capitalize', STATUS_STYLE[recipe.status] || STATUS_STYLE.draft)}>{recipe.status || 'Draft'}</span>
          </div>
        </div>

        {/* Allergens count */}
        {Array.isArray(recipe.allergens) && recipe.allergens.length > 0 && (
          <p className="text-[9px] text-red-400 font-bold">⚠️ {recipe.allergens.length} allergen(s)</p>
        )}
      </div>
      <div className="border-t border-border/50 px-3 py-1.5 flex items-center justify-between bg-muted/20 text-[10px]">
        <span className="text-muted-foreground">
          {recipe.updated_date ? new Date(recipe.updated_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
        </span>
        <span className="text-primary font-bold">View →</span>
      </div>
    </button>
  );
}

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

function SpecChip({ label, value }) {
  if (!value) return null;
  return (
    <div className="bg-muted rounded-lg px-3 py-2 text-center">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function RecipeDetail({ recipe, onClose, onEdit, onDuplicate, onArchive, isAdmin }) {
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [linkedBuildCards, setLinkedBuildCards] = useState([]);
  const [linkedPrepTemplates, setLinkedPrepTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.RecipeIngredient.filter({ recipeId: recipe.id }, 'sortOrder', 50).catch(() => []),
      base44.entities.RecipeStep.filter({ recipeId: recipe.id }, 'sortOrder', 50).catch(() => []),
    ]).then(([ings, stps]) => {
      setIngredients(ings.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      setSteps(stps.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      setLoading(false);
    });
    if (recipe.linkedBuildCards?.length) {
      Promise.all(recipe.linkedBuildCards.map(id => base44.entities.BuildCard.get(id).catch(() => null)))
        .then(cards => setLinkedBuildCards(cards.filter(Boolean)));
    }
    if (recipe.linkedPrepTemplates?.length) {
      Promise.all(recipe.linkedPrepTemplates.map(id => base44.entities.TemperatureLogTemplate.get(id).catch(() => null)))
        .then(ts => setLinkedPrepTemplates(ts.filter(Boolean)));
    } else {
      // also search by name match
      base44.entities.PrepTemplate?.list('-updated_date', 100).catch(() => []).then(templates => {
        setLinkedPrepTemplates(templates.filter(t => t.name));
      });
    }
  }, [recipe.id]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0 sticky top-0 z-10">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-extrabold text-foreground truncate">{recipe.name}</h1>
          <p className="text-[10px] text-muted-foreground capitalize">{recipe.category}{recipe.station ? ` · ${recipe.station}` : ''}</p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[recipe.status] || STATUS_STYLE.draft}`}>
          {recipe.status || 'Draft'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4 py-4 space-y-1">
        {/* Quick Specs */}
        <SectionBlock title="Quick Specs">
          <div className="grid grid-cols-3 gap-2">
            <SpecChip label="Yield" value={recipe.yieldAmount ? `${recipe.yieldAmount} ${recipe.yieldUnit || ''}` : null} />
            <SpecChip label="Portion" value={recipe.portionSize} />
            <SpecChip label="Prep Time" value={recipe.prepTime} />
            <SpecChip label="Cook Time" value={recipe.cookTime} />
            <SpecChip label="Shelf Life" value={recipe.shelfLife} />
            <SpecChip label="Storage" value={recipe.storageLocation} />
          </div>
        </SectionBlock>

        {/* Allergens */}
        {Array.isArray(recipe.allergens) && recipe.allergens.length > 0 && (
          <SectionBlock title="Allergens & Dietary">
            <div className="flex flex-wrap gap-1.5">
              {recipe.allergens.map(a => (
                <span key={a} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />{a}
                </span>
              ))}
              {Array.isArray(recipe.dietaryFlags) && recipe.dietaryFlags.map(f => (
                <span key={f} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/20">{f}</span>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Ingredients */}
        {!loading && (
          <SectionBlock title={`Ingredients${ingredients.length ? ` (${ingredients.length})` : ''}`}>
            {ingredients.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No ingredients added.</p>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] bg-muted/40 px-3 py-1.5 gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Ingredient</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase text-right w-14">Qty / Unit</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase w-20">Prep</span>
                </div>
                {ingredients.map((ing, i) => (
                  <div key={ing.id} className={`grid grid-cols-[1fr_auto_auto] px-3 py-2 gap-2 items-center ${i % 2 === 0 ? '' : 'bg-muted/20'} border-t border-border/50`}>
                    <span className="text-xs font-semibold text-foreground">{ing.ingredientName}</span>
                    <span className="text-xs text-muted-foreground text-right w-14">{ing.quantity} {ing.unit}</span>
                    <span className="text-[10px] text-muted-foreground w-20 truncate">{ing.prepNote || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionBlock>
        )}

        {/* Method */}
        {!loading && (
          <SectionBlock title="Method / Procedure">
            {steps.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No steps added.</p>
            ) : (
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      {step.stepNumber || i + 1}
                    </div>
                    <p className="text-sm text-foreground leading-snug flex-1">{step.instruction}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionBlock>
        )}

        {/* Storage */}
        {(recipe.storageContainer || recipe.storageLocation || recipe.shelfLife || recipe.labelingInstructions) && (
          <SectionBlock title="Storage & Labeling">
            <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-1.5 text-sm">
              {recipe.storageContainer && <p><span className="font-bold text-foreground">Container:</span> <span className="text-muted-foreground">{recipe.storageContainer}</span></p>}
              {recipe.storageLocation && <p><span className="font-bold text-foreground">Location:</span> <span className="text-muted-foreground">{recipe.storageLocation}</span></p>}
              {recipe.shelfLife && <p><span className="font-bold text-foreground">Shelf Life:</span> <span className="text-muted-foreground">{recipe.shelfLife}</span></p>}
              {recipe.labelingInstructions && <p><span className="font-bold text-foreground">Label:</span> <span className="text-muted-foreground">{recipe.labelingInstructions}</span></p>}
            </div>
          </SectionBlock>
        )}

        {/* Linked Prep Templates */}
        {linkedPrepTemplates.length > 0 && (
          <SectionBlock title="Used In Prep Templates">
            <div className="space-y-1.5">
              {linkedPrepTemplates.slice(0,5).map(t => (
                <div key={t.id} className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
                  <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground">{t.name}</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Linked Build Cards */}
        {linkedBuildCards.length > 0 && (
          <SectionBlock title="Used In Build Cards">
            <div className="space-y-1.5">
              {linkedBuildCards.map(bc => (
                <div key={bc.id} className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
                  <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground">{bc.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground capitalize">{bc.station}</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Recipe Costing (managers/admins only) */}
        {isAdmin && ingredients.length > 0 && (
          <RecipeCosting recipe={recipe} ingredients={ingredients} />
        )}

        {/* Notes */}
        {recipe.notes && (
          <SectionBlock title="Notes">
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-xl p-3">{recipe.notes}</p>
          </SectionBlock>
        )}
        </div>

        {/* Manager Actions */}
      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
          <button onClick={() => onEdit(recipe)} className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 h-10">
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={() => onDuplicate(recipe)} className="btn-secondary text-xs flex items-center justify-center gap-1 h-10 px-3">
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
          <button onClick={() => onArchive(recipe)} className="btn-secondary text-xs flex items-center justify-center gap-1 h-10 px-3">
            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

function RecipeForm({ recipe, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', category: '', station: '', status: 'draft',
    yieldAmount: '', yieldUnit: '', portionSize: '', prepTime: '', cookTime: '',
    shelfLife: '', storageLocation: '', storageContainer: '', labelingInstructions: '',
    allergens: [], dietaryFlags: [], notes: '',
    ...recipe,
    allergens: Array.isArray(recipe?.allergens) ? recipe.allergens : [],
    dietaryFlags: Array.isArray(recipe?.dietaryFlags) ? recipe.dietaryFlags : [],
  });
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (recipe?.id) {
      base44.entities.RecipeIngredient.filter({ recipeId: recipe.id }, 'sortOrder', 50).then(d => setIngredients(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
      base44.entities.RecipeStep.filter({ recipeId: recipe.id }, 'sortOrder', 50).then(d => setSteps(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
    }
  }, [recipe?.id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm(p => ({ ...p, [k]: p[k]?.includes(v) ? p[k].filter(x => x !== v) : [...(p[k] || []), v] }));

  const addIngredient = () => setIngredients(p => [...p, { ingredientName: '', quantity: '', unit: '', prepNote: '', sortOrder: p.length, _new: true }]);
  const addStep = () => setSteps(p => [...p, { instruction: '', sortOrder: p.length, _new: true }]);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    let recipeId = recipe?.id;
    const payload = { ...form };
    if (recipeId) {
      await base44.entities.Recipe.update(recipeId, payload);
    } else {
      const created = await base44.entities.Recipe.create(payload);
      recipeId = created.id;
    }
    // Save ingredients
    for (const ing of ingredients) {
      if (ing._new) { const { _new, id, ...data } = ing; await base44.entities.RecipeIngredient.create({ ...data, recipeId }); }
      else if (ing._deleted && ing.id) { await base44.entities.RecipeIngredient.delete(ing.id); }
      else if (ing.id && ing._dirty) { const { _dirty, ...data } = ing; await base44.entities.RecipeIngredient.update(ing.id, data); }
    }
    // Save steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step._new) { const { _new, id, ...data } = step; await base44.entities.RecipeStep.create({ ...data, recipeId, stepNumber: i + 1 }); }
      else if (step._deleted && step.id) { await base44.entities.RecipeStep.delete(step.id); }
      else if (step.id && step._dirty) { const { _dirty, ...data } = step; await base44.entities.RecipeStep.update(step.id, { ...data, stepNumber: i + 1 }); }
    }
    haptics.success();
    setSaving(false);
    onSave?.();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <h2 className="flex-1 text-sm font-extrabold text-foreground">{recipe ? 'Edit Recipe' : 'New Recipe'}</h2>
        <button onClick={save} disabled={saving} className="btn-primary text-xs px-4 h-8">{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-10">
        {/* Basic Info */}
        <div className="space-y-2">
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Recipe name *" className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground font-bold" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={e => set('category', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Category</option>
              {['prep','sauce','protein','pantry','bakery','bar','dessert','other'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <input value={form.station} onChange={e => set('station', e.target.value)} placeholder="Station" className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Specs */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Specs</p>
          <div className="grid grid-cols-2 gap-2">
            {[['yieldAmount','Yield Amount','number'],['yieldUnit','Yield Unit','text'],['portionSize','Portion Size','text'],['prepTime','Prep Time','text'],['cookTime','Cook Time','text'],['shelfLife','Shelf Life','text'],['storageLocation','Storage Location','text'],['storageContainer','Container','text']].map(([k,l,t]) => (
              <input key={k} type={t} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={l} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            ))}
          </div>
          <input value={form.labelingInstructions} onChange={e => set('labelingInstructions', e.target.value)} placeholder="Labeling instructions" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground mt-2" />
        </div>

        {/* Allergens */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Allergens</p>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGEN_LIST.map(a => (
              <button key={a} onClick={() => toggleArr('allergens', a)} className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${form.allergens?.includes(a) ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-muted border-border text-muted-foreground'}`}>{a}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {DIETARY_FLAGS.map(f => (
              <button key={f} onClick={() => toggleArr('dietaryFlags', f)} className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${form.dietaryFlags?.includes(f) ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ingredients</p>
            <button onClick={addIngredient} className="text-[10px] font-bold text-primary flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
          </div>
          <div className="space-y-2">
            {ingredients.filter(i => !i._deleted).map((ing, idx) => (
              <div key={idx} className="flex gap-1.5 items-center">
                <input value={ing.ingredientName} onChange={e => setIngredients(p => p.map((x,i) => i===idx ? {...x, ingredientName: e.target.value, _dirty: true} : x))} placeholder="Ingredient" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <input type="number" value={ing.quantity} onChange={e => setIngredients(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty: true} : x))} placeholder="Qty" className="w-12 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <select value={ing.unit} onChange={e => setIngredients(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty: true} : x))} className="w-16 px-1 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground">
                  <option value="">Unit</option>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input value={ing.prepNote} onChange={e => setIngredients(p => p.map((x,i) => i===idx ? {...x, prepNote: e.target.value, _dirty: true} : x))} placeholder="Prep note" className="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <button onClick={() => setIngredients(p => p.map((x,i) => i===idx ? {...x, _deleted: true} : x))} className="text-red-400 px-1"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Method / Steps</p>
            <button onClick={addStep} className="text-[10px] font-bold text-primary flex items-center gap-1"><Plus className="h-3 w-3" />Add Step</button>
          </div>
          <div className="space-y-2">
            {steps.filter(s => !s._deleted).map((step, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-1">{idx + 1}</div>
                <textarea value={step.instruction} onChange={e => setSteps(p => p.map((x,i) => i===idx ? {...x, instruction: e.target.value, _dirty: true} : x))} placeholder="Step instruction..." rows={2} className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground resize-none" />
                <button onClick={() => setSteps(p => p.map((x,i) => i===idx ? {...x, _deleted: true} : x))} className="text-red-400 px-1 mt-1"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes / instructions (optional)" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
      </div>
    </div>
  );
}

export default function Recipes() {
  const { isAdmin } = useCurrentUser();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStation, setFilterStation] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Recipe.list('-updated_date', 200).catch(() => []);
    setRecipes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = recipes.filter(r => {
    if (filterCat === 'archived') return r.status === 'archived';
    if (filterCat !== 'all') { if (r.category !== filterCat) return false; }
    else { if (r.status === 'archived') return false; }
    if (filterStation && r.station !== filterStation) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async () => { await load(); setShowForm(false); setEditing(null); setSelected(null); };

  const handleDuplicate = async (recipe) => {
    const { id, created_date, updated_date, ...data } = recipe;
    const created = await base44.entities.Recipe.create({ ...data, name: `${recipe.name} (Copy)`, status: 'draft' });
    const [ings, stps] = await Promise.all([
      base44.entities.RecipeIngredient.filter({ recipeId: id }, 'sortOrder', 50).catch(() => []),
      base44.entities.RecipeStep.filter({ recipeId: id }, 'sortOrder', 50).catch(() => []),
    ]);
    await Promise.all([
      ...ings.map(({ id: _id, created_date: _c, updated_date: _u, ...d }) => base44.entities.RecipeIngredient.create({ ...d, recipeId: created.id })),
      ...stps.map(({ id: _id, created_date: _c, updated_date: _u, ...d }) => base44.entities.RecipeStep.create({ ...d, recipeId: created.id })),
    ]);
    haptics.success();
    await load();
    setSelected(null);
  };

  const handleArchive = async (recipe) => {
    await base44.entities.Recipe.update(recipe.id, { status: recipe.status === 'archived' ? 'draft' : 'archived' });
    haptics.success();
    await load();
    setSelected(null);
  };

  // On desktop, RecipeDetail shows in right panel — only go fullscreen on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  if (selected && isMobile) return <RecipeDetail recipe={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onEdit={r => { setSelected(null); setEditing(r); setShowForm(true); }} onDuplicate={handleDuplicate} onArchive={handleArchive} />;
  if (showForm) return <RecipeForm recipe={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />;

  const categoryCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === 'all' ? recipes.filter(r => r.status !== 'archived').length : recipes.filter(r => r.category === c && r.status !== 'archived').length;
    return acc;
  }, {});

  return (
    <div className="pb-28">
      <DesktopPageHeader
        title="Recipes"
        subtitle="Recipe library and build management"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes…" className="w-52 pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground" />
            </div>
            {isAdmin && (
              <button onClick={() => { setEditing(null); setShowForm(true); haptics.medium(); }} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 active:scale-95">
                <Plus className="h-3.5 w-3.5" /> New Recipe
              </button>
            )}
          </div>
        }
      />

      {/* Desktop 3-panel */}
      <div className="hidden lg:grid lg:grid-cols-[180px_1fr_340px] lg:gap-0" style={{ height: 'calc(100vh - 120px)' }}>
        {/* LEFT: Filters */}
        <div className="border-r border-border/30 overflow-y-auto p-3 space-y-3">
          {/* TYPE */}
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">TYPE</p>
            <div className="space-y-0.5">
              {['all', 'menu', 'prep', 'build_card', 'sauce'].map(c => {
                const count = c === 'all' ? recipes.filter(r => r.status !== 'archived').length : recipes.filter(r => (r.recipeType || 'prep') === c && r.status !== 'archived').length;
                return (
                  <button key={c} onClick={() => setFilterCat(c)} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === c ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                    <span className="capitalize">{c === 'menu' ? 'Menu Items' : c === 'build_card' ? 'Build Cards' : c === 'sauce' ? 'Sauces' : 'All'}</span>
                    <span className={`text-[9px] font-bold ${filterCat === c ? 'text-white/60' : 'text-muted-foreground'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATION */}
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">STATION</p>
            <div className="space-y-0.5">
              {['Grill', 'Prep', 'Pantry', 'Bakery', 'Bar'].map(s => {
                const count = recipes.filter(r => r.station === s && r.status !== 'archived').length;
                return (
                  <button key={s} onClick={() => setFilterStation(filterStation === s ? '' : s)} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStation === s ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                    <span>{s}</span>
                    <span className={`text-[9px] font-bold ${filterStation === s ? 'text-white/60' : 'text-muted-foreground'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATUS */}
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">STATUS</p>
            <div className="space-y-0.5">
              {['all_active', 'draft', 'approved'].map(s => {
                const count = s === 'all_active' ? recipes.filter(r => r.status !== 'archived').length : recipes.filter(r => r.status === s).length;
                return (
                  <button key={s} onClick={() => setFilterCat(s)} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === s ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                    <span className="capitalize">{s === 'all_active' ? 'Active' : s}</span>
                    <span className={`text-[9px] font-bold ${filterCat === s ? 'text-white/60' : 'text-muted-foreground'}`}>{count}</span>
                  </button>
                );
              })}
              <button onClick={() => setFilterCat('archived')} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === 'archived' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                <span>Archived</span>
                <span className={`text-[9px] font-bold ${filterCat === 'archived' ? 'text-white/60' : 'text-muted-foreground'}`}>{recipes.filter(r => r.status === 'archived').length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CENTER: Recipe list */}
        <div className="overflow-y-auto border-r border-border/30 p-4 space-y-2">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No recipes found</p>
            </div>
          ) : (
            filtered.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => { haptics.light(); setSelected(r); }} />)
          )}
        </div>

        {/* RIGHT: Recipe detail panel */}
        <div className="overflow-y-auto bg-card/30">
          {selected ? (
            <RecipeDetail recipe={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onEdit={r => { setSelected(null); setEditing(r); setShowForm(true); }} onDuplicate={handleDuplicate} onArchive={handleArchive} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">Select a recipe to view details</p>
              <p className="text-xs text-muted-foreground mb-6">Or create and manage your recipe library</p>
              {isAdmin && (
                <div className="flex flex-col gap-2 w-full">
                  <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95">
                    <Plus className="h-3.5 w-3.5" /> New Recipe
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-extrabold text-foreground">Recipes</h1>
            </div>
            {isAdmin && (
              <button onClick={() => { setEditing(null); setShowForm(true); haptics.medium(); }} className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Kitchen production, prep methods, and batch instructions.</p>
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes…" className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilterCat(c)} className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-bold capitalize transition-all ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5">
          <button onClick={() => setFilterStation('')} className={`shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${!filterStation ? 'bg-card border border-primary/40 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>All Stations</button>
          {STATIONS.map(s => (
            <button key={s} onClick={() => setFilterStation(filterStation === s ? '' : s)} className={`shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${filterStation === s ? 'bg-card border border-primary/40 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Mobile list */}
      <div className="lg:hidden px-4 py-3 space-y-2.5">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No recipes found</p>
            {isAdmin && <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto"><Plus className="h-3.5 w-3.5" />Create Recipe</button>}
          </div>
        ) : (
          filtered.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => { haptics.light(); setSelected(r); }} />)
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;