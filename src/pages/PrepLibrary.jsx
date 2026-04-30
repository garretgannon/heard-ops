import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, ChevronDown, Edit2, Trash2, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categories = ["Sauce", "Protein", "Produce", "Bakery", "Garnish", "Batch Prep", "Bar Prep"];

export default function PrepLibrary() {
  const { isAdmin } = useCurrentUser();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [printingId, setPrintingId] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Form
  const [form, setForm] = useState({
    name: "",
    category: "",
    yield: "",
    ingredients: "",
    steps: "",
    shelf_life: "",
    storage: "",
    allergens: "",
    photo_url: "",
    video_link: "",
    notes: "",
    active: true,
  });

  const load = async () => {
    const items = await base44.entities.PrepLibraryItem.list("-created_date", 500);
    setRecipes(items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) {
      toast.error("Name and category required");
      return;
    }

    if (editingId) {
      await base44.entities.PrepLibraryItem.update(editingId, form);
      toast.success("Recipe updated");
    } else {
      await base44.entities.PrepLibraryItem.create(form);
      toast.success("Recipe created");
    }

    closeDialog();
    load();
  };

  const handleEdit = (recipe) => {
    setForm(recipe);
    setEditingId(recipe.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Archive this recipe?")) return;
    await base44.entities.PrepLibraryItem.update(id, { active: false });
    toast.success("Recipe archived");
    load();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      yield: "",
      ingredients: "",
      steps: "",
      shelf_life: "",
      storage: "",
      allergens: "",
      photo_url: "",
      video_link: "",
      notes: "",
      active: true,
    });
  };

  const filtered = recipes.filter(r => {
    if (!r.active) return false;
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Kitchen Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">Recipes, prep methods, and specs for the team</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="lg:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Button onClick={() => { setEditingId(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Recipe
          </Button>
        )}
      </div>

      {/* Category Sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No recipes found.
        </div>
      ) : (
        <div className="space-y-6">
          {categories.filter(cat => filtered.some(r => r.category === cat)).map(category => (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-bold text-primary uppercase tracking-wider">{category}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.filter(r => r.category === category).map(recipe => (
                  <div key={recipe.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Photo or Placeholder */}
                    {recipe.photo_url ? (
                      <img src={recipe.photo_url} alt={recipe.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-secondary/30 flex items-center justify-center text-muted-foreground">
                        No photo
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-base">{recipe.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{recipe.yield}</p>
                      </div>

                      {/* Quick Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {recipe.shelf_life && (
                          <div className="bg-secondary/40 p-2 rounded">
                            <p className="text-muted-foreground">Shelf Life</p>
                            <p className="font-semibold">{recipe.shelf_life}</p>
                          </div>
                        )}
                        {recipe.allergens && (
                          <div className="bg-red-500/10 p-2 rounded border border-red-500/30">
                            <p className="text-red-700 font-semibold">⚠️ {recipe.allergens}</p>
                          </div>
                        )}
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/20 hover:bg-secondary/40 rounded-lg transition-colors text-sm font-semibold"
                      >
                        <span>View Recipe</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedId === recipe.id && "rotate-180")} />
                      </button>

                      {/* Expanded Details */}
                      {expandedId === recipe.id && (
                        <div className="border-t border-border pt-3 space-y-3 mt-3">
                          {recipe.ingredients && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">INGREDIENTS</p>
                              <p className="text-sm whitespace-pre-wrap mt-1">{recipe.ingredients}</p>
                            </div>
                          )}

                          {recipe.steps && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">STEPS</p>
                              <p className="text-sm whitespace-pre-wrap mt-1">{recipe.steps}</p>
                            </div>
                          )}

                          {recipe.storage && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">STORAGE</p>
                              <p className="text-sm">{recipe.storage}</p>
                            </div>
                          )}

                          {recipe.notes && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">TIPS</p>
                              <p className="text-sm">{recipe.notes}</p>
                            </div>
                          )}

                          {recipe.video_link && (
                            <a
                              href={recipe.video_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-xs text-primary font-semibold hover:underline"
                            >
                              Watch Video
                            </a>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          onClick={() => setPrintingId(recipe.id)}
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Print
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              onClick={() => handleEdit(recipe)}
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-xs"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(recipe.id)}
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Recipe" : "New Recipe"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Recipe Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Marinara Sauce"
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Yield / Portion Size</Label>
                <Input
                  value={form.yield}
                  onChange={(e) => setForm({ ...form, yield: e.target.value })}
                  placeholder="e.g., Serves 10, Makes 1 gallon"
                />
              </div>

              <div>
                <Label>Photo URL</Label>
                <Input
                  value={form.photo_url}
                  onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Ingredients</Label>
                <Textarea
                  value={form.ingredients}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  placeholder="2 tbsp olive oil, 1 onion diced..."
                  rows={5}
                />
              </div>

              <div>
                <Label>Preparation Steps</Label>
                <Textarea
                  value={form.steps}
                  onChange={(e) => setForm({ ...form, steps: e.target.value })}
                  placeholder="1. Heat oil, 2. Saute onions..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shelf Life</Label>
                  <Input
                    value={form.shelf_life}
                    onChange={(e) => setForm({ ...form, shelf_life: e.target.value })}
                    placeholder="e.g., 3 days, 2 weeks"
                  />
                </div>
                <div>
                  <Label>Allergens</Label>
                  <Input
                    value={form.allergens}
                    onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                    placeholder="e.g., Contains: nuts, dairy"
                  />
                </div>
              </div>

              <div>
                <Label>Storage Instructions</Label>
                <Textarea
                  value={form.storage}
                  onChange={(e) => setForm({ ...form, storage: e.target.value })}
                  placeholder="Store in airtight container, refrigerate..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Tips and Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Pro tips, substitutions, variations..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Video Tutorial Link</Label>
                <Input
                  value={form.video_link}
                  onChange={(e) => setForm({ ...form, video_link: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSave}>{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Preview */}
      {printingId && (
        <RecipeCard
          recipe={recipes.find(r => r.id === printingId)}
          onClose={() => setPrintingId(null)}
        />
      )}
    </div>
  );
}

function RecipeCard({ recipe, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto p-8 text-black">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600">
          <X className="h-6 w-6" />
        </button>

        <div className="space-y-6">
          {recipe.photo_url && (
            <img src={recipe.photo_url} alt={recipe.name} className="w-full h-64 object-cover rounded-lg" />
          )}

          <div>
            <h1 className="text-4xl font-bold">{recipe.name}</h1>
            <p className="text-gray-600 mt-2">{recipe.category} - {recipe.yield}</p>
          </div>

          {recipe.allergens && (
            <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
              <p className="font-bold text-red-700">Warning: Allergens: {recipe.allergens}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {recipe.shelf_life && (
              <div>
                <p className="font-bold">Shelf Life</p>
                <p className="text-gray-600">{recipe.shelf_life}</p>
              </div>
            )}
            {recipe.storage && (
              <div>
                <p className="font-bold">Storage</p>
                <p className="text-gray-600">{recipe.storage}</p>
              </div>
            )}
          </div>

          {recipe.ingredients && (
            <div>
              <h2 className="text-2xl font-bold border-b-2 pb-2">Ingredients</h2>
              <p className="whitespace-pre-wrap mt-3 text-sm">{recipe.ingredients}</p>
            </div>
          )}

          {recipe.steps && (
            <div>
              <h2 className="text-2xl font-bold border-b-2 pb-2">Preparation</h2>
              <p className="whitespace-pre-wrap mt-3 text-sm">{recipe.steps}</p>
            </div>
          )}

          {recipe.notes && (
            <div>
              <h2 className="text-2xl font-bold border-b-2 pb-2">Tips</h2>
              <p className="mt-3 text-sm">{recipe.notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={() => window.print()} className="flex-1">Print</Button>
            <Button onClick={onClose} variant="outline" className="flex-1">Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}