import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, UtensilsCrossed, Copy, Check, Pencil, FileUp, GripVertical, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import StationBadge from "../components/StationBadge";
import StationAssignments from "../components/StationAssignments";
import EmptyState from "../components/EmptyState";
import BulkImportDialog from "../components/BulkImportDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = ["red", "blue", "green", "orange", "purple", "teal", "pink", "yellow"];
const PREP_CATEGORIES = ["Sauce", "Protein", "Produce", "Bakery", "Garnish", "Batch Prep", "Bar Prep"];
const ROLE_OPTIONS = ["Grill", "Saute", "Pantry", "Pastry", "Garde Manger", "Prep", "Fryer"];

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "blue",
    sort_order: 0,
    default_prep_categories: [],
    assigned_roles: []
  });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    const data = await base44.entities.Station.list("-sort_order");
    setStations(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingStation(null);
    const activeCount = stations.filter(s => s.is_active).length;
    setForm({
      name: "",
      description: "",
      color: "blue",
      sort_order: activeCount,
      default_prep_categories: [],
      assigned_roles: []
    });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditingStation(s);
    setForm({
      name: s.name,
      description: s.description || "",
      color: s.color,
      sort_order: s.sort_order || 0,
      default_prep_categories: s.default_prep_categories || [],
      assigned_roles: s.assigned_roles || []
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingStation) {
      await base44.entities.Station.update(editingStation.id, form);
      toast.success("Station updated");
    } else {
      await base44.entities.Station.create({ ...form, is_active: true });
      toast.success("Station created");
    }
    setDialogOpen(false);
    setEditingStation(null);
    setSaving(false);
    load();
  };

  const handleArchive = async (id) => {
    await base44.entities.Station.update(id, { is_active: false });
    toast.success("Station archived");
    load();
  };

  const handleRestore = async (id) => {
    await base44.entities.Station.update(id, { is_active: true });
    toast.success("Station restored");
    load();
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const reordered = Array.from(activeStations);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    await Promise.all(
      reordered.map((s, idx) => base44.entities.Station.update(s.id, { sort_order: idx }))
    );
    load();
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}/station/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Station link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeStations = stations.filter(s => s.is_active);
  const archivedStations = stations.filter(s => !s.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Stations</h1>
          <p className="text-muted-foreground mt-1">Manage kitchen stations, roles, and prep defaults</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Station
          </Button>
        </div>
      </div>

      {activeStations.length === 0 && archivedStations.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No stations yet"
          description="Create your first kitchen station to start organizing prep lists."
          action={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Station</Button>}
        />
      ) : (
        <div className="space-y-6">
          {/* Active Stations with Drag-Drop */}
          {activeStations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">Active Stations</h2>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="stations">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn("space-y-2 p-3 rounded-lg border-2 border-dashed", snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-border")}
                    >
                      {activeStations.map((s, idx) => (
                        <Draggable key={s.id} draggableId={s.id} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "bg-card border border-border rounded-xl p-4 flex items-start justify-between hover:shadow-sm transition-shadow",
                                snapshot.isDragging && "shadow-lg bg-primary/5"
                              )}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <div {...provided.dragHandleProps} className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <StationBadge name={s.name} color={s.color} />
                                  </div>
                                  {s.description && <p className="text-xs text-muted-foreground mb-2">{s.description}</p>}
                                  {s.assigned_roles?.length > 0 && (
                                    <p className="text-xs text-muted-foreground">Roles: {s.assigned_roles.join(", ")}</p>
                                  )}
                                  {s.default_prep_categories?.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">Prep: {s.default_prep_categories.join(", ")}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600" onClick={() => handleArchive(s.id)}>
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}

          {/* Archived Stations */}
          {archivedStations.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                {showArchived ? "Hide" : "Show"} Archived ({archivedStations.length})
              </button>
              {showArchived && (
                <div className="space-y-2 opacity-60">
                  {archivedStations.map(s => (
                    <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                      <StationBadge name={s.name} color={s.color} />
                      <Button variant="ghost" size="sm" onClick={() => handleRestore(s.id)} className="text-xs">
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <BulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="station_assignments"
        onImportComplete={load}
      />

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStation ? "Edit Station" : "Add Station"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Station Name *</Label>
              <Input
                placeholder="e.g., Grill, Sauté, Pantry"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                placeholder="Brief description..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Color *</Label>
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

            <div>
              <Label>Assigned Roles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ROLE_OPTIONS.map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      const roles = form.assigned_roles || [];
                      if (roles.includes(role)) {
                        setForm({ ...form, assigned_roles: roles.filter(r => r !== role) });
                      } else {
                        setForm({ ...form, assigned_roles: [...roles, role] });
                      }
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                      (form.assigned_roles || []).includes(role)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/30 text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Default Prep Categories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PREP_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      const cats = form.default_prep_categories || [];
                      if (cats.includes(cat)) {
                        setForm({ ...form, default_prep_categories: cats.filter(c => c !== cat) });
                      } else {
                        setForm({ ...form, default_prep_categories: [...cats, cat] });
                      }
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                      (form.default_prep_categories || []).includes(cat)
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary/30 text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
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