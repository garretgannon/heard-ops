import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { motion } from "framer-motion";
import { Plus, X, Edit2, Trash2, BookOpen, Search, AlertCircle, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Starters", "Salads", "Entrees", "Desserts", "Brunch", "Kids", "Specials"];

export default function BuildBook() {
  const { isAdmin } = useCurrentUser();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Starters");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [form, setForm] = useState({
    name: "",
    photo_url: "",
    category: "Starters",
    ingredients: "",
    allergens: "",
    instructions: "",
    modifications: "",
    eighty_six_notes: "",
    pairings: "",
    talking_points: "",
    menu_items: "",
    batch_size: "",
    notes: ""
  });

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.BuildBook.list("-created_date", 200);
      setRecipes(data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredRecipes = recipes
    .filter(r => r.category === activeCategory)
    .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.menu_items?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSave = async () => {
    if (!form.name.trim() || !form.photo_url.trim()) {
      toast.error("Name and photo are required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.BuildBook.update(editingId, form);
        setRecipes(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r));
        toast.success("Updated");
      } else {
        const created = await base44.entities.BuildBook.create(form);
        setRecipes(prev => [created, ...prev]);
        toast.success("Added");
      }
    } catch (e) {
      toast.error("Failed to save");
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      photo_url: "",
      category: "Starters",
      ingredients: "",
      allergens: "",
      instructions: "",
      modifications: "",
      eighty_six_notes: "",
      pairings: "",
      talking_points: "",
      menu_items: "",
      batch_size: "",
      notes: ""
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dish?")) return;
    await base44.entities.BuildBook.delete(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
    setSelectedRecipe(null);
    toast.success("Deleted");
  };

  const openEdit = (recipe) => {
    setForm(recipe);
    setEditingId(recipe.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({
      name: "",
      photo_url: "",
      category: activeCategory,
      ingredients: "",
      allergens: "",
      instructions: "",
      modifications: "",
      eighty_six_notes: "",
      pairings: "",
      talking_points: "",
      menu_items: "",
      batch_size: "",
      notes: ""
    });
    setEditingId(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-primary" /> Build Book
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Dish details, allergens, and pairings</p>
        </div>
        {isAdmin && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add Dish
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search dishes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 h-11 text-base"
        />
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No dishes found</p>
          {isAdmin && (
            <Button onClick={openNew} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add Dish
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <motion.button
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition text-left h-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Photo */}
              <div className="relative w-full h-40 bg-secondary overflow-hidden">
                <img
                  src={recipe.photo_url}
                  alt={recipe.name}
                  className="w-full h-full object-cover hover:scale-105 transition"
                  onError={e => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3C/svg%3E"}
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{recipe.name}</h3>
                {recipe.allergens && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {recipe.allergens}</p>}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecipe.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Photo */}
                <div className="w-full h-48 rounded-lg overflow-hidden border border-border">
                  <img src={selectedRecipe.photo_url} alt={selectedRecipe.name} className="w-full h-full object-cover" />
                </div>

                {/* Allergens Alert */}
                {selectedRecipe.allergens && (
                  <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg flex gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-destructive">Allergens</p>
                      <p className="text-sm text-muted-foreground">{selectedRecipe.allergens}</p>
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedRecipe.ingredients && (
                    <div>
                      <p className="font-semibold mb-1">Ingredients</p>
                      <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedRecipe.ingredients}</p>
                    </div>
                  )}
                  {selectedRecipe.menu_items && (
                    <div>
                      <p className="font-semibold mb-1">Menu Items</p>
                      <p className="text-muted-foreground text-xs">{selectedRecipe.menu_items}</p>
                    </div>
                  )}
                </div>

                {/* Full Width Sections */}
                {selectedRecipe.talking_points && (
                  <div>
                    <p className="font-semibold text-sm mb-1">Talking Points</p>
                    <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedRecipe.talking_points}</p>
                  </div>
                )}

                {selectedRecipe.modifications && (
                  <div>
                    <p className="font-semibold text-sm mb-1">Modifications</p>
                    <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedRecipe.modifications}</p>
                  </div>
                )}

                {selectedRecipe.pairings && (
                  <div className="flex gap-2">
                    <Wine className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-sm mb-1">Pairings and Upsells</p>
                      <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedRecipe.pairings}</p>
                    </div>
                  </div>
                )}

                {selectedRecipe.eighty_six_notes && (
                  <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg">
                    <p className="font-semibold text-sm mb-1 text-warning">Out of Stock - 86 Notes</p>
                    <p className="text-muted-foreground text-xs">{selectedRecipe.eighty_six_notes}</p>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button onClick={() => { openEdit(selectedRecipe); setSelectedRecipe(null); }} variant="outline" className="flex-1 gap-2">
                      <Edit2 className="h-4 w-4" /> Edit
                    </Button>
                    <Button onClick={() => { handleDelete(selectedRecipe.id); setSelectedRecipe(null); }} variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Dish" : "Add Dish to Build Book"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label>Dish Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Pan Seared Salmon"
              />
            </div>

            <div className="space-y-1">
              <Label>Photo URL *</Label>
              <Input
                value={form.photo_url}
                onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                placeholder="https://..."
              />
              {form.photo_url && (
                <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-border">
                  <img src={form.photo_url} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Menu Items</Label>
                <Input value={form.menu_items} onChange={e => setForm(f => ({ ...f, menu_items: e.target.value }))} placeholder="e.g., Salmon Special" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Ingredients</Label>
              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[70px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="List ingredients..." value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Allergens</Label>
              <Input value={form.allergens} onChange={e => setForm(f => ({ ...f, allergens: e.target.value }))} placeholder="e.g., Nuts, Dairy, Gluten" />
            </div>

            <div className="space-y-1">
              <Label>Instructions / Recipe</Label>
              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Step-by-step instructions..." value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Modifications</Label>
              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Possible substitutions, removals..." value={form.modifications} onChange={e => setForm(f => ({ ...f, modifications: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Talking Points</Label>
              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Key selling points for staff..." value={form.talking_points} onChange={e => setForm(f => ({ ...f, talking_points: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Pairings and Upsells</Label>
              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Wine, drinks, sides..." value={form.pairings} onChange={e => setForm(f => ({ ...f, pairings: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>86 / Out of Stock Notes</Label>
              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[50px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="When this is 86d..." value={form.eighty_six_notes} onChange={e => setForm(f => ({ ...f, eighty_six_notes: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Additional Notes</Label>
              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[50px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Any other notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : (editingId ? "Update" : "Add")} Dish
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}