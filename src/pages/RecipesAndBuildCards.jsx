import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plus, Search, ChevronRight, Clock, Image as ImageIcon, AlertCircle, BookMarked, Flame, ArrowLeft } from "lucide-react";
import MetricTile from "../components/MetricTile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const FILTERS = ["All", "Prep", "Line", "Bar", "Bakery", "Training", "Favorites"];

const CATEGORIES = {
  appetizer: { label: "Appetizer", color: "text-blue-400" },
  entree: { label: "Entree", color: "text-orange-400" },
  side: { label: "Side", color: "text-cyan-400" },
  bar: { label: "Bar", color: "text-purple-400" },
  dessert: { label: "Dessert", color: "text-pink-400" },
  bakery: { label: "Bakery", color: "text-yellow-400" },
  training: { label: "Training", color: "text-green-400" },
  other: { label: "Other", color: "text-gray-400" },
};

const RECIPE_TYPES = {
  prep: { label: "Prep", icon: "🔪", filter: "Prep" },
  line: { label: "Line", icon: "🍳", filter: "Line" },
  bar: { label: "Bar", icon: "🍸", filter: "Bar" },
  bakery: { label: "Bakery", icon: "🥐", filter: "Bakery" },
  training: { label: "Training", icon: "📚", filter: "Training" },
};

