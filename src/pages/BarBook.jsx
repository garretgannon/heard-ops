import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { motion } from "framer-motion";
import { Plus, X, Edit2, Trash2, Wine, Search, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Cocktails", "Beer", "Wine", "NA Drinks", "Batch Recipes"];

export default function BarBook() {
  const { isAdmin } = useCurrentUser();
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Cocktails");
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [form, setForm] = useState({
    name: "",
    photo_url: "",
    recipe: "",
    category: "Cocktails",
    ingredients: [],
    glassware: "",
    base_spirit: "",
    garnish: "",
    allergens: "",
    talking_points: "",
    pairings: "",
    notes: ""
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.BarBook.list("-created_date", 200);
      setDrinks(data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredDrinks = drinks
    .filter(d => d.category === activeCategory)
    .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.base_spirit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ingredients?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, photo_url: file_url }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.photo_url.trim()) {
      toast.error("Name and photo are required");
      return;
    }
    const ingredientsStr = Array.isArray(form.ingredients) 
      ? form.ingredients.filter(i => i.name).map(i => `${i.quantity} ${i.units} ${i.name}`).join(", ")
      : form.ingredients;
    setSaving(true);
    const dataToSave = { ...form, ingredients: ingredientsStr };
    if (editingId) {
      await base44.entities.BarBook.update(editingId, dataToSave);
      setDrinks(prev => prev.map(d => d.id === editingId ? { ...d, ...dataToSave } : d));
      toast.success("Updated");
    } else {
      const created = await base44.entities.BarBook.create(dataToSave);
      setDrinks(prev => [created, ...prev]);
      toast.success("Added");
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      photo_url: "",
      recipe: "",
      category: "Cocktails",
      ingredients: [],
      glassware: "",
      base_spirit: "",
      garnish: "",
      allergens: "",
      talking_points: "",
      pairings: "",
      notes: ""
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this drink?")) return;
    await base44.entities.BarBook.delete(id);
    setDrinks(prev => prev.filter(d => d.id !== id));
    setSelectedDrink(null);
    toast.success("Deleted");
  };

  const openEdit = (drink) => {
    const ingredientArray = typeof drink.ingredients === 'string'
      ? drink.ingredients.split(", ").map(ing => {
          const parts = ing.trim().split(/\s+/);
          return { quantity: parts[0] || "", units: parts[1] || "", name: parts.slice(2).join(" ") || "" };
        })
      : drink.ingredients || [];
    setForm({ ...drink, ingredients: ingredientArray });
    setEditingId(drink.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({
      name: "",
      photo_url: "",
      recipe: "",
      category: activeCategory,
      ingredients: [{ quantity: "", units: "", name: "" }],
      glassware: "",
      base_spirit: "",
      garnish: "",
      allergens: "",
      talking_points: "",
      pairings: "",
      notes: ""
    });
    setEditingId(null);
    setShowForm(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wine className="h-7 w-7 text-primary" /> Bar Book
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Drink recipes, specs, and pairings</p>
        </div>
        {isAdmin && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add Drink
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search drinks..."
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

      {/* Drinks Grid */}
      {filteredDrinks.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No drinks found</p>
          {isAdmin && (
            <Button onClick={openNew} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add Drink
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrinks.map(drink => (
            <motion.button
              key={drink.id}
              onClick={() => setSelectedDrink(drink)}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition text-left h-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Photo */}
              <div className="relative w-full h-40 bg-secondary overflow-hidden">
                <img
                  src={drink.photo_url}
                  alt={drink.name}
                  className="w-full h-full object-cover hover:scale-105 transition"
                  onError={e => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3C/svg%3E"}
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{drink.name}</h3>
                <p className="text-xs text-primary mt-1">{drink.category}</p>
                {drink.allergens && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {drink.allergens}</p>}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedDrink} onOpenChange={(open) => !open && setSelectedDrink(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedDrink && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDrink.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Photo */}
                <div className="w-full h-48 rounded-lg overflow-hidden border border-border">
                  <img src={selectedDrink.photo_url} alt={selectedDrink.name} className="w-full h-full object-cover" />
                </div>

                {/* Allergens Alert */}
                {selectedDrink.allergens && (
                  <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg flex gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-destructive">Allergens</p>
                      <p className="text-sm text-muted-foreground">{selectedDrink.allergens}</p>
                    </div>
                  </div>
                )}

                {/* Quick Specs */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedDrink.base_spirit && (
                    <div>
                      <p className="font-semibold mb-1">Base Spirit</p>
                      <p className="text-muted-foreground text-xs">{selectedDrink.base_spirit}</p>
                    </div>
                  )}
                  {selectedDrink.glassware && (
                    <div>
                      <p className="font-semibold mb-1">Glassware</p>
                      <p className="text-muted-foreground text-xs">{selectedDrink.glassware}</p>
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                {selectedDrink.ingredients && (
                  <div>
                    <p className="font-semibold text-sm mb-2">Ingredients</p>
                    <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedDrink.ingredients}</p>
                  </div>
                )}

                {/* Garnish */}
                {selectedDrink.garnish && (
                  <div>
                    <p className="font-semibold text-sm mb-1">Garnish</p>
                    <p className="text-muted-foreground text-xs">{selectedDrink.garnish}</p>
                  </div>
                )}

                {/* Recipe */}
                {selectedDrink.recipe && (
                  <div>
                    <p className="font-semibold text-sm mb-2">Instructions</p>
                    <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedDrink.recipe}</p>
                  </div>
                )}

                {/* Talking Points */}
                {selectedDrink.talking_points && (
                  <div>
                    <p className="font-semibold text-sm mb-1">Talking Points</p>
                    <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedDrink.talking_points}</p>
                  </div>
                )}

                {/* Pairings */}
                {selectedDrink.pairings && (
                  <div>
                    <p className="font-semibold text-sm mb-1">Food Pairings</p>
                    <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedDrink.pairings}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedDrink.notes && (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-primary mb-1">Notes</p>
                    <p className="text-xs text-muted-foreground">{selectedDrink.notes}</p>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button onClick={() => { openEdit(selectedDrink); setSelectedDrink(null); }} variant="outline" className="flex-1 gap-2">
                      <Edit2 className="h-4 w-4" /> Edit
                    </Button>
                    <Button onClick={() => { handleDelete(selectedDrink.id); setSelectedDrink(null); }} variant="destructive" className="gap-2">
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
      {isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Drink" : "Add Drink to Bar Book"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label>Drink Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Margarita"
                />
              </div>

              <div className="space-y-1">
                <Label>Photo *</Label>
                <div className="flex gap-2 items-end">
                  <label className="flex-1">
                    <div className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md border border-input hover:bg-secondary transition">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                  </label>
                  {form.photo_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                      <img src={form.photo_url} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Base Spirit</Label>
                  <Input
                    value={form.base_spirit}
                    onChange={e => setForm(f => ({ ...f, base_spirit: e.target.value }))}
                    placeholder="e.g., Tequila"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Glassware</Label>
                  <Input
                    value={form.glassware}
                    onChange={e => setForm(f => ({ ...f, glassware: e.target.value }))}
                    placeholder="e.g., Rocks Glass"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Garnish</Label>
                  <Input
                    value={form.garnish}
                    onChange={e => setForm(f => ({ ...f, garnish: e.target.value }))}
                    placeholder="e.g., Lime wedge"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Allergens</Label>
                <Input
                  value={form.allergens}
                  onChange={e => setForm(f => ({ ...f, allergens: e.target.value }))}
                  placeholder="e.g., Nuts, Dairy"
                />
              </div>

              <div className="space-y-1">
                <Label>Ingredients</Label>
                <div className="space-y-2 border border-border rounded-md p-3">
                  <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground pb-2">
                    <div>Quantity</div>
                    <div>Units</div>
                    <div>Ingredient</div>
                  </div>
                  {Array.isArray(form.ingredients) && form.ingredients.map((ing, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2">
                      <Input
                        size="sm"
                        placeholder="1.5"
                        value={ing.quantity}
                        onChange={e => setForm(f => ({
                          ...f,
                          ingredients: f.ingredients.map((i, j) => j === idx ? { ...i, quantity: e.target.value } : i)
                        }))}
                        className="h-8"
                      />
                      <Input
                        size="sm"
                        placeholder="oz"
                        value={ing.units}
                        onChange={e => setForm(f => ({
                          ...f,
                          ingredients: f.ingredients.map((i, j) => j === idx ? { ...i, units: e.target.value } : i)
                        }))}
                        className="h-8"
                      />
                      <Input
                        size="sm"
                        placeholder="Ingredient"
                        value={ing.name}
                        onChange={e => setForm(f => ({
                          ...f,
                          ingredients: f.ingredients.map((i, j) => j === idx ? { ...i, name: e.target.value } : i)
                        }))}
                        className="h-8"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm(f => ({
                      ...f,
                      ingredients: [...f.ingredients, { quantity: "", units: "", name: "" }]
                    }))}
                    className="w-full text-xs mt-2"
                  >
                    <Plus className="h-3 w-3" /> Add Ingredient
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Recipe / Instructions</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Step-by-step instructions..."
                  value={form.recipe}
                  onChange={e => setForm(f => ({ ...f, recipe: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Talking Points</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Key selling points..."
                  value={form.talking_points}
                  onChange={e => setForm(f => ({ ...f, talking_points: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Food Pairings</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Suggested food pairings..."
                  value={form.pairings}
                  onChange={e => setForm(f => ({ ...f, pairings: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Notes and Variations</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Tips, variations, notes..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : (editingId ? "Update" : "Add")} Drink
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}

export const hideBase44Index = true;