import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Edit2, Trash2, Phone, Mail, Globe, MapPin, Search, ChevronDown, ChevronUp, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "beverage", label: "Beverage" },
  { value: "repairs", label: "Repairs" },
  { value: "equipment", label: "Equipment" },
  { value: "linen", label: "Linen" },
  { value: "pest", label: "Pest Control" },
  { value: "grease_trap", label: "Grease Trap" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "pos", label: "POS" },
  { value: "hood_cleaning", label: "Hood Cleaning" },
  { value: "other", label: "Other" },
];

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState(null);

  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    category: "",
    notes: "",
    emergency_number: "",
    emergency: false,
    account_number: "",
    hours: "",
    preferred_contact: "phone",
    contract_renewal_date: "",
    service_history: "",
    active: true,
  });

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Vendor.list("-created_date", 200);
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
    try {
      if (editingId) {
        const updated = await base44.entities.Vendor.update(editingId, form);
        setVendors(prev => prev.map(v => v.id === editingId ? updated : v));
        toast.success("Vendor updated");
      } else {
        const created = await base44.entities.Vendor.create(form);
        setVendors(prev => [created, ...prev]);
        toast.success("Vendor added");
      }
      setShowForm(false);
      setForm({
        name: "", contact_person: "", phone: "", email: "", website: "", address: "", city: "", state: "", zip: "",
        category: "", notes: "", emergency_number: "", emergency: false, account_number: "", hours: "",
        preferred_contact: "phone", contract_renewal_date: "", service_history: "", active: true,
      });
      setEditingId(null);
    } catch (err) {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this vendor?")) return;
    try {
      await base44.entities.Vendor.delete(id);
      setVendors(prev => prev.filter(v => v.id !== id));
      toast.success("Vendor removed");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const openEdit = (vendor) => {
    setForm(vendor);
    setEditingId(vendor.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({
      name: "", contact_person: "", phone: "", email: "", website: "", address: "", city: "", state: "", zip: "",
      category: "", notes: "", emergency_number: "", emergency: false, account_number: "", hours: "",
      preferred_contact: "phone", contract_renewal_date: "", service_history: "", active: true,
    });
    setEditingId(null);
    setShowForm(true);
  };

  // Filter vendors
  let filtered = vendors;
  if (!showInactive) {
    filtered = filtered.filter(v => v.active !== false);
  }
  if (selectedCategory) {
    filtered = filtered.filter(v => v.category === selectedCategory);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.contact_person && v.contact_person.toLowerCase().includes(q)) ||
      (v.phone && v.phone.includes(q)) ||
      (v.email && v.email.toLowerCase().includes(q))
    );
  }

  // Separate emergency vendors
  const emergency = filtered.filter(v => v.emergency);
  const regular = filtered.filter(v => !v.emergency);

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
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Fast lookup for managers</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Add Vendor
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, contact, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="text-xs text-primary hover:underline font-medium"
          >
            {showInactive ? "Hide" : "Show"} Inactive
          </button>
        </div>
      </div>

      {/* Emergency Vendors */}
      {emergency.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-orange-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> Emergency Vendors
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {emergency.map(vendor => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onEdit={openEdit}
                onDelete={handleDelete}
                expanded={expandedVendor === vendor.id}
                onToggleExpand={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Vendors */}
      {regular.length === 0 && emergency.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground mb-4">No vendors found</p>
          <Button onClick={openNew} variant="outline">
            <Plus className="h-4 w-4 mr-2" /> Add Vendor
          </Button>
        </div>
      ) : (
        <>
          {regular.length > 0 && (
            <div className="space-y-3">
              {emergency.length > 0 && <h2 className="font-bold text-sm text-muted-foreground">All Vendors</h2>}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {regular.map(vendor => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    expanded={expandedVendor === vendor.id}
                    onToggleExpand={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vendor Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., ABC Foods Inc." />
              </div>
              <div>
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
              <div>
                <Label>Contact Person</Label>
                <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Name" />
              </div>
              <div>
                <Label>Preferred Contact</Label>
                <Select value={form.preferred_contact} onValueChange={v => setForm(f => ({ ...f, preferred_contact: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Primary Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" />
              </div>
              <div>
                <Label>Emergency Number</Label>
                <Input value={form.emergency_number} onChange={e => setForm(f => ({ ...f, emergency_number: e.target.value }))} placeholder="After-hours number" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vendor@example.com" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Account Number</Label>
                <Input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} placeholder="Your account #" />
              </div>
              <div>
                <Label>Hours / Availability</Label>
                <Input value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="Mon-Fri 8am-5pm" />
              </div>
            </div>

            <div>
              <Label>Street Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="AZ" />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="85001" />
              </div>
            </div>

            <div>
              <Label>Contract Renewal Date</Label>
              <Input type="date" value={form.contract_renewal_date} onChange={e => setForm(f => ({ ...f, contract_renewal_date: e.target.value }))} />
            </div>

            <div>
              <Label>Service History / Notes</Label>
              <Textarea value={form.service_history} onChange={e => setForm(f => ({ ...f, service_history: e.target.value }))} placeholder="Last service: 2024-04-15&#10;Issue: Fixed compressor..." rows={3} />
            </div>

            <div>
              <Label>General Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special instructions, payment terms, etc." rows={2} />
            </div>

            <label className="flex items-center gap-2 p-3 bg-secondary/40 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={form.emergency}
                onChange={e => setForm(f => ({ ...f, emergency: e.target.checked }))}
              />
              <span className="text-sm font-semibold">Mark as emergency vendor (pin at top)</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-secondary/40 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              />
              <span className="text-sm font-semibold">Active vendor</span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : (editingId ? "Update" : "Add")} Vendor
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;

function VendorCard({ vendor, onEdit, onDelete, expanded, onToggleExpand }) {
  const cat = CATEGORIES.find(c => c.value === vendor.category);

  return (
    <div className={cn("bg-card border-2 rounded-xl overflow-hidden", vendor.emergency ? "border-orange-500/40" : "border-border")}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {vendor.emergency && <Star className="h-4 w-4 text-orange-600 flex-shrink-0" />}
              <h3 className="font-bold text-base truncate">{vendor.name}</h3>
            </div>
            {vendor.contact_person && <p className="text-xs text-muted-foreground">{vendor.contact_person}</p>}
            {cat && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded inline-block mt-1">{cat.label}</span>}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(vendor)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(vendor.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="space-y-1 text-sm">
          {vendor.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <a href={`tel:${vendor.phone}`} className="hover:text-primary truncate">{vendor.phone}</a>
            </div>
          )}
          {vendor.emergency_number && (
            <div className="flex items-center gap-2 text-orange-600 font-semibold">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <a href={`tel:${vendor.emergency_number}`}>{vendor.emergency_number} (24/7)</a>
            </div>
          )}
          {vendor.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <a href={`mailto:${vendor.email}`} className="hover:text-primary truncate">{vendor.email}</a>
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {vendor.account_number && <div>Account: <span className="font-semibold">{vendor.account_number}</span></div>}
          {vendor.hours && <div>Hours: <span className="font-semibold">{vendor.hours}</span></div>}
          {vendor.contract_renewal_date && <div>Renewal: <span className="font-semibold">{vendor.contract_renewal_date}</span></div>}
          {vendor.preferred_contact && <div>Contact: <span className="font-semibold capitalize">{vendor.preferred_contact}</span></div>}
        </div>

        {/* Expandable Details */}
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 text-xs text-primary hover:underline font-semibold w-full justify-center py-2 border-t border-border mt-2"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide Details" : "Show Details"}
        </button>

        {expanded && (
          <div className="pt-2 space-y-3 border-t border-border text-sm">
            {(vendor.address || vendor.city) && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  {vendor.address && <p>{vendor.address}</p>}
                  {(vendor.city || vendor.state || vendor.zip) && (
                    <p>{[vendor.city, vendor.state, vendor.zip].filter(Boolean).join(", ")}</p>
                  )}
                </div>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{vendor.website}</a>
              </div>
            )}
            {vendor.service_history && (
              <div className="p-3 bg-secondary/40 rounded text-xs">
                <p className="font-semibold text-muted-foreground mb-1">Service History</p>
                <p className="text-muted-foreground whitespace-pre-line">{vendor.service_history}</p>
              </div>
            )}
            {vendor.notes && (
              <div className="p-3 bg-secondary/40 rounded text-xs">
                <p className="font-semibold text-muted-foreground mb-1">Notes</p>
                <p className="text-muted-foreground">{vendor.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}