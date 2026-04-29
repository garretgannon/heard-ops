import { useState } from "react";
import { base44 } from "@/api/base44Client";
import PhotoUpload from "./PhotoUpload";
import { ArrowLeft, Plus, Trash2, GripVertical, ArrowUpDown, Upload, CheckSquare, Square, FileDown } from "lucide-react";
import BulkEditPanel from "./BulkEditPanel";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StationBadge from "./StationBadge";
import { toast } from "sonner";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import PhotoPreviewDialog from "./PhotoPreviewDialog";

export default function PrepListDetail({ prepList, station, items, onBack, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(null);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "", notes: "", priority: "medium" });
  const [saving, setSaving] = useState(false);
  const [uploadingMasterFor, setUploadingMasterFor] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 48;
    const pageW = doc.internal.pageSize.getWidth();
    let y = margin;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(prepList.name, margin, y);
    y += 26;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const meta = [station?.name, prepList.date, `${items.length} items`].filter(Boolean).join("   |   ");
    doc.text(meta, margin, y);
    if (prepList.notes) {
      y += 16;
      doc.text(prepList.notes, margin, y);
    }
    y += 20;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 18;

    // Column headers
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80);
    doc.text("✓", margin, y);
    doc.text("ITEM", margin + 20, y);
    doc.text("QTY", pageW - margin - 120, y);
    doc.text("PRIORITY", pageW - margin - 60, y);
    doc.text("STATUS", pageW - margin, y, { align: "right" });
    y += 6;
    doc.line(margin, y, pageW - margin, y);
    y += 14;

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...items].sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    sorted.forEach((item, idx) => {
      if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        y = margin;
      }
      const rowBg = idx % 2 === 0 ? 252 : 245;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(margin, y - 11, pageW - margin * 2, 18, "F");

      // Checkbox
      doc.setDrawColor(160);
      doc.rect(margin + 1, y - 8, 10, 10);
      if (item.status === "completed") {
        doc.setTextColor(60, 160, 100);
        doc.text("✓", margin + 2, y);
      }

      // Name
      doc.setTextColor(30);
      const name = item.status === "completed" ? item.name : item.name;
      doc.text(name, margin + 20, y);

      // Qty
      const qty = [item.quantity, item.unit].filter(Boolean).join(" ");
      doc.setTextColor(80);
      doc.text(qty, pageW - margin - 120, y);

      // Priority
      const priColor = { high: [200, 60, 60], medium: [200, 140, 40], low: [80, 160, 100] }[item.priority || "medium"];
      doc.setTextColor(...priColor);
      doc.text((item.priority || "medium").toUpperCase(), pageW - margin - 60, y);

      // Status
      doc.setTextColor(item.status === "completed" ? 60 : 150, item.status === "completed" ? 160 : 150, 100);
      doc.text(item.status === "completed" ? "Done" : "Pending", pageW - margin, y, { align: "right" });

      if (item.notes) {
        y += 13;
        doc.setTextColor(130);
        doc.setFontSize(8);
        doc.text(`  ${item.notes}`, margin + 20, y);
        doc.setFontSize(10);
      }
      y += 18;
    });

    // Footer
    y += 10;
    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
    doc.setFontSize(8);
    doc.setTextColor(160);
    const completed = items.filter(i => i.status === "completed").length;
    doc.text(`Printed ${new Date().toLocaleDateString()}  |  ${completed}/${items.length} completed`, margin, y);

    doc.save(`${prepList.name.replace(/\s+/g, "_")}_${prepList.date}.pdf`);
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(sortedItems.map(i => i.id));
  const clearSelection = () => setSelectedIds([]);
  const exitBulk = () => { setBulkMode(false); setSelectedIds([]); };

  const uploadMasterPhoto = async (itemId, file) => {
    setUploadingMasterFor(itemId);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.PrepItem.update(itemId, { master_photo_url: file_url });
    setUploadingMasterFor(null);
    toast.success("Reference photo uploaded");
    onRefresh();
  };

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedItems = [...items].sort((a, b) => {
    if (sortByPriority) {
      const pd = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      if (pd !== 0) return pd;
    }
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  const cyclePriority = async (item) => {
    const cycle = { high: "medium", medium: "low", low: "high" };
    await base44.entities.PrepItem.update(item.id, { priority: cycle[item.priority || "medium"] });
    onRefresh();
  };

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
    setForm({ name: "", quantity: "", unit: "", notes: "", priority: "medium" });

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
          <div className="flex items-center gap-2">
            <Button
              variant={sortByPriority ? "default" : "outline"}
              size="sm"
              onClick={() => setSortByPriority(v => !v)}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Priority
            </Button>
            <Button
              variant={bulkMode ? "default" : "outline"}
              size="sm"
              onClick={() => bulkMode ? exitBulk() : setBulkMode(true)}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {bulkMode ? "Exit Bulk" : "Bulk Edit"}
            </Button>
            {!bulkMode && (
              <>
                <Button variant="outline" size="sm" onClick={exportPDF}>
                  <FileDown className="h-4 w-4 mr-1" />
                  Export PDF
                </Button>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </>
            )}
          </div>
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

      {/* Bulk edit panel */}
      {bulkMode && selectedIds.length > 0 && (
        <BulkEditPanel
          selectedIds={selectedIds}
          items={sortedItems}
          currentStationId={prepList.station_id}
          onSave={() => { exitBulk(); onRefresh(); }}
          onCancel={exitBulk}
        />
      )}

      {/* Bulk select all bar */}
      {bulkMode && (
        <div className="flex items-center gap-3 text-sm">
          <button onClick={selectedIds.length === sortedItems.length ? clearSelection : selectAll} className="text-primary hover:underline text-xs font-medium">
            {selectedIds.length === sortedItems.length ? "Deselect all" : "Select all"}
          </button>
          <span className="text-muted-foreground text-xs">{selectedIds.length} selected</span>
        </div>
      )}

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
              className={`bg-card rounded-xl border p-4 flex items-center gap-3 transition-colors cursor-pointer ${
                bulkMode && selectedIds.includes(item.id) ? "border-primary/60 bg-primary/5" :
                item.status === "completed" ? "bg-accent/5 border-accent/20" : "border-border"
              }`}
              onClick={bulkMode ? () => toggleSelect(item.id) : undefined}
            >
              {bulkMode ? (
                selectedIds.includes(item.id)
                  ? <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
                  : <Square className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              ) : (
                <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium text-sm ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {item.name}
                  </span>
                  <StatusBadge status={item.status} />
                  <PriorityBadge priority={item.priority || "medium"} onClick={() => cyclePriority(item)} />
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
              {/* Master reference photo */}
              <div className="flex-shrink-0">
                {item.master_photo_url ? (
                  <div className="relative group">
                    <img src={item.master_photo_url} alt="Reference" className="h-12 w-12 rounded-lg object-cover border border-border" />
                    <label className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100">
                      <Upload className="h-3.5 w-3.5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadMasterPhoto(item.id, e.target.files[0])} />
                    </label>
                  </div>
                ) : (
                  <label className="h-12 w-12 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-primary transition-colors">
                    {uploadingMasterFor === item.id
                      ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      : <><Upload className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[9px] text-muted-foreground">Ref</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadMasterPhoto(item.id, e.target.files[0])} />
                  </label>
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
            <div>
              <Label>Priority</Label>
              <div className="flex gap-2 mt-1">
                {["high", "medium", "low"].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className="flex-1"
                  >
                    <PriorityBadge
                      priority={p}
                      className={`w-full justify-center ${form.priority === p ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-50"}`}
                    />
                  </button>
                ))}
              </div>
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