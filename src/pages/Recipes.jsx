import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import {
  ChefHat, Search, Plus, ChevronRight, Clock, Package, Archive,
  AlertTriangle, Link2, Camera, Edit2, Copy, X, CheckCircle2, Utensils,
  Flame, BookOpen, DollarSign, Shield, Users, MapPin, Sparkles
} from 'lucide-react';
import RecipeCosting from '@/components/recipes/RecipeCosting';

const DEFAULT_CATEGORIES = ['prep','sauce','protein','pantry','bakery','bar','dessert','other'];
const ALLERGEN_LIST = ['Gluten','Dairy','Egg','Soy','Shellfish','Nuts','Peanuts'];

async function loadCategories() {
  const results = await base44.entities.Settings.filter({ key: 'recipe_categories' }).catch(() => []);
  if (results[0]?.value) { try { return JSON.parse(results[0].value); } catch {} }
  return DEFAULT_CATEGORIES;
}
async function saveCategories(cats) {
  const results = await base44.entities.Settings.filter({ key: 'recipe_categories' }).catch(() => []);
  if (results[0]) { await base44.entities.Settings.update(results[0].id, { value: JSON.stringify(cats) }); }
  else { await base44.entities.Settings.create({ key: 'recipe_categories', value: JSON.stringify(cats) }); }
}
const DIETARY_FLAGS = ['Vegetarian','Vegan','Spicy','GF'];
const UNITS = ['oz','lb','cup','qt','gal','each','bunch','tsp','tbsp','fl oz','g','kg','L','mL','slice','bag','case'];

const STATUS_STYLE = {
  active: 'bg-green-500/20 text-green-300',
  draft: 'bg-amber-500/20 text-amber-300',
  archived: 'bg-muted text-muted-foreground',
};

