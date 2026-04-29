import { useState } from "react";
import { base44 } from "@/api/base44Client";
import PhotoUpload from "./PhotoUpload";
import { ArrowLeft, Plus, Trash2, GripVertical, ArrowUpDown, Upload, CheckSquare, Square, FileDown, MessageSquare, ListPlus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
import TempLogPanel from "./TempLogPanel";
import PrepStepsPanel from "./PrepStepsPanel";

export default function PrepListDetail({ prepList, station, items, onBack, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(null);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "", notes: "", priority: "medium" });
  const [saving, setSaving] = useState(false);
  const [uploadingMasterFor, setUploadingMasterFor] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [handoverNotes, setHandoverNotes] = useState(prepList.handover_notes || "");
  const [savingHandover, setSavingHandover] = useState(false);
  const [handoverSaved, setHandoverSaved] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ name: "", quantity: "", unit: "", notes: "", priority: "medium" }]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const toggleSteps = (id) => setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));

  const saveHandoverNotes = async () => {
    setSavingHandover(true);
    await base44.entities.PrepList.update(prepList.id, { handover_notes: handoverNotes });
    setSavingHandover(false);
    setHandoverSaved(true);
    setTimeout(() => setHandoverSaved(false), 2000);
    toast.success("Handover notes saved");
  };

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

  const addBulkRow = () => setBulkRows(prev => [...prev, { name: "", quantity: "", unit: "", notes: "", priority: "medium" }]);
  const removeBulkRow = (i) => setBulkRows(prev => prev.filter((_, idx) => idx !== i));
  const updateBulkRow = (i, field, value) => setBulkRows(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const saveBulkItems = async () => {
    const valid = bulkRows.filter(r => r.name.trim());
    if (valid.length === 0) { toast.error("Add at least one item name"); return; }
    setBulkSaving(true);
    await base44.entities.PrepItem.bulkCreate(valid.map((r, i) => ({
      name: r.name.trim(),
      quantity: r.quantity,
      unit: r.unit,
      notes: r.notes,
      priority: r.priority,
      prep_list_id: prepList.id,
      station_id: prepList.station_id,
      status: "pending",
      sort_order: items.length + i,
    })));
    setBulkSaving(false);
    setShowBulkAdd(false);
    setBulkRows([{ name: "", quantity: "", unit: "", notes: "", priority: "medium" }]);
    toast.success(`${valid.length} item${valid.length > 1 ? "s" : ""} added`);
    onRefresh();
  };

  const handleDeleteItem = async (id) => {
    await base44.entities.PrepItem.delete(id);
    onRefresh();
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({ name: item.name, quantity: item.quantity || "", unit: item.unit || "", notes: item.notes || "", priority: item.priority || "medium" });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) return;
    setEditSaving(true);
    await base44.entities.PrepItem.update(editItem.id, editForm);
    setEditSaving(false);
    setEditItem(null);
    toast.success("Item updated");
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
                <Button variant="outline" onClick={() => setShowBulkAdd(true)}>
                  <ListPlus className="h-4 w-4 mr-1" />
                  Bulk Add
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
              className={`bg-card rounded-xl border transition-colors ${
                bulkMode && selectedIds.includes(item.id) ? "border-primary/60 bg-primary/5" :
                item.status === "completed" ? "bg-accent/5 border-accent/20" : "border-border"
              }`}
            >
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
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
                <button
                  onClick={e => { e.stopPropagation(); toggleSteps(item.id); }}
                  className={`text-xs font-medium transition-colors ${expandedSteps[item.id] ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {expandedSteps[item.id] ? "▾ Hide Steps" : "▸ Prep Steps"}
                </button>
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
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {expandedSteps[item.id] && (
              <div className="border-t border-border">
                <PrepStepsPanel itemId={item.id} isAdmin={true} />
              </div>
            )}
          </div>
          ))
        )}
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Prep Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Item Name</Label>
              <Input value={editForm.name || ""} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantity</Label><Input value={editForm.quantity || ""} onChange={e => setEditForm(p => ({...p, quantity: e.target.value}))} placeholder="e.g., 5" /></div>
              <div><Label>Unit</Label><Input value={editForm.unit || ""} onChange={e => setEditForm(p => ({...p, unit: e.target.value}))} placeholder="e.g., lbs" /></div>
            </div>
            <div><Label>Notes</Label><Input value={editForm.notes || ""} onChange={e => setEditForm(p => ({...p, notes: e.target.value}))} placeholder="Optional instructions..." /></div>
            <div>
              <Label>Priority</Label>
              <div className="flex gap-2 mt-1">
                {["high", "medium", "low"].map(p => (
                  <button key={p} type="button" onClick={() => setEditForm(prev => ({...prev, priority: p}))} className="flex-1">
                    <PriorityBadge priority={p} className={`w-full justify-center ${editForm.priority === p ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-50"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={editSaving || !editForm.name?.trim()}>{editSaving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      {showBulkAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowBulkAdd(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-lg">Bulk Add Items</h2>
              <button onClick={() => setShowBulkAdd(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                <div className="col-span-4">Item Name *</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-1">Notes</div>
                <div className="col-span-1"></div>
              </div>
              {bulkRows.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <input className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={row.name} onChange={e => updateBulkRow(i, "name", e.target.value)} placeholder="e.g., Dice onions" />
                  </div>
                  <div className="col-span-2">
                    <input className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={row.quantity} onChange={e => updateBulkRow(i, "quantity", e.target.value)} placeholder="5" />
                  </div>
                  <div className="col-span-2">
                    <input className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={row.unit} onChange={e => updateBulkRow(i, "unit", e.target.value)} placeholder="lbs" />
                  </div>
                  <div className="col-span-2">
                    <select className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={row.priority} onChange={e => updateBulkRow(i, "priority", e.target.value)}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <input className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={row.notes} onChange={e => updateBulkRow(i, "notes", e.target.value)} placeholder="…" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {bulkRows.length > 1 && (
                      <button onClick={() => removeBulkRow(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addBulkRow} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors pt-1">
                <Plus className="h-4 w-4" /> Add another item
              </button>
            </div>
            <div className="flex gap-2 justify-end p-5 border-t border-border">
              <Button variant="outline" onClick={() => setShowBulkAdd(false)}>Cancel</Button>
              <Button onClick={saveBulkItems} disabled={bulkSaving}>
                {bulkSaving ? "Saving…" : `Add ${bulkRows.filter(r => r.name.trim()).length || ""} Items`}
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Temperature Log */}
      <TempLogPanel prepListId={prepList.id} />

      {/* Handover Notes */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Handover Notes</h3>
          <span className="text-xs text-muted-foreground ml-1">Leave comments for the next team coming in</span>
        </div>
        <Textarea
          value={handoverNotes}
          onChange={e => { setHandoverNotes(e.target.value); setHandoverSaved(false); }}
          placeholder="e.g., Stock is low on X, double batch needed for tomorrow, fridge #2 needs checking…"
          rows={4}
          className="resize-none text-sm"
        />
        <div className="flex items-center justify-between">
          {prepList.handover_notes && handoverNotes === prepList.handover_notes ? (
            <p className="text-xs text-muted-foreground">Last saved handover notes shown above</p>
          ) : <span />}
          <Button
            size="sm"
            variant="outline"
            onClick={saveHandoverNotes}
            disabled={savingHandover || handoverNotes === (prepList.handover_notes || "")}
          >
            {savingHandover ? "Saving…" : handoverSaved ? "Saved ✓" : "Save Notes"}
          </Button>
        </div>
      </div>

      {/* Photo preview */}
      <PhotoPreviewDialog url={photoDialog} onClose={() => setPhotoDialog(null)} />
    </div>
  );
}