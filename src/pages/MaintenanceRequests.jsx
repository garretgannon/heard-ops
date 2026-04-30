import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Wrench, Plus, Trash2, CheckCircle2, Clock, AlertTriangle, Zap, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRIORITY_CONFIG = {
  low:    { label: "Low",    color: "text-muted-foreground", bg: "bg-secondary",          icon: Clock },
  medium: { label: "Medium", color: "text-amber-400",        bg: "bg-amber-500/15 border border-amber-500/30", icon: AlertTriangle },
  high:   { label: "High",   color: "text-orange-400",       bg: "bg-orange-500/15 border border-orange-500/30", icon: AlertTriangle },
  urgent: { label: "Urgent", color: "text-destructive",      bg: "bg-red-500/15 border border-red-500/30",  icon: Zap },
};

const STATUS_CONFIG = {
  open:        { label: "Open",        color: "text-blue-400",   bg: "bg-blue-500/15 border border-blue-500/30" },
  in_progress: { label: "In Progress", color: "text-amber-400",  bg: "bg-amber-500/15 border border-amber-500/30" },
  resolved:    { label: "Resolved",    color: "text-green-400",  bg: "bg-green-500/15 border border-green-500/30" },
};

const emptyForm = { title: "", location: "", description: "", priority: "medium", status: "open", reported_by: "", notes: "" };

export default function MaintenanceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const load = async () => {
    const data = await base44.entities.MaintenanceRequest.list("-created_date", 200);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.location) return;
    setSaving(true);
    await base44.entities.MaintenanceRequest.create({ ...form });
    setSaving(false);
    setDialog(false);
    setForm(emptyForm);
    toast.success("Request submitted");
    load();
  };

  const handleUpdate = async () => {
    setSaving(true);
    const updates = { ...editForm };
    if (editForm.status === "resolved" && !editForm.resolved_at) {
      updates.resolved_at = new Date().toISOString();
    }
    await base44.entities.MaintenanceRequest.update(editForm.id, updates);
    setSaving(false);
    setEditDialog(false);
    setEditForm(null);
    toast.success("Updated");
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.MaintenanceRequest.delete(id);
    toast.success("Deleted");
    load();
  };

  const filtered = filterStatus === "all" ? requests : requests.filter(r => r.status === filterStatus);
  const openCount = requests.filter(r => r.status === "open").length;
  const urgentCount = requests.filter(r => r.priority === "urgent" && r.status !== "resolved").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wrench className="h-7 w-7 text-primary" /> Maintenance
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Track and manage facility issues and repair requests.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />New Request
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="text-2xl font-bold text-blue-400">{openCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Urgent</p>
          <p className={cn("text-2xl font-bold", urgentCount > 0 ? "text-destructive" : "text-muted-foreground")}>{urgentCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{requests.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {["all", "open", "in_progress", "resolved"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
          {filterStatus === "all" ? "No maintenance requests yet." : `No ${STATUS_CONFIG[filterStatus]?.label.toLowerCase()} requests.`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const p = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.medium;
            const s = STATUS_CONFIG[req.status] || STATUS_CONFIG.open;
            const PIcon = p.icon;
            return (
              <div key={req.id} className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", p.bg)}>
                  <PIcon className={cn("h-4 w-4", p.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{req.title}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", s.bg, s.color)}>{s.label}</span>
                    <span className={cn("text-xs font-medium", p.color)}>{p.label} priority</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{req.location}</p>
                  {req.description && <p className="text-xs text-muted-foreground mt-1">{req.description}</p>}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {req.reported_by && <span className="text-xs text-muted-foreground">by {req.reported_by}</span>}
                    {req.resolved_at && <span className="text-xs text-muted-foreground">Resolved {new Date(req.resolved_at).toLocaleDateString()}</span>}
                    {req.notes && <span className="text-xs text-muted-foreground italic">{req.notes}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => { setEditForm({ ...req }); setEditDialog(true); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(req.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Issue Title</Label>
              <Input placeholder="e.g., Ice machine not making ice" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Location / Area</Label>
              <Input placeholder="e.g., Bar, Walk-in, Men's Restroom" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea rows={2} className="resize-none" placeholder="More detail about the issue..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reported By</Label>
                <Input placeholder="Your name" value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.location}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Update Dialog */}
      {editForm && (
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Update Request</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={v => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes / Updates</Label>
                <Textarea rows={3} className="resize-none" placeholder="Add any update notes..." value={editForm.notes || ""} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={saving}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}