const RECIPE_TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'build', label: 'Build', icon: Flame },
  { id: 'info', label: 'Info', icon: Shield },
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
    <button onClick={onClick} className="w-full text-left border border-border rounded-lg overflow-hidden hover:border-border/60 hover:brightness-105 transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
      <div className="flex gap-0">
        {/* Photo thumbnail */}
        {recipe.photo_url ? (
          <div className="w-20 shrink-0 relative overflow-hidden">
            <img src={recipe.photo_url} alt={recipe.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="w-14 shrink-0 flex items-center justify-center bg-muted/20 border-r border-border/50">
            <ChefHat className="h-5 w-5 text-muted-foreground/30" />
          </div>
        )}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        {/* Name + Type */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{recipe.name}</h3>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              {Array.isArray(recipe.recipeTypes) && recipe.recipeTypes.length > 0
                ? recipe.recipeTypes.map(t => (
                    <span key={t} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      t === 'menu_item' ? 'bg-blue-500/20 text-blue-300' :
                      t === 'batch' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-green-500/20 text-green-300'
                    )}>
                      {t === 'menu_item' ? 'Menu Item' : t === 'batch' ? 'Batch' : 'Prep'}
                    </span>
                  ))
                : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300">Recipe</span>
              }
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
  const [totalCost, setTotalCost] = useState(null);

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
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-extrabold text-foreground truncate">{recipe.name}</h1>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {Array.isArray(recipe.recipeTypes) && recipe.recipeTypes.map(t => (
              <span key={t} className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                t === 'menu_item' ? 'bg-blue-500/20 text-blue-300' :
                t === 'batch' ? 'bg-amber-500/20 text-amber-300' :
                'bg-green-500/20 text-green-300'
              )}>
                {t === 'menu_item' ? 'Menu Item' : t === 'batch' ? 'Batch' : 'Prep'}
              </span>
            ))}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${STATUS_STYLE[recipe.status] || STATUS_STYLE.draft}`}>
              {recipe.status || 'Draft'}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => onEdit(recipe)} className="btn-primary h-8 px-3 text-xs flex items-center gap-1.5">
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
            <button onClick={() => onDuplicate(recipe)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors" title="Duplicate">
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => onArchive(recipe)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors" title={recipe.status === 'archived' ? 'Unarchive' : 'Archive'}>
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
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
                  ? 'glow-active'
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
      <div className="flex-1 overflow-y-auto pb-8 px-4 py-4">
      <div className="max-w-5xl mx-auto">

        {/* OVERVIEW + COSTING */}
        {activeTab === 'overview' && (
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
            {/* Left: overview info */}
            <div className="space-y-4">
              {recipe.photo_url && (
                <div className="relative rounded-xl overflow-hidden border border-border/40" style={{ height: 180 }}>
                  <img src={recipe.photo_url} alt={recipe.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-base font-black text-white">{recipe.name}</p>
                    {recipe.station && <p className="text-xs text-white/70 mt-0.5">📍 {recipe.station}</p>}
                  </div>
                </div>
              )}
              <SectionBlock title="Quick Specs">
                <div className="grid grid-cols-3 gap-2">
                  <SpecChip label="Yield" value={recipe.yieldAmount ? `${recipe.yieldAmount} ${recipe.yieldUnit || ''}` : null} />
                  <SpecChip label="Portion" value={recipe.portionSize} />
                  <SpecChip label="Prep Time" value={recipe.prepTime} />
                  <SpecChip label="Cook Time" value={recipe.cookTime} />
                  <SpecChip label="Shelf Life" value={recipe.shelfLife} />
                  <SpecChip label="Storage" value={recipe.storageLocation} />
                  {isAdmin && totalCost !== null && (
                    <SpecChip label="Total Cost" value={`$${totalCost.toFixed(2)}`} />
                  )}
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
              {recipe.notes && (
                <SectionBlock title="Notes">
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-xl p-3">{recipe.notes}</p>
                </SectionBlock>
              )}
            </div>
            {/* Right: costing */}
            <div>
              {!loading && isAdmin && (
                <RecipeCosting recipe={recipe} ingredients={ingredients} onCostCalculated={setTotalCost} />
              )}
              {!loading && !isAdmin && (
                <div className="text-center py-6 text-muted-foreground text-sm bg-muted/20 rounded-xl">
                  <p>Costing data available to managers and admin only</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INGREDIENTS + BUILD */}
        {activeTab === 'build' && (
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
            {/* Left: ingredients + batch info */}
            <div className="space-y-4">
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
              <SectionBlock title="Batch Info">
                <div className="grid grid-cols-2 gap-2">
                  <SpecChip label="Yield" value={recipe.yieldAmount ? `${recipe.yieldAmount} ${recipe.yieldUnit || ''}` : null} />
                  <SpecChip label="Prep Time" value={recipe.prepTime} />
                  <SpecChip label="Storage" value={recipe.storageLocation} />
                  <SpecChip label="Container" value={recipe.storageContainer} />
                </div>
              </SectionBlock>
              {recipe.shelfLife && (
                <SectionBlock title="Storage & Labeling">
                  <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-1.5 text-sm">
                    <p><span className="font-bold text-foreground">Shelf Life:</span> <span className="text-muted-foreground">{recipe.shelfLife}</span></p>
                    {recipe.labelingInstructions && <p><span className="font-bold text-foreground">Label:</span> <span className="text-muted-foreground">{recipe.labelingInstructions}</span></p>}
                  </div>
                </SectionBlock>
              )}
            </div>
            {/* Right: build card / service mode */}
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
                <p className="text-xs text-primary font-bold">🔥 Build Card</p>
                <p className="text-[10px] text-primary/80 mt-0.5">Assembly steps for service and line execution</p>
              </div>
              {!loading && (
                <>
                  {steps.length > 0 ? (
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
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No assembly steps defined</p>
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
          </div>
        )}

        {/* INFO — Training + Allergens + Station */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <SectionBlock title="Training Materials">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-3">
                <p className="text-xs text-blue-400 font-bold">📚 SOPs & Quality Standards</p>
              </div>
              {!loading && steps.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex gap-3 bg-muted/20 p-3 rounded-lg">
                      <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="text-sm text-foreground flex-1">{step.instruction}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic mb-4">No execution steps defined</p>
              )}
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Quality Standards</p>
              <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                {recipe.notes || 'No quality standards documented'}
              </p>
            </SectionBlock>

            <SectionBlock title="Allergens & Dietary">
              {Array.isArray(recipe.allergens) && recipe.allergens.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {recipe.allergens.map(a => (
                      <span key={a} className="text-sm font-bold px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> {a}
                      </span>
                    ))}
                  </div>
                  {Array.isArray(recipe.dietaryFlags) && recipe.dietaryFlags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {recipe.dietaryFlags.map(f => (
                        <span key={f} className="text-sm font-bold px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/20">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No allergens or dietary flags marked</p>
              )}
            </SectionBlock>

            <SectionBlock title="Station & Metadata">
              {recipe.station && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-3">
                  <p className="text-sm font-bold text-primary">📍 {recipe.station}</p>
                </div>
              )}
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
      </div>

    </div>
  );
}

function RecipeForm({ recipe, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', category: '', station: '', status: 'draft', recipeType: 'prep',
    yieldAmount: '', yieldUnit: '', portionSize: '', prepTime: '', cookTime: '',
    shelfLife: '', storageLocation: '', storageContainer: '', labelingInstructions: '',
    notes: '', buildCardNotes: '', platingNotes: '',
    ...recipe,
    allergens: Array.isArray(recipe?.allergens) ? recipe.allergens : [],
    dietaryFlags: Array.isArray(recipe?.dietaryFlags) ? recipe.dietaryFlags : [],
    unitConversions: Array.isArray(recipe?.unitConversions) ? recipe.unitConversions : [],
    recipeTypes: Array.isArray(recipe?.recipeTypes) ? recipe.recipeTypes : [],
  });
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [nameError, setNameError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);
  const [linkingIdx, setLinkingIdx] = useState(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [purchasedItemsList, setPurchasedItemsList] = useState([]);
  const [allRecipesList, setAllRecipesList] = useState([]);
  const [formCategories, setFormCategories] = useState(DEFAULT_CATEGORIES);
  const [formStations, setFormStations] = useState([]);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCat, setEditingCat] = useState(null);

  useEffect(() => {
    Promise.all([
      loadCategories(),
      base44.entities.Station.list('sortOrder', 100).catch(() => []),
    ]).then(([cats, stns]) => {
      setFormCategories(cats);
      setFormStations(stns.filter(s => s.isActive !== false));
    });
  }, []);

  const addCategory = async () => {
    const name = newCatInput.trim().toLowerCase();
    if (!name || formCategories.includes(name)) return;
    const updated = [...formCategories, name];
    setFormCategories(updated);
    setNewCatInput('');
    await saveCategories(updated);
  };

  const deleteCategory = async (cat) => {
    const updated = formCategories.filter(c => c !== cat);
    setFormCategories(updated);
    if (form.category === cat) set('category', '');
    await saveCategories(updated);
  };

  const renameCategory = async () => {
    if (!editingCat) return;
    const newName = editingCat.value.trim().toLowerCase();
    if (!newName || (newName !== editingCat.original && formCategories.includes(newName))) { setEditingCat(null); return; }
    const updated = formCategories.map(c => c === editingCat.original ? newName : c);
    setFormCategories(updated);
    if (form.category === editingCat.original) set('category', newName);
    setEditingCat(null);
    await saveCategories(updated);
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const uploader = base44.integrations?.Core?.UploadFile;
      const result = uploader ? await uploader({ file }) : { file_url: URL.createObjectURL(file) };
      set('photo_url', result?.file_url || '');
    } finally {
      setPhotoUploading(false);
    }
  };

  useEffect(() => {
    if (recipe?.id) {
      base44.entities.RecipeIngredient.filter({ recipeId: recipe.id }, 'sortOrder', 50).then(d => setIngredients(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
      base44.entities.RecipeStep.filter({ recipeId: recipe.id }, 'sortOrder', 50).then(d => setSteps(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
    }
  }, [recipe?.id]);

  useEffect(() => {
    if (activeTab !== 'ingredients') return;
    Promise.all([
      base44.entities.PurchasedItem.list('itemName', 300).catch(() => []),
      base44.entities.Recipe.list('name', 200).catch(() => []),
    ]).then(([items, recipes]) => {
      setPurchasedItemsList(items.filter(i => i.active !== false));
      setAllRecipesList(recipes.filter(r => r.id !== recipe?.id));
    });
  }, [activeTab]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm(p => ({ ...p, [k]: p[k]?.includes(v) ? p[k].filter(x => x !== v) : [...(p[k] || []), v] }));

  const tabs = ['basics', 'yield', 'ingredients', 'method', 'conversions', 'allergens', 'review'];

  const addIngredient = () => setIngredients(p => [...p, { ingredientName: '', quantity: '', unit: '', prepNote: '', sortOrder: p.length, _new: true }]);
  const addStep = () => setSteps(p => [...p, { instruction: '', sortOrder: p.length, _new: true }]);

  const linkIngredient = (rawIdx, type, id, label, unit) => {
    setIngredients(p => p.map((x, i) => i === rawIdx ? {
      ...x,
      ingredientName: x.ingredientName || label,
      purchasedItemId: type === 'purchased_item' ? id : null,
      linkedRecipeId: type === 'recipe' ? id : null,
      linkedLabel: label,
      linkedType: type,
      unit: unit || x.unit,
      _dirty: true,
    } : x));
    setLinkingIdx(null);
    setLinkSearch('');
  };

  const clearIngredientLink = (rawIdx) => {
    setIngredients(p => p.map((x, i) => i === rawIdx ? {
      ...x, purchasedItemId: null, linkedRecipeId: null, linkedLabel: null, linkedType: null, _dirty: true,
    } : x));
  };

  const addConversion = () => set('unitConversions', [...(form.unitConversions || []), { fromUnit: '', toUnit: '', factor: '' }]);
  const updateConversion = (i, field, val) => set('unitConversions', form.unitConversions.map((c, ci) => ci === i ? { ...c, [field]: val } : c));
  const removeConversion = (i) => set('unitConversions', form.unitConversions.filter((_, ci) => ci !== i));

  const checkDuplicate = async () => {
    if (recipe?.id) return false; // editing existing — skip
    const existing = await base44.entities.Recipe.list('-updated_date', 200).catch(() => []);
    const name = form.name.trim().toLowerCase();
    return existing.some(r => r.name?.trim().toLowerCase() === name);
  };

  const handleSaveDraft = async () => {
    if (!form.name.trim()) return;
    setNameError('');
    setSaving(true);
    if (await checkDuplicate()) {
      setNameError('A recipe with this name already exists.');
      setSaving(false);
      setActiveTab('basics');
      return;
    }
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
    setNameError('');
    setSaving(true);
    if (await checkDuplicate()) {
      setNameError('A recipe with this name already exists.');
      setSaving(false);
      setActiveTab('basics');
      return;
    }
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

  const fieldCls = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40";
  const labelCls = "text-xs font-bold text-muted-foreground block mb-1.5";

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 lg:px-6 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm lg:text-base font-extrabold text-foreground">{recipe ? 'Edit Recipe' : 'New Recipe'}</h2>
          <p className="text-[10px] lg:text-xs text-muted-foreground truncate">{form.name || 'Untitled'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSaveDraft} className="btn-secondary text-xs h-8 px-3">
            {saving ? '…' : 'Save Draft'}
          </button>
          <button onClick={save} disabled={saving} className="btn-primary text-xs h-8 px-3">
            {saving ? '…' : 'Approve'}
          </button>
        </div>
      </div>

      {/* Mobile horizontal tabs */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-3 pt-4 pb-2 shrink-0 scrollbar-hide" style={{ background: 'rgba(5,8,14,0.97)' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex-shrink-0 flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize whitespace-nowrap transition-all', activeTab === tab ? 'glow-active' : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive')}>
            {tab}
          </button>
        ))}
      </div>

      {/* Body: sidebar + content on desktop */}
      <div className="flex-1 overflow-hidden lg:flex">
        {/* Desktop vertical tab sidebar */}
        <div className="hidden lg:flex flex-col w-52 border-r border-border/30 px-3 py-5 gap-0.5 shrink-0 bg-card/20">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground/50 px-3 mb-2">Sections</p>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize',
                activeTab === tab
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-4 lg:py-7 pb-16">
          <div className="max-w-2xl">

            {/* BASICS TAB */}
            {activeTab === 'basics' && (
              <div className="space-y-5">
                {/* Photo upload */}
                <div>
                  <label className={labelCls}>Recipe Photo</label>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files[0])} />
                  {form.photo_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-border/60 bg-muted/20" style={{ height: 220 }}>
                      <img src={form.photo_url} alt="Recipe" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button type="button" onClick={() => photoInputRef.current?.click()} className="h-8 px-3 rounded-lg bg-black/60 text-white text-xs font-bold backdrop-blur-sm border border-white/10 hover:bg-black/80 flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5" /> Replace
                        </button>
                        <button type="button" onClick={() => set('photo_url', '')} className="h-8 w-8 rounded-lg bg-black/60 text-white backdrop-blur-sm border border-white/10 hover:bg-red-500/60 flex items-center justify-center">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading} className="w-full rounded-xl border border-dashed border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground hover:text-foreground">
                      {photoUploading
                        ? <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        : <><Camera className="h-7 w-7 opacity-40" /><span className="text-sm font-semibold">Add a photo</span><span className="text-xs opacity-60">Click to upload</span></>
                      }
                    </button>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Name *</label>
                  <input
                    value={form.name}
                    onChange={e => { set('name', e.target.value); setNameError(''); }}
                    placeholder="Recipe name"
                    className={cn(fieldCls, nameError && 'border-red-500/60 focus:ring-red-500/40')}
                  />
                  {nameError && <p className="mt-1.5 text-xs font-semibold text-red-400">{nameError}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Category</label>
                      <button type="button" onClick={() => setShowCatManager(true)} className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">Manage</button>
                    </div>
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={fieldCls}>
                      <option value="">— Select —</option>
                      {formCategories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Station</label>
                    <select value={form.station} onChange={e => set('station', e.target.value)} className={fieldCls}>
                      <option value="">— None —</option>
                      {formStations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Recipe Type</label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {[
                      { value: 'batch', label: 'Batch Recipe', desc: 'Made in bulk, used across dishes' },
                      { value: 'prep', label: 'Prep', desc: 'Pre-shift prep work' },
                      { value: 'menu_item', label: 'Menu Item', desc: 'Served directly to guests' },
                    ].map(({ value, label, desc }) => {
                      const checked = form.recipeTypes.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleArr('recipeTypes', value)}
                          className={cn(
                            'flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all',
                            checked
                              ? 'bg-primary/15 border-primary/40 text-foreground'
                              : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                          )}
                        >
                          <span className={cn('mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors', checked ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background')}>
                            {checked && <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </span>
                          <div>
                            <p className="text-xs font-bold leading-tight">{label}</p>
                            <p className="text-[10px] leading-tight mt-0.5 opacity-70">{desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="max-w-xs">
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className={fieldCls}>
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Brief description…" rows={3} className={cn(fieldCls, 'resize-none')} />
                </div>
              </div>
            )}

            {/* YIELD TAB */}
            {activeTab === 'yield' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Yield Amount</label>
                    <input type="number" value={form.yieldAmount} onChange={e => set('yieldAmount', e.target.value)} placeholder="10" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Unit</label>
                    <select value={form.yieldUnit} onChange={e => set('yieldUnit', e.target.value)} className={fieldCls}>
                      <option value="">—</option>
                      {UNITS.slice(0, 8).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Portion Size</label>
                    <input value={form.portionSize} onChange={e => set('portionSize', e.target.value)} placeholder="1 plate" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Prep Time</label>
                    <input value={form.prepTime} onChange={e => set('prepTime', e.target.value)} placeholder="15 min" className={fieldCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Cook Time</label>
                    <input value={form.cookTime} onChange={e => set('cookTime', e.target.value)} placeholder="30 min" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Shelf Life</label>
                    <input value={form.shelfLife} onChange={e => set('shelfLife', e.target.value)} placeholder="3 days" className={fieldCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Storage Location</label>
                    <input value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} placeholder="Walk-in cooler" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Container</label>
                    <input value={form.storageContainer} onChange={e => set('storageContainer', e.target.value)} placeholder="6qt cambro" className={fieldCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Label Instructions</label>
                  <input value={form.labelingInstructions} onChange={e => set('labelingInstructions', e.target.value)} placeholder="Date + contents + initials" className={fieldCls} />
                </div>
              </div>
            )}

            {/* INGREDIENTS TAB */}
            {activeTab === 'ingredients' && (() => {
              const q = linkSearch.toLowerCase();
              const filteredPurchased = purchasedItemsList.filter(i => !q || i.itemName?.toLowerCase().includes(q)).slice(0, 6);
              const filteredRecipes = allRecipesList.filter(r => !q || r.name?.toLowerCase().includes(q)).slice(0, 5);
              return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">Ingredients ({ingredients.filter(i => !i._deleted).length})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Link each to a purchased item or sub-recipe for cost tracking</p>
                  </div>
                  <button onClick={addIngredient} className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                {ingredients.filter(i => !i._deleted).length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">No ingredients yet</p>
                    <button onClick={addIngredient} className="mt-3 text-xs font-bold text-primary">+ Add first ingredient</button>
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_90px_32px] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Ingredient</span><span>Qty</span><span>Unit</span><span />
                    </div>
                    {ingredients.filter(i => !i._deleted).map((ing, idx) => {
                      const rawIdx = ingredients.indexOf(ing);
                      return (
                      <div key={rawIdx} className={`border-t border-border/50 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <div className="grid grid-cols-[1fr_80px_90px_32px] gap-2 px-3 pt-2 pb-1 items-center">
                          <input value={ing.ingredientName} onChange={e => setIngredients(p => p.map((x,i) => i===rawIdx ? {...x, ingredientName: e.target.value, _dirty: true} : x))} placeholder="Ingredient name" className="px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
                          <input type="number" value={ing.quantity} onChange={e => setIngredients(p => p.map((x,i) => i===rawIdx ? {...x, quantity: e.target.value, _dirty: true} : x))} placeholder="0" className="px-2 py-1.5 bg-background border border-border rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/40" />
                          <select value={ing.unit} onChange={e => setIngredients(p => p.map((x,i) => i===rawIdx ? {...x, unit: e.target.value, _dirty: true} : x))} className="px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none">
                            <option value="">—</option>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <button onClick={() => setIngredients(p => p.map((x,i) => i===rawIdx ? {...x, _deleted: true} : x))} className="flex items-center justify-center text-red-400 hover:text-red-300">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {/* Link row */}
                        <div className="px-3 pb-2">
                          {(ing.purchasedItemId || ing.linkedRecipeId) ? (
                            <div className="flex items-center gap-2">
                              <span className={cn('text-[10px] font-bold flex items-center gap-1', ing.linkedType === 'recipe' ? 'text-blue-400' : 'text-green-400')}>
                                <Link2 className="h-2.5 w-2.5" />
                                {ing.linkedType === 'recipe' ? '⚙️' : '📦'} {ing.linkedLabel}
                              </span>
                              <button onClick={() => { setLinkingIdx(rawIdx); setLinkSearch(''); }} className="text-[9px] text-muted-foreground hover:text-foreground underline">change</button>
                              <button onClick={() => clearIngredientLink(rawIdx)} className="text-[9px] text-red-400 hover:text-red-300 underline">remove</button>
                            </div>
                          ) : (
                            <button onClick={() => { setLinkingIdx(linkingIdx === rawIdx ? null : rawIdx); setLinkSearch(''); }} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                              <Link2 className="h-2.5 w-2.5" /> Link to purchased item or sub-recipe
                            </button>
                          )}
                        </div>
                        {/* Picker dropdown */}
                        {linkingIdx === rawIdx && (
                          <div className="mx-3 mb-3 border border-primary/30 bg-card rounded-xl overflow-hidden shadow-lg">
                            <div className="p-2 border-b border-border/50">
                              <input
                                autoFocus
                                value={linkSearch}
                                onChange={e => setLinkSearch(e.target.value)}
                                placeholder="Search purchased items or recipes…"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                              />
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                              {filteredPurchased.length > 0 && (
                                <>
                                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/60 px-3 pt-2 pb-1">📦 Purchased Items</p>
                                  {filteredPurchased.map(item => (
                                    <button key={item.id} onClick={() => linkIngredient(rawIdx, 'purchased_item', item.id, item.itemName, item.recipeUnit)}
                                      className="w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center justify-between gap-2 transition-colors">
                                      <span className="text-sm font-semibold text-foreground">{item.itemName}</span>
                                      <span className="text-xs text-muted-foreground shrink-0">
                                        {item.costPerRecipeUnit ? `$${parseFloat(item.costPerRecipeUnit).toFixed(3)}/${item.recipeUnit}` : 'No cost'}
                                      </span>
                                    </button>
                                  ))}
                                </>
                              )}
                              {filteredRecipes.length > 0 && (
                                <>
                                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/60 px-3 pt-2 pb-1">⚙️ Sub-Recipes</p>
                                  {filteredRecipes.map(r => (
                                    <button key={r.id} onClick={() => linkIngredient(rawIdx, 'recipe', r.id, r.name, r.yieldUnit)}
                                      className="w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center justify-between gap-2 transition-colors">
                                      <span className="text-sm font-semibold text-foreground">{r.name}</span>
                                      <span className="text-xs text-muted-foreground capitalize shrink-0">{r.category || 'recipe'} · {r.yieldAmount}{r.yieldUnit ? ` ${r.yieldUnit}` : ''}</span>
                                    </button>
                                  ))}
                                </>
                              )}
                              {filteredPurchased.length === 0 && filteredRecipes.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6">No matches</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })()}

            {/* METHOD TAB */}
            {activeTab === 'method' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">Steps ({steps.filter(s => !s._deleted).length})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Prep method, assembly, and plating in order</p>
                    </div>
                    <button onClick={addStep} className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80">
                      <Plus className="h-3.5 w-3.5" /> Add Step
                    </button>
                  </div>
                  {steps.filter(s => !s._deleted).length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-border/50 rounded-xl">
                      <p className="text-sm text-muted-foreground">No steps yet</p>
                      <button onClick={addStep} className="mt-3 text-xs font-bold text-primary">+ Add first step</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {steps.filter(s => !s._deleted).map((step, idx) => (
                        <div key={idx} className="flex gap-3 items-start bg-muted/20 rounded-xl p-3 border border-border/40">
                          <div className="h-7 w-7 rounded-full bg-primary/20 text-primary text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</div>
                          <textarea value={step.instruction} onChange={e => setSteps(p => p.map((x,i) => i===idx ? {...x, instruction: e.target.value, _dirty: true} : x))} placeholder="Describe this step…" rows={2} className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40" />
                          <button onClick={() => setSteps(p => p.map((x,i) => i===idx ? {...x, _deleted: true} : x))} className="text-red-400 hover:text-red-300 mt-1 shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/30 pt-6 space-y-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Additional Notes</p>
                  <div>
                    <label className={labelCls}>Plating Instructions</label>
                    <textarea value={form.platingNotes} onChange={e => set('platingNotes', e.target.value)} placeholder="How to plate and present this dish…" rows={3} className={cn(fieldCls, 'resize-none')} />
                  </div>
                  <div>
                    <label className={labelCls}>Assembly / Build Card Notes</label>
                    <textarea value={form.buildCardNotes} onChange={e => set('buildCardNotes', e.target.value)} placeholder="Line execution and build card notes…" rows={3} className={cn(fieldCls, 'resize-none')} />
                  </div>
                </div>
              </div>
            )}

            {/* CONVERSIONS TAB */}
            {activeTab === 'conversions' && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Custom Unit Conversions</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Define conversions for units that can't normally be converted — e.g., 1 head = 12 oz, 1 each = 3.5 oz. These are applied in cost calculations for this recipe.</p>
                </div>
                {(form.unitConversions || []).length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">No custom conversions defined</p>
                    <button onClick={addConversion} className="mt-3 text-xs font-bold text-primary">+ Add a conversion</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_24px_1fr_96px_32px] gap-2 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>From Unit</span><span /><span>To Unit</span><span>Factor (×)</span><span />
                    </div>
                    {(form.unitConversions || []).map((conv, i) => (
                      <div key={i} className="grid grid-cols-[1fr_24px_1fr_96px_32px] gap-2 items-center bg-muted/20 rounded-xl px-3 py-2.5 border border-border/40">
                        <input
                          value={conv.fromUnit}
                          onChange={e => updateConversion(i, 'fromUnit', e.target.value)}
                          placeholder="head"
                          className={fieldCls}
                        />
                        <span className="text-muted-foreground text-xs font-bold text-center">→</span>
                        <input
                          value={conv.toUnit}
                          onChange={e => updateConversion(i, 'toUnit', e.target.value)}
                          placeholder="oz"
                          className={fieldCls}
                        />
                        <input
                          type="number"
                          value={conv.factor}
                          onChange={e => updateConversion(i, 'factor', e.target.value)}
                          placeholder="12"
                          className={fieldCls}
                        />
                        <button onClick={() => removeConversion(i)} className="flex items-center justify-center text-red-400 hover:text-red-300 shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={addConversion} className="w-full border border-dashed border-border/50 rounded-xl py-2.5 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Conversion
                </button>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">How It Works</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Set the <span className="font-bold text-foreground">From Unit</span> (how you measure it in this recipe), the <span className="font-bold text-foreground">To Unit</span> (how it's priced in your purchasing system), and the <span className="font-bold text-foreground">Factor</span> — how many To Units equal one From Unit.</p>
                  <p className="text-xs text-muted-foreground">Example: from <span className="font-bold text-foreground">head</span> → to <span className="font-bold text-foreground">oz</span>, factor <span className="font-bold text-foreground">12</span> means 1 head = 12 oz.</p>
                </div>
              </div>
            )}

            {/* ALLERGENS TAB */}
            {activeTab === 'allergens' && (
              <div className="space-y-6">
                <div>
                  <label className={labelCls}>Allergens</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ALLERGEN_LIST.map(a => (
                      <button key={a} onClick={() => toggleArr('allergens', a)} className={cn('px-3 py-1.5 rounded-lg border text-sm font-bold transition-all', form.allergens?.includes(a) ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground')}>{a}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Dietary Flags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DIETARY_FLAGS.map(f => (
                      <button key={f} onClick={() => toggleArr('dietaryFlags', f)} className={cn('px-3 py-1.5 rounded-lg border text-sm font-bold transition-all', form.dietaryFlags?.includes(f) ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground')}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* REVIEW TAB */}
            {activeTab === 'review' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
                  {[
                    { label: 'Name', ok: !!form.name, value: form.name || 'Missing' },
                    { label: 'Yield', ok: !!form.yieldAmount, value: form.yieldAmount ? `${form.yieldAmount} ${form.yieldUnit || ''}` : 'Not set' },
                    { label: 'Ingredients', ok: ingredients.filter(i => !i._deleted).length > 0, value: `${ingredients.filter(i => !i._deleted).length} item(s)` },
                    { label: 'Steps', ok: steps.filter(s => !s._deleted).length > 0, value: `${steps.filter(s => !s._deleted).length} step(s)` },
                    { label: 'Station', ok: !!form.station, value: form.station || 'Not set' },
                  ].map(({ label, ok, value }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
                      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{value}</span>
                        <span className={cn('text-sm font-bold', ok ? 'text-green-400' : 'text-amber-400')}>{ok ? '✓' : '○'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground bg-muted/20 rounded-xl p-4">
                  Save as Draft to continue editing, or Approve to publish this recipe.
                </p>
                <div className="flex gap-3">
                  <button onClick={handleSaveDraft} className="flex-1 btn-secondary h-10 text-sm">{saving ? '…' : 'Save Draft'}</button>
                  <button onClick={save} disabled={saving} className="flex-1 btn-primary h-10 text-sm">{saving ? '…' : 'Approve Recipe'}</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Category Manager */}
      {showCatManager && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">Manage Categories</h3>
              <button onClick={() => { setShowCatManager(false); setEditingCat(null); }} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {formCategories.map(cat => (
                <div key={cat} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                  {editingCat?.original === cat ? (
                    <input
                      autoFocus
                      value={editingCat.value}
                      onChange={e => setEditingCat(p => ({ ...p, value: e.target.value }))}
                      onBlur={renameCategory}
                      onKeyDown={e => { if (e.key === 'Enter') renameCategory(); if (e.key === 'Escape') setEditingCat(null); }}
                      className="flex-1 px-2 py-0.5 bg-background border border-primary/40 rounded text-sm text-foreground focus:outline-none"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-semibold text-foreground capitalize cursor-text" onClick={() => setEditingCat({ original: cat, value: cat })}>{cat}</span>
                  )}
                  <button onClick={() => deleteCategory(cat)} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {formCategories.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No categories yet</p>}
            </div>
            <div className="px-4 pb-4 pt-3 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground mb-2">Click a name to rename it.</p>
              <div className="flex gap-2">
                <input
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                  placeholder="New category name…"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <button onClick={addCategory} className="btn-primary px-3 h-9 text-sm">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Recipes() {
  const { isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStation, setFilterStation] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [stationsList, setStationsList] = useState([]);

  const load = async () => {
    setLoading(true);
    const [data, cats, stns] = await Promise.all([
      base44.entities.Recipe.list('-updated_date', 200).catch(() => []),
      loadCategories(),
      base44.entities.Station.list('sortOrder', 100).catch(() => []),
    ]);
    setRecipes(data);
    setCategories(cats);
    setStationsList(stns.filter(s => s.isActive !== false));
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

  if (selected) return <RecipeDetail recipe={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onEdit={r => { setSelected(null); setEditing(r); setShowForm(true); }} onDuplicate={handleDuplicate} onArchive={handleArchive} />;
  if (showForm) return <RecipeForm recipe={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />;

  return (
    <div className="app-screen">
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
              <div className="flex items-center gap-2">
                <button onClick={() => { haptics.light(); navigate('/recipe-bulk-import'); }} className="h-8 px-3 rounded-lg bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 active:scale-95">
                  <Sparkles className="h-3.5 w-3.5" /> Bulk Import
                </button>
                <button onClick={() => { setEditing(null); setShowForm(true); haptics.medium(); }} className="btn-primary h-8 px-3 text-xs flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New Recipe
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Desktop 2-panel */}
      <div className="hidden lg:grid lg:grid-cols-[180px_1fr] lg:gap-0 lg:mt-14" style={{ height: 'calc(100vh - 176px)' }}>
        {/* LEFT: Filters */}
        <div className="border-r border-border/30 overflow-y-auto p-3 space-y-3">
          {/* CATEGORY */}
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">CATEGORY</p>
            <div className="space-y-0.5">
              {['all', ...categories].map(c => {
                const count = c === 'all' ? recipes.filter(r => r.status !== 'archived').length : recipes.filter(r => r.category === c && r.status !== 'archived').length;
                return (
                  <button key={c} onClick={() => setFilterCat(c)} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === c ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                    <span className="capitalize">{c}</span>
                    <span className={`text-[9px] font-bold ${filterCat === c ? 'text-primary/60' : 'text-muted-foreground'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATION */}
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">STATION</p>
            <div className="space-y-0.5">
              {stationsList.map(s => {
                const count = recipes.filter(r => r.station === s.name && r.status !== 'archived').length;
                return (
                  <button key={s.id} onClick={() => setFilterStation(filterStation === s.name ? '' : s.name)} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStation === s.name ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                    <span>{s.name}</span>
                    <span className={`text-[9px] font-bold ${filterStation === s.name ? 'text-primary/60' : 'text-muted-foreground'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATUS */}
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">STATUS</p>
            <div className="space-y-0.5">
              <button onClick={() => setFilterCat('all')} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === 'all' ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                <span>Active</span>
                <span className={`text-[9px] font-bold ${filterCat === 'all' ? 'text-primary/60' : 'text-muted-foreground'}`}>{recipes.filter(r => r.status !== 'archived').length}</span>
              </button>
              <button onClick={() => setFilterCat('archived')} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === 'archived' ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                <span>Archived</span>
                <span className={`text-[9px] font-bold ${filterCat === 'archived' ? 'text-primary/60' : 'text-muted-foreground'}`}>{recipes.filter(r => r.status === 'archived').length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recipe list */}
        <div className="overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No recipes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-2">
              {filtered.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => { haptics.light(); setSelected(r); }} />)}
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
              <h1 className="text-2xl font-black tracking-tight text-foreground">Recipes</h1>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => { haptics.light(); navigate('/recipe-bulk-import'); }} className="h-8 w-8 rounded-full bg-muted text-foreground flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </button>
                <button onClick={() => { setEditing(null); setShowForm(true); haptics.medium(); }} className="h-8 w-8 rounded-full btn-primary flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Multi-view operational recipe system</p>
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes…" className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {['all', ...categories, 'archived'].map(c => (
              <button key={c} onClick={() => setFilterCat(c)} className={`flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all duration-200 ${filterCat === c ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5">
          <button onClick={() => setFilterStation('')} className={`flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${!filterStation ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'}`}>All Stations</button>
          {stationsList.map(s => (
            <button key={s.id} onClick={() => setFilterStation(filterStation === s.name ? '' : s.name)} className={`flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${filterStation === s.name ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'}`}>{s.name}</button>
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