export default function RecipesAndBuildCards() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [form, setForm] = useState({
    name: "", category: "entree", description: "", yield: "", prep_time: "",
    ingredients: "", instructions: "", photo_url: "", requires_photo: false,
    recipe_type: "prep", is_training: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.Recipe.list("-updated_date", 200);
      setRecipes(all.filter(r => r.is_active !== false));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = recipes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.ingredients?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    if (filter !== "All") {
      if (filter === "Favorites") result = result.filter(r => favorites.has(r.id));
      else if (filter === "Training") result = result.filter(r => r.is_training);
      else result = result.filter(r => r.recipe_type === filter.toLowerCase());
    }
    return result.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  }, [recipes, search, filter, favorites]);

  const featured = filtered.length > 0 ? filtered[0] : null;
  const stats = useMemo(() => ({
    active: recipes.filter(r => r.is_active !== false).length,
    updated: recipes.filter(r => {
      const days = (Date.now() - new Date(r.updated_date)) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length,
    lowYield: recipes.filter(r => r.yield && parseInt(r.yield) < 2).length,
    training: recipes.filter(r => r.is_training).length,
  }), [recipes]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const created = await base44.entities.Recipe.create(form);
    setRecipes(prev => [created, ...prev]);
    setDialogOpen(false);
    setForm({
      name: "", category: "entree", description: "", yield: "", prep_time: "",
      ingredients: "", instructions: "", photo_url: "", requires_photo: false,
      recipe_type: "prep", is_training: false,
    });
    setSaving(false);
    toast.success("Recipe created");
  };

  const toggleFavorite = (id) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(id)) newFavs.delete(id);
    else newFavs.add(id);
    setFavorites(newFavs);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors active:scale-95">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Recipes &amp; Build Cards</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Kitchen &amp; bar recipes</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setDialogOpen(true)}
              className="h-9 px-3 flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-lg active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes, ingredients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide mb-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="px-4 grid grid-cols-4 gap-1.5 mb-4">
        <MetricTile label="Active" value={stats.active} />
        <MetricTile label="Updated" value={stats.updated} />
        <MetricTile label="Low Yield" value={stats.lowYield} alert={stats.lowYield > 0} />
        <MetricTile label="Training" value={stats.training} />
      </div>

      {/* Featured Recipe */}
      {featured && (
        <div className="px-4 mb-4">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-widest">Featured</p>
          <button
            onClick={() => setDetailOpen(featured)}
            className="w-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all active:scale-[0.99]"
          >
            {featured.photo_url && (
              <img src={featured.photo_url} alt={featured.name} className="w-full h-40 object-cover" />
            )}
            <div className={cn("p-3 space-y-2", !featured.photo_url && "pt-4")}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-foreground leading-tight">{featured.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] font-bold", CATEGORIES[featured.category]?.color || "text-gray-400")}>
                      {CATEGORIES[featured.category]?.label || featured.category}
                    </span>
                    {featured.yield && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{featured.yield}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleFavorite(featured.id);
                  }}
                  className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"
                >
                  <BookMarked className={cn("h-4 w-4", favorites.has(featured.id) ? "text-primary fill-primary" : "text-muted-foreground")} />
                </button>
              </div>
              {featured.requires_photo && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 w-fit">
                  <ImageIcon className="h-3 w-3" /> Photo Required
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                Updated {formatDistanceToNow(new Date(featured.updated_date), { addSuffix: true })}
              </p>
              <button className="w-full h-8 text-xs font-bold text-primary-foreground bg-primary rounded-lg active:scale-95 transition-transform">
                Open
              </button>
            </div>
          </button>
        </div>
      )}

      {/* Recipe List */}
      <div className="px-4 space-y-2 mb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">No recipes found</div>
        ) : (
          filtered.map(recipe => (
            <button
              key={recipe.id}
              onClick={() => setDetailOpen(recipe)}
              className="w-full bg-card border border-border rounded-xl p-3 text-left hover:border-primary/30 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{recipe.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className={cn("text-[10px] font-bold", CATEGORIES[recipe.category]?.color || "text-gray-400")}>
                      {CATEGORIES[recipe.category]?.label || recipe.category}
                    </span>
                    {recipe.yield && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{recipe.yield}</span>
                      </>
                    )}
                    {recipe.recipe_type && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{recipe.recipe_type}</span>
                      </>
                    )}
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" /> {formatDistanceToNow(new Date(recipe.updated_date), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleFavorite(recipe.id);
                  }}
                  className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"
                >
                  <BookMarked className={cn("h-3.5 w-3.5", favorites.has(recipe.id) ? "text-primary fill-primary" : "text-muted-foreground")} />
                </button>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 max-h-96 overflow-y-auto">
            <div>
              <Label>Recipe Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Grilled Salmon"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([v, m]) => (
                      <SelectItem key={v} value={v}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.recipe_type} onValueChange={v => setForm({ ...form, recipe_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECIPE_TYPES).map(([v, m]) => (
                      <SelectItem key={v} value={v}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Yield</Label>
                <Input
                  value={form.yield}
                  onChange={e => setForm({ ...form, yield: e.target.value })}
                  placeholder="e.g., 4 portions"
                />
              </div>
              <div>
                <Label>Prep Time</Label>
                <Input
                  value={form.prep_time}
                  onChange={e => setForm({ ...form, prep_time: e.target.value })}
                  placeholder="e.g., 15 min"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Short description..."
              />
            </div>
            <div>
              <Label>Ingredients</Label>
              <Textarea
                value={form.ingredients}
                onChange={e => setForm({ ...form, ingredients: e.target.value })}
                rows={2}
                placeholder="List ingredients..."
              />
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea
                value={form.instructions}
                onChange={e => setForm({ ...form, instructions: e.target.value })}
                rows={2}
                placeholder="Step-by-step instructions..."
              />
            </div>
            <div>
              <Label>Photo URL</Label>
              <Input
                value={form.photo_url}
                onChange={e => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requires_photo}
                onChange={e => setForm({ ...form, requires_photo: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-xs font-semibold text-foreground">Requires photo for completion</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_training}
                onChange={e => setForm({ ...form, is_training: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-xs font-semibold text-foreground">Training recipe</span>
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 active:scale-95 transition-transform"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/75" onClick={() => setDetailOpen(null)} />
          <div className="relative bg-card border-t border-border rounded-t-2xl overflow-y-auto max-h-[90vh] z-10" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <h2 className="text-lg font-bold text-foreground">{detailOpen.name}</h2>
              <button
                onClick={() => setDetailOpen(null)}
                className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-foreground text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              {detailOpen.photo_url && (
                <img src={detailOpen.photo_url} alt={detailOpen.name} className="w-full h-48 object-cover rounded-lg" />
              )}
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Details</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="px-2 py-1 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground">
                      {CATEGORIES[detailOpen.category]?.label || detailOpen.category}
                    </span>
                    {detailOpen.yield && (
                      <span className="px-2 py-1 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground">
                        Yield: {detailOpen.yield}
                      </span>
                    )}
                    {detailOpen.prep_time && (
                      <span className="px-2 py-1 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground">
                        {detailOpen.prep_time}
                      </span>
                    )}
                  </div>
                </div>
                {detailOpen.description && (
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Description</p>
                    <p className="text-xs text-foreground leading-relaxed mt-1.5">{detailOpen.description}</p>
                  </div>
                )}
                {detailOpen.ingredients && (
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Ingredients</p>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed mt-1.5">{detailOpen.ingredients}</p>
                  </div>
                )}
                {detailOpen.instructions && (
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Instructions</p>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed mt-1.5">{detailOpen.instructions}</p>
                  </div>
                )}
                {detailOpen.requires_photo && (
                  <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 text-xs font-semibold">
                    <ImageIcon className="h-4 w-4 flex-shrink-0" /> Photo Required
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Add Button */}
      {isAdmin && (
        <div className="fixed left-0 right-0 bottom-20 z-30 px-4 flex gap-2 lg:left-64" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" /> Add Recipe
          </button>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;