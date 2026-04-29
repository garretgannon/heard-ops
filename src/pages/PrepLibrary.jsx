import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Trash2, ImageIcon, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PrepLibrary() {
  const [items, setItems] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStation, setFilterStation] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const blank = { name: "", description: "", notes: "", station_id: "", station_name: "", photo_url: "" };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    const load = async () => {
      const [lib, stns] = await Promise.all([
        base44.entities.PrepLibraryItem.list("-created_date"),
        base44.entities.Station.list(),
      ]);
      setItems(lib);
      setStations(stns);
      setLoading(false);
    };
    load();
  }, []);

  const openNew = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditItem(item); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const handleStationChange = (stationId) => {
    const stn = stations.find(s => s.id === stationId);
    setForm(f => ({ ...f, station_id: stationId, station_name: stn?.name || "" }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Item name is required");
    setSaving(true);
    if (editItem) {
      const updated = await base44.entities.PrepLibraryItem.update(editItem.id, form);
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form } : i));
      toast.success("Item updated");
    } else {
      const created = await base44.entities.PrepLibraryItem.create(form);
      setItems(prev => [created, ...prev]);
      toast.success("Item added");
    }
    setSaving(false);
    closeForm();
  };

  const deleteItem = async (id) => {
    await base44.entities.PrepLibraryItem.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Item removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Prep Library</h1>
          <p className="text-muted-foreground mt-1">Reference items with photos and station links</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{editItem ? "Edit Item" : "New Item"}</h2>
              <button onClick={closeForm}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                <input
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Hollandaise Sauce"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description…"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Station</label>
                <select
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.station_id}
                  onChange={e => handleStationChange(e.target.value)}
                >
                  <option value="">— No station —</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any extra notes…"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Photo</label>
                {form.photo_url ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border">
                    <img src={form.photo_url} alt="preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setForm(f => ({ ...f, photo_url: "" }))}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Click to upload photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
              <Button onClick={save} disabled={saving || uploading}>
                {saving ? "Saving…" : editItem ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Station filter */}
      {stations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStation("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStation === "" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {stations.map(s => (
            <button
              key={s.id}
              onClick={() => setFilterStation(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStation === s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={() => setFilterStation("none")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStation === "none" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            No Station
          </button>
        </div>
      )}

      {/* Item grid */}
      {items.filter(item => {
        if (!filterStation) return true;
        if (filterStation === "none") return !item.station_id;
        return item.station_id === filterStation;
      }).length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No items yet. Add your first prep library item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.filter(item => {
            if (!filterStation) return true;
            if (filterStation === "none") return !item.station_id;
            return item.station_id === filterStation;
          }).map((item, i) => (
            <motion.div
              key={item.id}
              className="bg-card rounded-2xl border border-border overflow-hidden group"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <div className="relative w-full h-40 bg-muted">
                {item.photo_url ? (
                  <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(item)}
                    className="bg-black/60 rounded-full p-1.5 hover:bg-black/80"
                  >
                    <Pencil className="h-3 w-3 text-white" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="bg-black/60 rounded-full p-1.5 hover:bg-red-600/80"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-1">
                <p className="font-semibold text-sm truncate">{item.name}</p>
                {item.station_name && (
                  <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">{item.station_name}</span>
                )}
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}