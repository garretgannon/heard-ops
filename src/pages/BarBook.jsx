import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, X, Edit2, Trash2, Wine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function BarBook() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({
    name: "",
    photo_url: "",
    recipe: "",
    category: "",
    ingredients: "",
    glassware: "",
    notes: "",
    base_spirit: ""
  });

  useEffect(() => {
    const load = async () => {
      const [data, user] = await Promise.all([
        base44.entities.BarBook.list("-created_date", 200),
        base44.auth.me()
      ]);
      setDrinks(data);
      const cats = [...new Set(data.map(d => d.category).filter(Boolean))];
      setCategories(cats);
      setIsAdmin(user?.role === "admin");
      setLoading(false);
    };
    load();
  }, []);

  const filteredDrinks = drinks.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.base_spirit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ingredients?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.photo_url.trim()) {
      toast.error("Name and photo are required");
      return;
    }
    setSaving(true);
    if (editingId) {
      await base44.entities.BarBook.update(editingId, form);
      setDrinks(prev => prev.map(d => d.id === editingId ? { ...d, ...form } : d));
      toast.success("Recipe updated");
    } else {
      const created = await base44.entities.BarBook.create(form);
      setDrinks(prev => [created, ...prev]);
      const newCat = form.category && !categories.includes(form.category) ? [...categories, form.category] : categories;
      setCategories(newCat);
      toast.success("Recipe added");
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      photo_url: "",
      recipe: "",
      category: "",
      ingredients: "",
      glassware: "",
      notes: "",
      base_spirit: ""
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this recipe?")) return;
    await base44.entities.BarBook.delete(id);
    setDrinks(prev => prev.filter(d => d.id !== id));
    toast.success("Recipe deleted");
  };

  const openEdit = (drink) => {
    setForm(drink);
    setEditingId(drink.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({
      name: "",
      photo_url: "",
      recipe: "",
      category: "",
      ingredients: "",
      glassware: "",
      notes: "",
      base_spirit: ""
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
          <p className="text-muted-foreground mt-1 text-sm">Cocktail and drink recipes</p>
        </div>
        {isAdmin && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add Recipe
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Drink name, spirit, ingredients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Drinks Grid */}
      {filteredDrinks.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-4">No recipes found</p>
          {isAdmin && (
            <Button onClick={openNew} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add First Recipe
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrinks.map(drink => (
            <motion.div
              key={drink.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary transition flex flex-col h-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Photo */}
              <div className="relative w-full h-48 bg-secondary overflow-hidden">
                <img
                  src={drink.photo_url}
                  alt={drink.name}
                  className="w-full h-full object-cover hover:scale-105 transition"
                  onError={e => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' fill='%23999' font-size='12' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E"}
                />
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm mb-1">{drink.name}</h3>
                {drink.category && <p className="text-xs text-primary mb-2">{drink.category}</p>}

                <div className="space-y-2 text-xs mb-3 flex-1">
                  {drink.base_spirit && (
                    <div>
                      <p className="text-muted-foreground font-medium">Spirit</p>
                      <p className="text-muted-foreground">{drink.base_spirit}</p>
                    </div>
                  )}
                  {drink.glassware && (
                    <div>
                      <p className="text-muted-foreground font-medium">Glassware</p>
                      <p className="text-muted-foreground">{drink.glassware}</p>
                    </div>
                  )}
                  {drink.ingredients && (
                    <div>
                      <p className="text-muted-foreground font-medium">Ingredients</p>
                      <p className="text-muted-foreground line-clamp-2">{drink.ingredients}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex gap-1 pt-2 border-t border-border">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(drink)} title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(drink.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Recipe" : "Add Recipe to Bar Book"}</DialogTitle>
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
                <Label>Drink Photo URL *</Label>
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
                  <Input
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="e.g., Cocktails"
                  />
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

              <div className="space-y-1">
                <Label>Glassware / Serving</Label>
                <Input
                  value={form.glassware}
                  onChange={e => setForm(f => ({ ...f, glassware: e.target.value }))}
                  placeholder="e.g., Rocks Glass"
                />
              </div>

              <div className="space-y-1">
                <Label>Ingredients</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="List all ingredients with measurements..."
                  value={form.ingredients}
                  onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                />
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
                <Label>Notes / Variations</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Tips, garnishes, variations..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving…" : (editingId ? "Update" : "Add")} Recipe
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}