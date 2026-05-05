import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Plus, ChefHat, Image, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all",       label: "All" },
  { value: "appetizer", label: "Appetizers" },
  { value: "entree",    label: "Entrees" },
  { value: "side",      label: "Sides" },
  { value: "bar",       label: "Bar" },
  { value: "dessert",   label: "Desserts" },
];

const CAT_COLORS = {
  appetizer: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  entree:    "text-blue-400   bg-blue-500/10   border-blue-500/20",
  side:      "text-amber-400  bg-amber-500/10  border-amber-500/20",
  bar:       "text-purple-400 bg-purple-500/10 border-purple-500/20",
  dessert:   "text-pink-400   bg-pink-500/10   border-pink-500/20",
  other:     "text-gray-400   bg-gray-500/10   border-gray-500/20",
};

const CAT_LABELS = {
  appetizer: "Appetizer", entree: "Entree", side: "Side",
  bar: "Bar", dessert: "Dessert", other: "Other",
};

// ─── Recipe Form ─────────────────────────────────────────────────────────────
function RecipeForm({ initial, onClose, onSaved }) {
  const blank = { name: "", category: "entree", description: "", photo_url: "", ingredients: "", instructions: "", allergens: "", modifications: "", plating_notes: "", is_active: true };
  const [form, setForm] = useState(initial ? { ...blank, ...initial } : blank);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("photo_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    let result;
    if (initial?.id) {
      result = await base44.entities.Recipe.update(initial.id, form);
    } else {
      result = await base44.entities.Recipe.create(form);
    }
    onSaved(result);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#0B1018] border-t border-[#1E2A3B] rounded-t-2xl z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235] shrink-0">
          <p className="text-[15px] font-bold text-white">{initial ? "Edit Recipe" : "New Recipe"}</p>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="overflow-y-auto px-4 py-3 space-y-3 pb-6">
          {/* Photo */}
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-xl border border-[#1E2A3B] bg-[#0F1623] flex items-center justify-center overflow-hidden shrink-0">
              {form.photo_url
                ? <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
                : <Image className="h-5 w-5 text-gray-600" />}
            </div>
            <label className={cn("h-9 px-3 rounded-xl border text-[12px] font-bold cursor-pointer flex items-center gap-1.5 transition-all", uploading ? "text-gray-600 border-[#1E2A3B]" : "text-primary border-primary/25 bg-primary/10")}>
              {uploading ? "Uploading…" : "Upload Photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
            </label>
          </div>

          {[
            { label: "Recipe Name *", key: "name", placeholder: "e.g. Grilled Salmon" },
            { label: "Short Description", key: "description", placeholder: "Brief description for staff" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">{f.label}</label>
              <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                className="w-full h-9 px-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-700" />
            </div>
          ))}

          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.filter(f => f.value !== "all").map(f => (
                <button key={f.value} onClick={() => set("category", f.value)}
                  className={cn("px-3 py-1 rounded-full text-[11px] font-bold border transition-all",
                    form.category === f.value ? "bg-primary text-primary-foreground border-primary" : "border-[#1E2A3B] text-gray-500")}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: "Ingredients", key: "ingredients", rows: 3, placeholder: "List ingredients…" },
            { label: "Instructions", key: "instructions", rows: 3, placeholder: "Step-by-step build instructions…" },
            { label: "Allergens", key: "allergens", rows: 1, placeholder: "e.g. Dairy, Gluten, Nuts" },
            { label: "Modifications", key: "modifications", rows: 1, placeholder: "e.g. Can be made GF" },
            { label: "Plating Notes", key: "plating_notes", rows: 2, placeholder: "Describe plating / garnish…" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">{f.label}</label>
              <textarea value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} rows={f.rows}
                className="w-full px-3 py-2 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-gray-700" />
            </div>
          ))}
        </div>
        <div className="px-4 pb-6 pt-2 border-t border-[#1A2235] shrink-0">
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[14px] font-bold disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Sheet ────────────────────────────────────────────────────────────
function RecipeDetail({ recipe, onClose, onEdit }) {
  const cat = CAT_COLORS[recipe.category] || CAT_COLORS.other;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#0B1018] border-t border-[#1E2A3B] rounded-t-2xl z-10 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235] shrink-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cat)}>{CAT_LABELS[recipe.category]}</span>
            <p className="text-[15px] font-bold text-white">{recipe.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="text-[12px] font-bold text-primary">Edit</button>
            <button onClick={onClose}><X className="h-4 w-4 text-gray-500" /></button>
          </div>
        </div>
        <div className="overflow-y-auto px-4 py-4 space-y-4 pb-8">
          {recipe.photo_url && (
            <img src={recipe.photo_url} alt={recipe.name} className="w-full h-48 object-cover rounded-xl border border-[#1E2A3B]" />
          )}
          {recipe.description && <p className="text-[13px] text-gray-400">{recipe.description}</p>}

          {[
            { label: "Ingredients", key: "ingredients" },
            { label: "Instructions", key: "instructions" },
            { label: "Plating Notes", key: "plating_notes" },
            { label: "Allergens", key: "allergens" },
            { label: "Modifications", key: "modifications" },
          ].filter(s => recipe[s.key]).map(s => (
            <div key={s.key}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{s.label}</p>
              <p className="text-[13px] text-white whitespace-pre-line">{recipe[s.key]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Recipe Card ─────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onViewClick }) {
  const cat = CAT_COLORS[recipe.category] || CAT_COLORS.other;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0F1623] border border-[#1E2A3B] rounded-xl">
      {/* Thumbnail */}
      <div className="h-12 w-12 rounded-lg border border-[#1A2235] bg-[#0B1018] overflow-hidden shrink-0 flex items-center justify-center">
        {recipe.photo_url
          ? <img src={recipe.photo_url} alt={recipe.name} className="h-full w-full object-cover" />
          : <ChefHat className="h-5 w-5 text-gray-700" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white truncate">{recipe.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", cat)}>{CAT_LABELS[recipe.category]}</span>
          {recipe.description && (
            <span className="text-[10px] text-gray-600 truncate">{recipe.description}</span>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onViewClick(recipe.id)}
        className="h-8 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold shrink-0 active:scale-95 transition-transform flex items-center gap-1"
      >
        <Eye className="h-3 w-3" /> View
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Recipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);

  useEffect(() => {
    base44.entities.Recipe.list("-updated_date", 300).then(data => {
      setRecipes(data.filter(r => r.is_active !== false));
      setLoading(false);
    });
  }, []);

  const handleSaved = (result) => {
    setRecipes(prev => {
      const existing = prev.find(r => r.id === result.id);
      return existing ? prev.map(r => r.id === result.id ? result : r) : [result, ...prev];
    });
    setShowForm(false);
    setEditingRecipe(null);
    if (viewingRecipe?.id === result.id) setViewingRecipe(result);
  };

  const openEdit = (recipe) => {
    setViewingRecipe(null);
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const filtered = useMemo(() => {
    let list = recipes;
    if (filter !== "all") list = list.filter(r => r.category === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [recipes, filter, search]);

  // Metrics
  const total = recipes.length;
  const mostUsed = recipes.reduce((a, b) => (b.use_count || 0) > (a.use_count || 0) ? b : a, {});
  const recentCount = recipes.filter(r => {
    const d = new Date(r.updated_date);
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const photoPct = total ? Math.round((recipes.filter(r => r.photo_url).length / total) * 100) : 0;

  const metrics = [
    { label: "Total",    value: total },
    { label: "Most Used", value: mostUsed.name ? mostUsed.name.split(" ")[0] : "—", small: true },
    { label: "Updated",  value: recentCount },
    { label: "Photos",   value: `${photoPct}%`, color: photoPct >= 80 ? "text-emerald-400" : photoPct >= 50 ? "text-amber-400" : "text-red-400" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[480px] flex flex-col gap-3 pb-28">

      {/* Header */}
      <div className="pt-1">
        <h1 className="text-[17px] font-extrabold text-white tracking-tight">Recipes</h1>
        <p className="text-[11px] text-gray-600 mt-0.5">Build it right every time</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes…"
          className="w-full h-9 pl-9 pr-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 h-7 px-3 rounded-full text-[11px] font-bold border transition-all",
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-[#0F1623] text-gray-500 border-[#1E2A3B]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-1.5">
        {metrics.map(m => (
          <div key={m.label} className="flex flex-col items-center text-center bg-[#111827] border border-[#1F2937] rounded-xl p-2 min-w-0">
            <span className={cn("text-[16px] font-extrabold leading-none truncate w-full text-center", m.color || "text-white")} title={m.value}>{m.value}</span>
            <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Recipe List */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
          {filter !== "all" ? FILTERS.find(f => f.value === filter)?.label : "All Recipes"} ({filtered.length})
        </p>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-600">
            <ChefHat className="h-8 w-8 opacity-30" />
            <p className="text-[13px]">No recipes found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map(r => (
              <RecipeCard key={r.id} recipe={r} onViewClick={(id) => navigate(`/recipes/${id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditingRecipe(null); setShowForm(true); }}
        className="fixed right-4 flex items-center gap-2 h-11 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform z-30"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Plus className="h-4 w-4" /> Add Recipe
      </button>

      {/* Detail sheet */}
      {viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onEdit={() => openEdit(viewingRecipe)}
        />
      )}

      {/* Form sheet */}
      {showForm && (
        <RecipeForm
          initial={editingRecipe}
          onClose={() => { setShowForm(false); setEditingRecipe(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;