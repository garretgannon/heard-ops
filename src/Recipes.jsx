import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import {
  ChefHat, Search, Plus, Archive,
  AlertTriangle, Edit2, Copy, X,
  Flame, BookOpen, DollarSign, Shield, Users, MapPin
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

// Tabs configuration for multi-view system
const RECIPE_TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'build', label: 'Build', icon: Flame },
  { id: 'prep', label: 'Prep', icon: ChefHat },
  { id: 'costing', label: 'Costing', icon: DollarSign },
  { id: 'allergens', label: 'Allergens', icon: Shield },
  { id: 'training', label: 'Training', icon: Users },
  { id: 'station', label: 'Station', icon: MapPin },
];

function RecipeCard({ recipe, onClick }) {
  const getCostStatus = () => {
    if (recipe.costStatus === 'complete') return { label: 'Costed', color: 'bg-green-500/15 text-green-400' };
    if (recipe.costStatus === 'incomplete') return { label: 'Incomplete', color: 'bg-amber-500/15 text-amber-300' };
    if (recipe.costStatus === 'needs_links') return { label: 'No Links', color: 'bg-red-500/15 text-red-400' };
    return { label: 'Draft', color: 'bg-slate-500/15 text-slate-400' };
  };

  const costStatus = getCostStatus();

  return (
    <button onClick={onClick} className="w-full text-left bg-card/50 border border-border rounded-lg overflow-hidden hover:border-border/60 hover:bg-card/70 transition-all active:scale-[0.98]">
      <div className="px-3 py-2.5">
        {/* Name + Type */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{recipe.name}</h3>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">Recipe</span>
              {recipe.station && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">📍 {recipe.station}</span>}
            </div>
          </div>
        </div>

        {/* Yield + Cost + Status */}
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

// Multi-view Detail component
function RecipeDetail({ recipe, onClose, onEdit, onDuplicate, onArchive, isAdmin }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
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
  }, [recipe.id]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
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

      {/* Multi-View Tabs */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-2 overflow-x-auto sticky top-[60px] z-10">
        {RECIPE_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
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

            {!loading && (
              <SectionBlock title={`Ingredients (${ingredients.length})`}>
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

            {recipe.notes && (
              <SectionBlock title="Notes">
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-xl p-3">{recipe.notes}</p>
              </SectionBlock>
            )}
          </div>
        )}

        {/* BUILD TAB (Service Mode) */}
        {activeTab === 'build' && (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
              <p className="text-xs text-primary font-bold">🔥 Service Mode</p>
              <p className="text-[10px] text-primary/80 mt-0.5">Fast execution view optimized for line during service</p>
            </div>

            {!loading && (
              <>
                {steps.length > 0 && (
                  <SectionBlock title="Assembly Steps">
                    <div className="space-y-2">
                      {steps.map((step, i) => (
                        <div key={step.id} className="flex gap-3 bg-muted/20 p-3 rounded-lg">
                          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</div>
                          <p className="text-sm text-foreground flex-1">{step.instruction}</p>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>
                )}

                {recipe.platingNotes && (
                  <SectionBlock title="Plating Instructions">
                    <p className="text-sm bg-muted/20 p-3 rounded-lg text-foreground leading-relaxed">{recipe.platingNotes}</p>
                  </SectionBlock>
                )}

                {recipe.buildCardNotes && (
                  <SectionBlock title="Assembly Notes">
                    <p className="text-sm bg-muted/20 p-3 rounded-lg text-foreground leading-relaxed">{recipe.buildCardNotes}</p>
                  </SectionBlock>
                )}
              </>
            )}
          </div>
        )}

        {/* PREP TAB (Production Mode) */}
        {activeTab === 'prep' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-xs text-amber-400 font-bold">🔪 Prep Mode</p>
              <p className="text-[10px] text-amber-400/80 mt-0.5">Production workflow for kitchen prep and batch preparation</p>
            </div>

            <SectionBlock title="Batch Prep Info">
              <div className="grid grid-cols-2 gap-2">
                <SpecChip label="Yield" value={recipe.yieldAmount ? `${recipe.yieldAmount} ${recipe.yieldUnit || ''}` : 'Not set'} />
                <SpecChip label="Prep Time" value={recipe.prepTime || 'Not set'} />
                <SpecChip label="Storage" value={recipe.storageLocation || 'Not set'} />
                <SpecChip label="Container" value={recipe.storageContainer || 'Not set'} />
              </div>
            </SectionBlock>

            {!loading && ingredients.length > 0 && (
              <SectionBlock title="Ingredients">
                <div className="border border-border rounded-xl overflow-hidden">
                  {ingredients.map((ing, i) => (
                    <div key={ing.id} className={`grid grid-cols-[1fr_auto_auto] px-3 py-2 gap-2 items-center ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <span className="text-sm font-semibold text-foreground">{ing.ingredientName}</span>
                      <span className="text-xs text-muted-foreground">{ing.quantity} {ing.unit}</span>
                      <span className="text-xs text-muted-foreground text-right">{ing.prepNote || '—'}</span>
                    </div>
                  ))}
                </div>
              </SectionBlock>
            )}

            {recipe.shelfLife && (
              <SectionBlock title="Storage & Labeling">
                <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-1.5 text-sm">
                  <p><span className="font-bold text-foreground">Shelf Life:</span> <span className="text-muted-foreground">{recipe.shelfLife}</span></p>
                  {recipe.labelingInstructions && <p><span className="font-bold text-foreground">Label:</span> <span className="text-muted-foreground">{recipe.labelingInstructions}</span></p>}
                </div>
              </SectionBlock>
            )}
          </div>
        )}

        {/* COSTING TAB (Management Mode) */}
        {activeTab === 'costing' && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
              <p className="text-xs text-green-400 font-bold">💰 Management Mode</p>
              <p className="text-[10px] text-green-400/80 mt-0.5">Food cost analysis and inventory linkage</p>
            </div>

            {isAdmin && ingredients.length > 0 && (
              <RecipeCosting recipe={recipe} ingredients={ingredients} />
            )}

            {!isAdmin && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>Costing data available to managers and admin only</p>
              </div>
            )}
          </div>
        )}

        {/* ALLERGENS TAB */}
        {activeTab === 'allergens' && (
          <div className="space-y-4">
            {Array.isArray(recipe.allergens) && recipe.allergens.length > 0 ? (
              <>
                <SectionBlock title="Allergens">
                  <div className="flex flex-wrap gap-2">
                    {recipe.allergens.map(a => (
                      <span key={a} className="text-sm font-bold px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> {a}
                      </span>
                    ))}
                  </div>
                </SectionBlock>

                {Array.isArray(recipe.dietaryFlags) && recipe.dietaryFlags.length > 0 && (
                  <SectionBlock title="Dietary Indicators">
                    <div className="flex flex-wrap gap-2">
                      {recipe.dietaryFlags.map(f => (
                        <span key={f} className="text-sm font-bold px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/20">{f}</span>
                      ))}
                    </div>
                  </SectionBlock>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No allergens or dietary flags marked for this recipe</p>
              </div>
            )}
          </div>
        )}

        {/* TRAINING TAB */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <p className="text-xs text-blue-400 font-bold">📚 Training Materials</p>
              <p className="text-[10px] text-blue-400/80 mt-0.5">SOPs, quality standards, and learning resources</p>
            </div>

            <SectionBlock title="Execution Steps">
              {!loading && steps.length > 0 ? (
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex gap-3 bg-muted/20 p-3 rounded-lg">
                      <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="text-sm text-foreground flex-1">{step.instruction}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No execution steps defined</p>
              )}
            </SectionBlock>

            <SectionBlock title="Quality Standards">
              <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                {recipe.notes || 'No quality standards documented'}
              </p>
            </SectionBlock>
          </div>
        )}

        {/* STATION TAB */}
        {activeTab === 'station' && (
          <div className="space-y-4">
            <SectionBlock title="Station Assignment">
              {recipe.station ? (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
                  <p className="text-sm font-bold text-primary">📍 {recipe.station}</p>
                  <p className="text-xs text-primary/70 mt-1">This recipe is assigned to the {recipe.station} station</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No station assigned</p>
              )}
            </SectionBlock>

            <SectionBlock title="Recipe Metadata">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-bold text-foreground capitalize">{recipe.category || 'Uncategorized'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={cn('font-bold capitalize', STATUS_STYLE[recipe.status])}>{recipe.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-bold text-foreground">
                    {recipe.updated_date ? new Date(recipe.updated_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </SectionBlock>
          </div>
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
    name: '', category: '', station: '', status: 'draft', recipeType: 'prep',
    yieldAmount: '', yieldUnit: '', portionSize: '', prepTime: '', cookTime: '',
    shelfLife: '', storageLocation: '', storageContainer: '', labelingInstructions: '',
    allergens: [], dietaryFlags: [], notes: '', buildCardNotes: '', platingNotes: '',
    ...recipe,
    allergens: Array.isArray(recipe?.allergens) ? recipe.allergens : [],
    dietaryFlags: Array.isArray(recipe?.dietaryFlags) ? recipe.dietaryFlags : [],
  });
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');

  useEffect(() => {
    if (recipe?.id) {
      base44.entities.RecipeIngredient.filter({ recipeId: recipe.id }, 'sortOrder', 50).then(d => setIngredients(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
      base44.entities.RecipeStep.filter({ recipeId: recipe.id }, 'sortOrder', 50).then(d => setSteps(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
    }
  }, [recipe?.id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm(p => ({ ...p, [k]: p[k]?.includes(v) ? p[k].filter(x => x !== v) : [...(p[k] || []), v] }));

  const tabs = ['basics', 'yield', 'ingredients', 'method', 'build', 'allergens', 'review'];

  const addIngredient = () => setIngredients(p => [...p, { ingredientName: '', quantity: '', unit: '', prepNote: '', sortOrder: p.length, _new: true }]);
  const addStep = () => setSteps(p => [...p, { instruction: '', sortOrder: p.length, _new: true }]);

  const handleSaveDraft = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    let recipeId = recipe?.id;
    const payload = { ...form, status: 'draft' };
    if (recipeId) {
      await base44.entities.Recipe.update(recipeId, payload);
    } else {
      const created = await base44.entities.Recipe.create(payload);
      recipeId = created.id;
    }
    for (const ing of ingredients) {
      if (ing._new) { const { _new, id, ...data } = ing; await base44.entities.RecipeIngredient.create({ ...data, recipeId }); }
      else if (ing._deleted && ing.id) { await base44.entities.RecipeIngredient.delete(ing.id); }
      else if (ing.id && ing._dirty) { const { _dirty, ...data } = ing; await base44.entities.RecipeIngredient.update(ing.id, data); }
    }
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

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    let recipeId = recipe?.id;
    const payload = { ...form, status: 'approved' };
    if (recipeId) {
      await base44.entities.Recipe.update(recipeId, payload);
    } else {
      const created = await base44.entities.Recipe.create(payload);
      recipeId = created.id;
    }
    for (const ing of ingredients) {
      if (ing._new) { const { _new, id, ...data } = ing; await base44.entities.RecipeIngredient.create({ ...data, recipeId }); }
      else if (ing._deleted && ing.id) { await base44.entities.RecipeIngredient.delete(ing.id); }
      else if (ing.id && ing._dirty) { const { _dirty, ...data } = ing; await base44.entities.RecipeIngredient.update(ing.id, data); }
    }
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
      {/* Header */}
      <div className="bg-card border-b border-border px-3 py-2 flex items-center gap-2 shrink-0 sticky top-0 z-10">
        <button onClick={onClose} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-extrabold text-foreground">{recipe ? 'Edit Recipe' : 'New Recipe'}</h2>
          <p className="text-[9px] text-muted-foreground truncate">{form.name || 'Untitled'}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setForm(p => ({ ...p, status: 'draft' })); handleSaveDraft(); }} className="btn-secondary text-[10px] px-2.5 h-7">
            {saving ? '...' : 'Draft'}
          </button>
          <button onClick={save} disabled={saving} className="btn-primary text-[10px] px-2.5 h-7">{saving ? '...' : 'Approve'}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex items-center gap-0 overflow-x-auto px-3 bg-card/30">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('text-[10px] font-bold px-2.5 py-1.5 border-b-2 transition-all capitalize whitespace-nowrap', activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 pb-10">
        {/* BASICS TAB */}
        {activeTab === 'basics' && (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-foreground block mb-0.5">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Recipe name" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground">
                  <option value="">—</option>
                  {['prep','sauce','protein','pantry','bakery','bar','dessert','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Station</label>
                <input value={form.station} onChange={e => set('station', e.target.value)} placeholder="Grill" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground">
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground block mb-0.5">Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Brief description..." rows={1} className="w-full px-2 py-1 bg-background border border-border rounded text-xs text-foreground resize-none" />
            </div>
          </div>
        )}

        {/* YIELD TAB */}
        {activeTab === 'yield' && (
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Amount</label>
                <input type="number" value={form.yieldAmount} onChange={e => set('yieldAmount', e.target.value)} placeholder="10" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Unit</label>
                <select value={form.yieldUnit} onChange={e => set('yieldUnit', e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs">
                  <option value="">—</option>
                  {UNITS.slice(0, 8).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Portion</label>
                <input value={form.portionSize} onChange={e => set('portionSize', e.target.value)} placeholder="1 plate" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Prep Time</label>
                <input value={form.prepTime} onChange={e => set('prepTime', e.target.value)} placeholder="15m" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Cook Time</label>
                <input value={form.cookTime} onChange={e => set('cookTime', e.target.value)} placeholder="30m" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Shelf Life</label>
                <input value={form.shelfLife} onChange={e => set('shelfLife', e.target.value)} placeholder="3 days" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground block mb-0.5">Storage</label>
              <input value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} placeholder="Fridge" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-foreground block mb-0.5">Container</label>
                <input value={form.storageContainer} onChange={e => set('storageContainer', e.target.value)} placeholder="6qt" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground block mb-0.5">Label</label>
              <input value={form.labelingInstructions} onChange={e => set('labelingInstructions', e.target.value)} placeholder="Date + contents" className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs" />
            </div>
          </div>
        )}

        {/* INGREDIENTS TAB */}
        {activeTab === 'ingredients' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <p className="font-bold text-foreground">Items ({ingredients.filter(i => !i._deleted).length})</p>
              <button onClick={addIngredient} className="font-bold text-primary flex items-center gap-0.5 hover:text-primary/80"><Plus className="h-2.5 w-2.5" />Add</button>
            </div>
            {ingredients.filter(i => !i._deleted).length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic py-2 text-center">Add ingredient to start</p>
            ) : (
              <div className="border border-border rounded overflow-hidden">
                {ingredients.filter(i => !i._deleted).map((ing, idx) => (
                  <div key={idx} className={`grid grid-cols-12 gap-1 p-1.5 items-center text-[9px] ${idx % 2 === 0 ? '' : 'bg-muted/10'} ${idx < ingredients.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <input value={ing.ingredientName} onChange={e => setIngredients(p => p.map((x,i) => i===idx ? {...x, ingredientName: e.target.value, _dirty: true} : x))} placeholder="Item" className="col-span-5 px-1 py-1 bg-background border border-border rounded text-[9px]" />
                    <input type="number" value={ing.quantity} onChange={e => setIngredients(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty: true} : x))} placeholder="0" className="col-span-2 px-1 py-1 bg-background border border-border rounded text-[9px] text-center" />
                    <select value={ing.unit} onChange={e => setIngredients(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty: true} : x))} className="col-span-2 px-1 py-1 bg-background border border-border rounded text-[9px]">
                      <option value="">—</option>
                      {UNITS.slice(0, 10).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button onClick={() => setIngredients(p => p.map((x,i) => i===idx ? {...x, _deleted: true} : x))} className="col-span-1 text-red-400 hover:text-red-300"><X className="h-2.5 w-2.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* METHOD TAB */}
        {activeTab === 'method' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <p className="font-bold text-foreground">Steps ({steps.filter(s => !s._deleted).length})</p>
              <button onClick={addStep} className="font-bold text-primary flex items-center gap-0.5 hover:text-primary/80"><Plus className="h-2.5 w-2.5" />Add</button>
            </div>
            {steps.filter(s => !s._deleted).length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic py-2 text-center">Add step to start</p>
            ) : (
              <div className="space-y-1.5">
                {steps.filter(s => !s._deleted).map((step, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-muted/20 rounded p-2">
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[8px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</div>
                    <textarea value={step.instruction} onChange={e => setSteps(p => p.map((x,i) => i===idx ? {...x, instruction: e.target.value, _dirty: true} : x))} placeholder="Instructions..." rows={1} className="flex-1 px-1.5 py-1 bg-background border border-border rounded text-[9px] resize-none" />
                    <button onClick={() => setSteps(p => p.map((x,i) => i===idx ? {...x, _deleted: true} : x))} className="text-red-400 hover:text-red-300 mt-0.5"><X className="h-2.5 w-2.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUILD CARD TAB */}
        {activeTab === 'build' && (
          <div className="space-y-1.5">
            <div>
              <label className="text-[10px] font-bold text-foreground block mb-0.5">Plating</label>
              <textarea value={form.platingNotes} onChange={e => set('platingNotes', e.target.value)} placeholder="How to plate..." rows={2} className="w-full px-2 py-1 bg-background border border-border rounded text-[9px] resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground block mb-0.5">Assembly</label>
              <textarea value={form.buildCardNotes} onChange={e => set('buildCardNotes', e.target.value)} placeholder="Assembly steps..." rows={2} className="w-full px-2 py-1 bg-background border border-border rounded text-[9px] resize-none" />
            </div>
          </div>
        )}

        {/* ALLERGENS TAB */}
        {activeTab === 'allergens' && (
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-bold text-foreground mb-1">Allergens</p>
              <div className="flex flex-wrap gap-1">
                {ALLERGEN_LIST.map(a => (
                  <button key={a} onClick={() => toggleArr('allergens', a)} className={cn('text-[9px] px-2 py-0.5 rounded border font-bold transition-all', form.allergens?.includes(a) ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-muted/50 border-border text-muted-foreground')}>{a}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground mb-1">Dietary</p>
              <div className="flex flex-wrap gap-1">
                {DIETARY_FLAGS.map(f => (
                  <button key={f} onClick={() => toggleArr('dietaryFlags', f)} className={cn('text-[9px] px-2 py-0.5 rounded border font-bold transition-all', form.dietaryFlags?.includes(f) ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted/50 border-border text-muted-foreground')}>{f}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REVIEW TAB */}
        {activeTab === 'review' && (
          <div className="space-y-1.5">
            <div className="bg-muted/30 rounded p-2 space-y-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">Name</span>
                <span className={cn('font-bold', form.name ? 'text-green-400' : 'text-red-400')}>{form.name ? '✓' : '✗'}</span>
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">Yield</span>
                <span className={cn('font-bold', form.yieldAmount ? 'text-green-400' : 'text-amber-400')}>{form.yieldAmount || '○'}</span>
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">Items</span>
                <span className={cn('font-bold', ingredients.filter(i => !i._deleted).length > 0 ? 'text-green-400' : 'text-amber-400')}>{ingredients.filter(i => !i._deleted).length}</span>
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">Steps</span>
                <span className={cn('font-bold', steps.filter(s => !s._deleted).length > 0 ? 'text-green-400' : 'text-amber-400')}>{steps.filter(s => !s._deleted).length}</span>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground italic p-2 bg-muted/20 rounded">
              Save as Draft or Approve when ready.
            </p>
          </div>
        )}
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  if (selected && isMobile) return <RecipeDetail recipe={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onEdit={r => { setSelected(null); setEditing(r); setShowForm(true); }} onDuplicate={handleDuplicate} onArchive={handleArchive} />;
  if (showForm) return <RecipeForm recipe={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />;

  return (
    <div className="pb-28">
      <DesktopPageHeader
        title="Recipes"
        subtitle="Unified recipe system with operational views"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes…" className="w-52 pl-9 pr-3 py-2 card-glass border border-border rounded-lg text-xs text-foreground" />
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
          {/* CATEGORY */}
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">CATEGORY</p>
            <div className="space-y-0.5">
              {['all', 'prep', 'sauce', 'protein', 'pantry'].map(c => {
                const count = c === 'all' ? recipes.filter(r => r.status !== 'archived').length : recipes.filter(r => r.category === c && r.status !== 'archived').length;
                return (
                  <button key={c} onClick={() => setFilterCat(c)} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === c ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                    <span className="capitalize">{c}</span>
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
              <button onClick={() => setFilterCat('all')} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === 'all' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                <span>Active</span>
                <span className={`text-[9px] font-bold ${filterCat === 'all' ? 'text-white/60' : 'text-muted-foreground'}`}>{recipes.filter(r => r.status !== 'archived').length}</span>
              </button>
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
              <ChefHat className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No recipes found</p>
            </div>
          ) : (
            filtered.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => { haptics.light(); setSelected(r); }} />)
          )}
        </div>

        {/* RIGHT: Recipe detail panel with tabs */}
        <div className="overflow-y-auto bg-card/30">
          {selected ? (
            <RecipeDetail recipe={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onEdit={r => { setSelected(null); setEditing(r); setShowForm(true); }} onDuplicate={handleDuplicate} onArchive={handleArchive} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
              <ChefHat className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">Select a recipe to view</p>
              <p className="text-xs text-muted-foreground mb-6">Overview, Build, Prep, Costing, Allergens, Training, Station</p>
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
              <ChefHat className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-extrabold text-foreground">Recipes</h1>
            </div>
            {isAdmin && (
              <button onClick={() => { setEditing(null); setShowForm(true); haptics.medium(); }} className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Multi-view operational recipe system</p>
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
          <div className="text-center py-12 card-glass border border-border rounded-xl">
            <ChefHat className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
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