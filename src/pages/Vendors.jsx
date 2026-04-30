import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, X, Edit2, Trash2, Phone, Mail, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "food_supplier", label: "Food Supplier" },
  { value: "beverage_supplier", label: "Beverage Supplier" },
  { value: "equipment", label: "Equipment" },
  { value: "maintenance", label: "Maintenance" },
  { value: "cleaning", label: "Cleaning Supplies" },
  { value: "other", label: "Other" },
];

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [form, setForm] = useState({
    name: "", contact_person: "", phone: "", email: "", website: "",
    address: "", city: "", state: "", zip: "", category: "", notes: ""
  });

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Vendor.list("-created_date", 100);
      setVendors(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Vendor name is required");
      return;
    }
    setSaving(true);
    if (editingId) {
      const updated = await base44.entities.Vendor.update(editingId, form);
      setVendors(prev => prev.map(v => v.id === editingId ? updated : v));
      toast.success("Vendor updated");
    } else {
      const created = await base44.entities.Vendor.create(form);
      setVendors(prev => [created, ...prev]);
      toast.success("Vendor added");
    }
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", contact_person: "", phone: "", email: "", website: "", address: "", city: "", state: "", zip: "", category: "", notes: "" });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this vendor?")) return;
    await base44.entities.Vendor.delete(id);
    setVendors(prev => prev.filter(v => v.id !== id));
    toast.success("Vendor removed");
  };

  const openEdit = (vendor) => {
    setForm(vendor);
    setEditingId(vendor.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({ name: "", contact_person: "", phone: "", email: "", website: "", address: "", city: "", state: "", zip: "", category: "", notes: "" });
    setEditingId(null);
    setShowForm(true);
  };

  const filteredVendors = selectedCategory
    ? vendors.filter(v => v.category === selectedCategory)
    : vendors;

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
            📋 Vendors
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage supplier and vendor contact information</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendors grid */}
      {filteredVendors.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-4">No vendors yet</p>
          <Button onClick={openNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add First Vendor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVendors.map(vendor => {
            const cat = CATEGORIES.find(c => c.value === vendor.category);
            return (
              <div key={vendor.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{vendor.name}</h3>
                    {vendor.contact_person && <p className="text-sm text-muted-foreground">{vendor.contact_person}</p>}
                    {cat && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full inline-block mt-1">{cat.label}</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(vendor)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(vendor.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={`tel:${vendor.phone}`} className="hover:text-primary">{vendor.phone}</a>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={`mailto:${vendor.email}`} className="hover:text-primary">{vendor.email}</a>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{vendor.website}</a>
                    </div>
                  )}
                  {(vendor.address || vendor.city) && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        {vendor.address && <p>{vendor.address}</p>}
                        {(vendor.city || vendor.state || vendor.zip) && (
                          <p>{[vendor.city, vendor.state, vendor.zip].filter(Boolean).join(", ")}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {vendor.notes && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">{vendor.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label>Vendor Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., ABC Foods Inc." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Contact Person</Label>
                <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Name" />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vendor@example.com" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Website</Label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" />
            </div>

            <div className="space-y-1">
              <Label>Street Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="AZ" />
              </div>
              <div className="space-y-1">
                <Label>ZIP</Label>
                <Input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="85001" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notes</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Special instructions, payment terms, etc."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : (editingId ? "Update" : "Add")} Vendor
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}