import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Trash2, FileText, Search, AlertTriangle, Download, MapPin, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "cleaning", label: "Cleaning" },
  { key: "dish", label: "Dish" },
  { key: "bar", label: "Bar" },
  { key: "kitchen", label: "Kitchen" },
  { key: "maintenance", label: "Maintenance" },
];

const HAZARD_COLORS = {
  toxic: "bg-red-500/15 text-red-600 border-red-500/30",
  corrosive: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  flammable: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  irritant: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
};

export default function MSDS() {
  const [chemicals, setChemicals] = useState([]);
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "cleaning",
    hazards: [],
    location: "",
    vendor: "",
    emergency_instructions: "",
    sds_url: "",
    notes: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const [chemData, emerData] = await Promise.all([
          base44.entities.ChemicalLog.list(),
          base44.entities.Settings.filter({ key: "emergency_contact" }),
        ]);
        setChemicals(chemData);
        if (emerData.length > 0) {
          setEmergency(emerData[0].value);
        }
        setLoading(false);
      } catch (err) {
        console.error("Load error:", err);
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, sds_url: file_url }));
      toast.success("SDS uploaded");
    } catch (err) {
      toast.error("File upload failed");
    }
    setUploadingFile(false);
  };

  const handleSaveChemical = async () => {
    if (!form.name.trim()) {
      toast.error("Chemical name required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.ChemicalLog.update(editingId, form);
        toast.success("Chemical updated");
      } else {
        await base44.entities.ChemicalLog.create(form);
        toast.success("Chemical added");
      }
      const updated = await base44.entities.ChemicalLog.list();
      setChemicals(updated);
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", category: "cleaning", hazards: [], location: "", vendor: "", emergency_instructions: "", sds_url: "", notes: "" });
    } catch (err) {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleDeleteChemical = async (id) => {
    if (!confirm("Delete this chemical?")) return;
    try {
      await base44.entities.ChemicalLog.delete(id);
      setChemicals(prev => prev.filter(c => c.id !== id));
      toast.success("Chemical deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleSaveEmergency = async () => {
    try {
      const existing = await base44.entities.Settings.filter({ key: "emergency_contact" });
      if (existing.length > 0) {
        await base44.entities.Settings.update(existing[0].id, { value: emergency });
      } else {
        await base44.entities.Settings.create({ key: "emergency_contact", value: emergency });
      }
      toast.success("Emergency info saved");
      setShowEmergency(false);
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  const openEdit = (chem) => {
    setForm(chem);
    setEditingId(chem.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({ name: "", category: "cleaning", hazards: [], location: "", vendor: "", emergency_instructions: "", sds_url: "", notes: "" });
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

  const filtered = chemicals.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.hazards || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" /> Safety Binder
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Chemical SDS and safety information</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEmergency(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" /> Emergency
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Add Chemical
            </Button>
          </div>
        )}
      </div>

      {/* Emergency Section - Pinned at top */}
      {emergency && (
        <motion.div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-600">Emergency Contact</h3>
              <p className="text-sm whitespace-pre-wrap mt-1">{emergency}</p>
            </div>
            {isAdmin && (
              <button onClick={() => setShowEmergency(true)} className="text-muted-foreground hover:text-primary">
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chemicals, hazards..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn("px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all", selectedCategory === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={cn("px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all", selectedCategory === cat.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Chemicals Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No chemicals found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((chem, i) => (
              <motion.div
                key={chem.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 space-y-3 hover:border-primary/40 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{chem.name}</h3>
                    {chem.vendor && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Factory className="h-3 w-3" /> {chem.vendor}</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(chem)} className="text-muted-foreground hover:text-primary p-1">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteChemical(chem.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Hazards */}
                {chem.hazards && (
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(chem.hazards) ? chem.hazards : chem.hazards.split(",")).map((hazard, i) => {
                      const colorKey = hazard.trim().toLowerCase();
                      const color = HAZARD_COLORS[colorKey] || "bg-slate-500/15 text-slate-600 border-slate-500/30";
                      return (
                        <span key={i} className={cn("text-xs font-semibold px-2 py-1 rounded-full border", color)}>
                          {hazard.trim()}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Location */}
                {chem.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {chem.location}
                  </p>
                )}

                {/* SDS Link */}
                {chem.sds_url && (
                  <a href={chem.sds_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm font-semibold">
                    <Download className="h-4 w-4" /> View SDS
                  </a>
                )}

                {/* Emergency Instructions */}
                {chem.emergency_instructions && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                    <p className="text-xs font-semibold text-red-600">Emergency:</p>
                    <p className="text-xs text-red-700 mt-1">{chem.emergency_instructions}</p>
                  </div>
                )}

                {/* Notes */}
                {chem.notes && <p className="text-xs text-muted-foreground italic">"{chem.notes}"</p>}

                {/* Category Badge */}
                <div className="pt-2 border-t border-border">
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-semibold">
                    {CATEGORIES.find(c => c.key === chem.category)?.label || chem.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Chemical Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Chemical" : "Add Chemical"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-bold block mb-1">Chemical Name *</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Bleach, Degreaser"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Hazards (comma-separated)</label>
              <Input
                value={Array.isArray(form.hazards) ? form.hazards.join(", ") : form.hazards || ""}
                onChange={e => setForm(f => ({ ...f, hazards: e.target.value.split(",").map(h => h.trim()) }))}
                placeholder="e.g., Toxic, Corrosive, Flammable"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Location</label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g., Under sink, Storage closet"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Vendor / Manufacturer</label>
              <Input
                value={form.vendor}
                onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="e.g., Clorox, SC Johnson"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Emergency Instructions</label>
              <Textarea
                value={form.emergency_instructions}
                onChange={e => setForm(f => ({ ...f, emergency_instructions: e.target.value }))}
                placeholder="What to do in case of exposure..."
                className="min-h-16"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-2">Safety Data Sheet (SDS)</label>
              <label className="block">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={uploadingFile}
                  onClick={e => e.currentTarget.parentElement.querySelector('input').click()}
                >
                  {uploadingFile ? "Uploading..." : form.sds_url ? "SDS uploaded" : "Upload SDS"}
                </Button>
              </label>
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Notes</label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional info..."
                className="min-h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSaveChemical} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Contact Dialog */}
      <Dialog open={showEmergency} onOpenChange={setShowEmergency}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emergency Contact Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={emergency || ""}
              onChange={e => setEmergency(e.target.value)}
              placeholder="Enter emergency contact phone, Poison Control number, hospital info, etc."
              className="min-h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmergency(false)}>Cancel</Button>
            <Button onClick={handleSaveEmergency} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}