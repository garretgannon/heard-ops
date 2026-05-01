import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wrench, Plus, Trash2, AlertTriangle, Phone, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MaintenanceForm from "../components/forms/MaintenanceForm";

const PRIORITY_CONFIG = {
  low:       { label: "Low",       color: "text-muted-foreground", bg: "bg-secondary" },
  normal:    { label: "Normal",    color: "text-amber-400",        bg: "bg-amber-500/15 border border-amber-500/30" },
  urgent:    { label: "Urgent",    color: "text-orange-400",       bg: "bg-orange-500/15 border border-orange-500/30" },
  emergency: { label: "Emergency", color: "text-destructive",      bg: "bg-red-500/15 border border-red-500/30" },
};

const STATUS_CONFIG = {
  new:                { label: "New",               color: "text-blue-400" },
  assigned:           { label: "Assigned",          color: "text-blue-400" },
  waiting_on_vendor:  { label: "Waiting on Vendor", color: "text-amber-400" },
  in_progress:        { label: "In Progress",       color: "text-orange-400" },
  complete:           { label: "Complete",          color: "text-green-400" },
};

export default function MaintenanceRequests() {
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState(null);

  const load = async () => {
    try {
      const [reqs, vends] = await Promise.all([
        base44.entities.MaintenanceRequest.list("-created_date", 300),
        base44.entities.Vendor.list("-created_date", 200),
      ]);
      setRequests(reqs);
      setVendors(vends);
      setLoading(false);
    } catch (err) {
      console.error("Load error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditForm(f => ({ ...f, invoice_url: file_url }));
      setInvoicePreview(file.name);
      toast.success("Invoice uploaded");
    } catch (err) {
      toast.error("Invoice upload failed");
    }
    setUploading(false);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.MaintenanceRequest.update(editForm.id, editForm);
      setRequests(prev => prev.map(r => r.id === editForm.id ? updated : r));
      toast.success("Request updated");
      setEditDialog(false);
      setEditForm(null);
      setInvoicePreview(null);
    } catch (err) {
      toast.error("Update failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this request?")) return;
    try {
      await base44.entities.MaintenanceRequest.delete(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const open = requests.filter(r => ["new", "assigned"].includes(r.status));
  const urgent = requests.filter(r => ["urgent", "emergency"].includes(r.priority) && r.status !== "complete");
  const waiting = requests.filter(r => r.status === "waiting_on_vendor");
  const completed = requests.filter(r => r.status === "complete");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" /> Maintenance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track facility issues and repairs</p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Request
        </Button>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="urgent">
            Urgent {urgent.length > 0 && <span className="ml-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">{urgent.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="waiting">Waiting ({waiting.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-3">
          {open.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No open requests</div>
          ) : (
            open.map(req => <RequestCard key={req.id} req={req} vendors={vendors} onEdit={(r) => { setEditForm(r); setEditDialog(true); }} onDelete={handleDelete} />)
          )}
        </TabsContent>

        <TabsContent value="urgent" className="space-y-3">
          {urgent.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No urgent requests</div>
          ) : (
            urgent.map(req => <RequestCard key={req.id} req={req} vendors={vendors} onEdit={(r) => { setEditForm(r); setEditDialog(true); }} onDelete={handleDelete} />)
          )}
        </TabsContent>

        <TabsContent value="waiting" className="space-y-3">
          {waiting.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No requests waiting on vendor</div>
          ) : (
            waiting.map(req => <RequestCard key={req.id} req={req} vendors={vendors} onEdit={(r) => { setEditForm(r); setEditDialog(true); }} onDelete={handleDelete} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completed.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No completed requests</div>
          ) : (
            completed.map(req => <RequestCard key={req.id} req={req} vendors={vendors} onEdit={(r) => { setEditForm(r); setEditDialog(true); }} onDelete={handleDelete} />)
          )}
        </TabsContent>
      </Tabs>

      <MaintenanceForm
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        onSaved={(r) => setRequests(prev => [r, ...prev])}
      />

      {editForm && (
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Update Request</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="waiting_on_vendor">Waiting on Vendor</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={v => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assign to Vendor</Label>
                <Select value={editForm.vendor_id || ""} onValueChange={v => setEditForm({ ...editForm, vendor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assign to Person</Label>
                <Input placeholder="e.g., John Smith" value={editForm.assigned_to || ""} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })} />
              </div>
              <div>
                <Label>Estimated Cost</Label>
                <Input placeholder="$0.00" value={editForm.estimated_cost || ""} onChange={e => setEditForm({ ...editForm, estimated_cost: e.target.value })} />
              </div>
              <div>
                <Label>Invoice / Receipt</Label>
                {editForm.invoice_url ? (
                  <div className="mt-1.5 p-3 bg-green-500/10 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-green-600 font-semibold">✓ {invoicePreview || "Invoice uploaded"}</span>
                    <button onClick={() => setEditForm({ ...editForm, invoice_url: "" })} className="text-xs text-destructive hover:underline">Remove</button>
                  </div>
                ) : (
                  <label className="mt-1.5 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/50">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Upload invoice"}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleInvoiceUpload} />
                  </label>
                )}
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={2} className="resize-none" placeholder="Update notes..." value={editForm.notes || ""} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={saving}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export const hideBase44Index = true;

function RequestCard({ req, vendors, onEdit, onDelete }) {
  const p = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.normal;
  const s = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
  const vendor = req.vendor_id ? vendors.find(v => v.id === req.vendor_id) : null;

  return (
    <div className={cn("bg-card border-2 rounded-xl p-4 space-y-3", ["emergency", "urgent"].includes(req.priority) ? "border-red-500/40" : "border-border")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold">{req.title}</h3>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", p.bg, p.color)}>{p.label}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full bg-secondary", s.color)}>{s.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{req.location}</p>
          {req.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{req.description}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(req)}>📝</Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(req.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        {req.reported_by && <div>Reported by: <span className="font-semibold">{req.reported_by}</span></div>}
        {req.created_date && <div>Date: <span className="font-semibold">{new Date(req.created_date).toLocaleDateString()}</span></div>}
        {vendor && <div>Vendor: <span className="font-semibold">{vendor.name}</span></div>}
        {req.assigned_to && <div>Assigned to: <span className="font-semibold">{req.assigned_to}</span></div>}
        {req.estimated_cost && <div>Est. Cost: <span className="font-semibold">${req.estimated_cost}</span></div>}
      </div>

      {vendor && vendor.phone && (
        <a href={`tel:${vendor.phone}`}>
          <Button size="sm" variant="outline" className="w-full gap-2">
            <Phone className="h-4 w-4" /> Call {vendor.name}
          </Button>
        </a>
      )}

      <div className="flex gap-2 flex-wrap">
        {req.photo_url && (
          <a href={req.photo_url} target="_blank" rel="noopener noreferrer">
            <img src={req.photo_url} alt="Issue" className="h-16 w-24 object-cover rounded border border-border hover:opacity-80" />
          </a>
        )}
        {req.invoice_url && (
          <a href={req.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-lg hover:opacity-80">
            📄 Invoice
          </a>
        )}
      </div>

      {req.notes && <p className="text-xs italic text-muted-foreground">"{req.notes}"</p>}
    </div>
  );
}