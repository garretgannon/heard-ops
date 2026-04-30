import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, X, Edit2, Trash2, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MSDS() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({
    name: "",
    product_name: "",
    file_url: "",
    hazards: "",
    notes: ""
  });

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setIsAdmin(user?.role === "admin");
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Document name is required");
      return;
    }
    setSaving(true);
    if (editingId) {
      toast.success("Document updated");
    } else {
      toast.success("Document added");
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      product_name: "",
      file_url: "",
      hazards: "",
      notes: ""
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
    toast.success("Document deleted");
  };

  const openEdit = (doc) => {
    setForm(doc);
    setEditingId(doc.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({
      name: "",
      product_name: "",
      file_url: "",
      hazards: "",
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
            <FileText className="h-7 w-7 text-primary" /> MSDS Documents
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Material Safety Data Sheets</p>
        </div>
        {isAdmin && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add Document
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="space-y-1">
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">No MSDS documents added yet</div>
      </div>

      {/* Form Dialog */}
      {isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Document" : "Add MSDS Document"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label>Document Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Bleach MSDS"
                />
              </div>

              <div className="space-y-1">
                <Label>Product Name</Label>
                <Input
                  value={form.product_name}
                  onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                  placeholder="e.g., Clorox Bleach"
                />
              </div>

              <div className="space-y-1">
                <Label>Hazards</Label>
                <Input
                  value={form.hazards}
                  onChange={e => setForm(f => ({ ...f, hazards: e.target.value }))}
                  placeholder="e.g., Toxic, Corrosive"
                />
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving…" : (editingId ? "Update" : "Add")} Document
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