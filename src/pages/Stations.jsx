import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, UtensilsCrossed, Copy, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StationBadge from "../components/StationBadge";
import StationAssignments from "../components/StationAssignments";
import EmptyState from "../components/EmptyState";
import { toast } from "sonner";

const COLORS = ["red", "blue", "green", "orange", "purple", "teal", "pink", "yellow"];

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "blue" });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    const data = await base44.entities.Station.list();
    setStations(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingStation(null);
    setForm({ name: "", description: "", color: "blue" });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditingStation(s);
    setForm({ name: s.name, description: s.description || "", color: s.color });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingStation) {
      await base44.entities.Station.update(editingStation.id, form);
    } else {
      await base44.entities.Station.create({ ...form, is_active: true });
    }
    setDialogOpen(false);
    setEditingStation(null);
    setForm({ name: "", description: "", color: "blue" });
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Station.delete(id);
    load();
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}/station/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Station link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Stations</h1>
          <p className="text-muted-foreground mt-1">Manage kitchen stations</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Station
        </Button>
      </div>

      {stations.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No stations yet"
          description="Create your first kitchen station to start organizing prep lists."
          action={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Station</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map(s => (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <StationBadge name={s.name} color={s.color} />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
              <StationAssignments station={s} />
              <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => copyLink(s.id)}
              >
                {copiedId === s.id ? <Check className="h-3 w-3 mr-1.5" /> : <Copy className="h-3 w-3 mr-1.5" />}
                {copiedId === s.id ? "Copied!" : "Copy station link"}
              </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStation ? "Edit Station" : "Add Station"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Station Name</Label>
              <Input
                placeholder="e.g., Grill, Sauté, Pantry"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Select value={form.color} onValueChange={v => setForm({ ...form, color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map(c => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2 capitalize">
                        <span className={`h-3 w-3 rounded-full bg-${c}-500`} />
                        {c}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Saving..." : editingStation ? "Save Changes" : "Create Station"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}