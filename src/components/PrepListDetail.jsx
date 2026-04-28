import { useState } from "react";
import { base44 } from "@/api/base44Client";
import PhotoUpload from "./PhotoUpload";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Plus, Trash2, GripVertical, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StationBadge from "./StationBadge";
import StatusBadge from "./StatusBadge";
import PhotoPreviewDialog from "./PhotoPreviewDialog";

export default function PrepListDetail({ prepList, station, items, onBack, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(null);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const sortedItems = [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const handleAddItem = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await base44.entities.PrepItem.create({
      ...form,
      prep_list_id: prepList.id,
      station_id: prepList.station_id,
      status: "pending",
      sort_order: items.length,
    });
    setForm({ name: "", quantity: "", unit: "", notes: "" });
    setSaving(false);
    setDialogOpen(false);
    onRefresh();
  };

  const handleDeleteItem = async (id) => {
    await base44.entities.PrepItem.delete(id);
    onRefresh();
  };

  const progress = items.length > 0
    ? Math.round((items.filter(i => i.status === "completed").length / items.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to lists
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{prepList.name}</h1>
              <StatusBadge status={prepList.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {station && <StationBadge name={station.name} color={station.color} />}
              <span>{prepList.date}</span>
            </div>
            {prepList.notes && <p className="text-sm text-muted-foreground mt-2">{prepList.notes}</p>}
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {items.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {sortedItems.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">No items yet. Add prep items to this list.</p>
          </div>
        ) : (
          sortedItems.map(item => (
            <div
              key={item.id}
              className={`bg-card rounded-xl border border-border p-4 flex items-center gap-3 transition-colors ${
                item.status === "completed" ? "bg-accent/5 border-accent/20" : ""
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {item.name}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {(item.quantity || item.unit) && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                    </span>
                  )}
                  {item.notes && <span className="text-xs text-muted-foreground">· {item.notes}</span>}
                </div>
                {item.completed_by && (
                  <p className="text-xs text-muted-foreground mt-1">Completed by {item.completed_by}</p>
                )}
              </div>
              {item.photo_url ? (
                <button onClick={() => setPhotoDialog(item.photo_url)} className="flex-shrink-0">
                  <img src={item.photo_url} alt="Completion" className="h-12 w-12 rounded-lg object-cover border border-border" />
                </button>
              ) : (
                <div className="flex-shrink-0 w-24">
                  <PhotoUpload
                    onUpload={async (url) => {
                      if (url) await base44.entities.PrepItem.update(item.id, { photo_url: url });
                      onRefresh();
                    }}
                    className="!h-12"
                  />
                </div>
              )}
              {false && !item.photo_url && item.status === "completed" && (
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add item dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Prep Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Item Name</Label>
              <Input placeholder="e.g., Dice onions, Portion steaks" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input placeholder="e.g., 5" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input placeholder="e.g., lbs, quarts" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input placeholder="Special instructions..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={saving || !form.name.trim()}>
              {saving ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo preview */}
      <PhotoPreviewDialog url={photoDialog} onClose={() => setPhotoDialog(null)} />
    </div>
  );
}