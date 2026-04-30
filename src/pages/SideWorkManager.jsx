import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import SideWorkTaskCard from "../components/sidework/SideWorkTaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, ListPlus, FileUp, X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import ImportDialog from "../components/ImportDialog";

const ROLES = ["server", "bartender", "host", "busser", "food_runner"];
const ROLE_LABELS = { server: "Server", bartender: "Bartender", host: "Host", busser: "Busser", food_runner: "Food Runner" };
const SHIFTS = ["opening", "mid", "closing"];
const SHIFT_LABELS = { opening: "Opening", mid: "Mid-Shift", closing: "Closing" };

export default function SideWorkManager() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState("approvals");
  const [tasks, setTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assigningAll, setAssigningAll] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkRole, setBulkRole] = useState("server");
  const [bulkShift, setBulkShift] = useState("closing");
  const [bulkRows, setBulkRows] = useState([{ name: "", description: "", priority: "medium", due_time: "", requires_photo: false, requires_approval: false }]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", role: "server", shift_type: "closing", priority: "medium", due_time: "", requires_photo: false, requires_approval: false });
  const [assignForm, setAssignForm] = useState({ task_id: "", assigned_to_email: "", assigned_to_name: "", role_assignment: "", assigned_to_individual: false });
  const [viewingPhotoId, setViewingPhotoId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const [bulkApproveIds, setBulkApproveIds] = useState(new Set());
  const [approvingBulk, setApprovingBulk] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    const [t, a] = await Promise.all([
      base44.entities.SideWorkTask.filter({ is_active: true }),
      base44.entities.SideWorkAssignment.filter({ date: todayStr }),
    ]);
    setTasks(t);
    setAssignments(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Pending approvals (completed but not approved)
  const pendingApprovals = assignments.filter(a => a.status === "completed").sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  // Overdue pending tasks
  const now = new Date();
  const overdueTasks = assignments.filter(a => {
    if (a.status !== "pending") return false;
    if (!a.due_time) return false;
    const [h, m] = a.due_time.split(":").map(Number);
    const due = new Date();
    due.setHours(h, m || 0, 0, 0);
    return now > due;
  }).sort((a, b) => a.due_time.localeCompare(b.due_time));

  // Approved tasks
  const approvedTasks = assignments.filter(a => a.status === "approved");

  const createTask = async () => {
    if (!taskForm.name) { toast.error("Task name required"); return; }
    setSaving(true);
    await base44.entities.SideWorkTask.create({ ...taskForm, is_active: true });
    setShowTaskDialog(false);
    setTaskForm({ name: "", description: "", role: "server", shift_type: "closing", priority: "medium", due_time: "", requires_photo: false, requires_approval: false });
    setSaving(false);
    toast.success("Task template created");
    load();
  };

  const openBulkDialog = () => {
    setBulkRole("server");
    setBulkShift("closing");
    setBulkRows([{ name: "", description: "", priority: "medium", due_time: "", requires_photo: false, requires_approval: false }]);
    setShowBulkDialog(true);
  };

  const addBulkRow = () => setBulkRows(prev => [...prev, { name: "", description: "", priority: "medium", due_time: "", requires_photo: false, requires_approval: false }]);
  const removeBulkRow = (i) => setBulkRows(prev => prev.filter((_, idx) => idx !== i));
  const updateBulkRow = (i, field, value) => setBulkRows(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const saveBulk = async () => {
    const valid = bulkRows.filter(r => r.name.trim());
    if (valid.length === 0) { toast.error("Add at least one task name"); return; }
    setBulkSaving(true);
    await base44.entities.SideWorkTask.bulkCreate(valid.map(r => ({
      name: r.name.trim(),
      description: r.description || "",
      role: bulkRole,
      shift_type: bulkShift,
      priority: r.priority,
      due_time: r.due_time || "",
      requires_photo: r.requires_photo,
      requires_approval: r.requires_approval,
      is_active: true,
    })));
    setBulkSaving(false);
    setShowBulkDialog(false);
    toast.success(`${valid.length} task${valid.length > 1 ? "s" : ""} created`);
    load();
  };

  const deleteTask = async (id) => {
    await base44.entities.SideWorkTask.update(id, { is_active: false });
    toast.success("Task removed");
    load();
  };

  const assignTask = async () => {
    if (!assignForm.task_id) { toast.error("Select a task"); return; }
    const task = tasks.find(t => t.id === assignForm.task_id);
    if (!task) return;
    setSaving(true);
    await base44.entities.SideWorkAssignment.create({
      task_id: task.id,
      task_name: task.name,
      description: task.description,
      role: task.role,
      shift_type: task.shift_type,
      priority: task.priority,
      due_time: task.due_time,
      requires_photo: task.requires_photo,
      requires_approval: task.requires_approval,
      date: todayStr,
      assigned_to_email: assignForm.assigned_to_email,
      assigned_to_name: assignForm.assigned_to_name,
      role_assignment: assignForm.role_assignment,
      assigned_to_individual: assignForm.assigned_to_individual,
      status: "pending",
    });
    setShowAssignDialog(false);
    setAssignForm({ task_id: "", assigned_to_email: "", assigned_to_name: "", role_assignment: "", assigned_to_individual: false });
    setSaving(false);
    toast.success("Task assigned for today");
    load();
  };

  const assignAllTasks = async () => {
    setAssigningAll(true);
    const existing = new Set(assignments.map(a => a.task_id));
    const toAssign = tasks.filter(t => !existing.has(t.id));
    if (toAssign.length === 0) { toast.info("All tasks already assigned today"); setAssigningAll(false); return; }
    await base44.entities.SideWorkAssignment.bulkCreate(toAssign.map(task => ({
      task_id: task.id, task_name: task.name, description: task.description,
      role: task.role, shift_type: task.shift_type, priority: task.priority,
      due_time: task.due_time, requires_photo: task.requires_photo,
      requires_approval: task.requires_approval, date: todayStr,
      assigned_to_email: "", assigned_to_name: "", status: "pending",
    })));
    setAssigningAll(false);
    toast.success(`${toAssign.length} tasks assigned for today`);
    load();
  };

  const handleApproveTask = async (id) => {
    await base44.entities.SideWorkAssignment.update(id, { status: "approved", approved_at: new Date().toISOString() });
    toast.success("Task approved");
    load();
  };

  const handleRejectTask = async (id) => {
    await base44.entities.SideWorkAssignment.update(id, { status: "rejected", rejection_notes: rejectionComment });
    setRejectingId(null);
    setRejectionComment("");
    toast.success("Task rejected");
    load();
  };

  const handleBulkApprove = async () => {
    setApprovingBulk(true);
    await Promise.all(
      Array.from(bulkApproveIds).map(id =>
        base44.entities.SideWorkAssignment.update(id, { status: "approved", approved_at: new Date().toISOString() })
      )
    );
    setBulkApproveIds(new Set());
    setApprovingBulk(false);
    toast.success(`${bulkApproveIds.size} tasks approved`);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Side Work Manager</h1>
          <p className="text-muted-foreground mt-1">Today — {todayStr}</p>
          {pendingApprovals.length > 0 && <p className="text-sm text-yellow-600 mt-2 font-semibold">⏳ {pendingApprovals.length} pending approval</p>}
          {overdueTasks.length > 0 && <p className="text-sm text-red-600 font-semibold">⏰ {overdueTasks.length} overdue</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowTaskDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />Template
          </Button>
          <Button size="sm" onClick={() => setShowAssignDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />Assign
          </Button>
          {bulkApproveIds.size > 0 && (
            <Button size="sm" onClick={handleBulkApprove} disabled={approvingBulk} className="bg-green-600 hover:bg-green-700">
              {approvingBulk ? "Approving..." : `Approve ${bulkApproveIds.size}`}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={openBulkDialog}>
            <ListPlus className="h-4 w-4 mr-1" />Bulk Tasks
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4 mr-1" />Import
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit flex-wrap">
        {["approvals", "overdue", "approved", "templates"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t === "approvals" ? `Approvals (${pendingApprovals.length})` : t === "overdue" ? `Overdue (${overdueTasks.length})` : t === "approved" ? `Approved (${approvedTasks.length})` : "Templates"}
          </button>
        ))}
      </div>

      {/* Approvals Tab */}
      {tab === "approvals" && (
        <div className="space-y-3">
          {pendingApprovals.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">All caught up! No pending approvals.</div>
          ) : (
            pendingApprovals.map(a => (
              <div key={a.id} className="bg-card border-2 border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-sm">{a.task_name}</p>
                    <p className="text-xs text-muted-foreground">Assigned to: {a.assigned_to_name || a.assigned_to_email || "Unassigned"}</p>
                    {a.completion_notes && <p className="text-xs text-muted-foreground mt-1">Note: {a.completion_notes}</p>}
                  </div>
                  <span className="text-xs bg-yellow-500/20 text-yellow-700 px-2 py-1 rounded font-semibold">Awaiting Review</span>
                </div>
                {a.photo_url && (
                  <button onClick={() => setViewingPhotoId(a.id)} className="text-xs text-primary hover:underline mb-3">📷 View Photo</button>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproveTask(a.id)} className="bg-green-600 hover:bg-green-700">✓ Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectingId(a.id)}>✕ Reject</Button>
                  <label className="text-xs flex items-center gap-2 ml-auto">
                    <input type="checkbox" checked={bulkApproveIds.has(a.id)} onChange={(e) => {
                      const newSet = new Set(bulkApproveIds);
                      if (e.target.checked) newSet.add(a.id);
                      else newSet.delete(a.id);
                      setBulkApproveIds(newSet);
                    }} />
                    Bulk
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Overdue Tab */}
      {tab === "overdue" && (
        <div className="space-y-3">
          {overdueTasks.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">No overdue tasks!</div>
          ) : (
            overdueTasks.map(a => (
              <div key={a.id} className="bg-card border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-sm">{a.task_name}</p>
                    <p className="text-xs text-muted-foreground">Due: {a.due_time} • {a.assigned_to_name || a.assigned_to_email}</p>
                  </div>
                  <span className="text-xs bg-red-500/20 text-red-700 px-2 py-1 rounded font-semibold">Overdue</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approved Tab (Collapsed) */}
      {tab === "approved" && (
        <div className="space-y-2">
          {approvedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No approved tasks yet.</div>
          ) : (
            <div className="opacity-60 space-y-1">
              {approvedTasks.map(a => (
                <div key={a.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                  <p className="text-sm line-through">{a.task_name}</p>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {tab === "templates" && (
        <div className="space-y-3">
          {tasks.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">No task templates. Create one!</div>
          )}
          {ROLES.map(role => {
            const roleTasks = tasks.filter(t => t.role === role);
            if (roleTasks.length === 0) return null;
            return (
              <div key={role} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30 font-semibold text-sm">{ROLE_LABELS[role]}</div>
                <div className="divide-y divide-border">
                  {roleTasks.map(task => (
                    <div key={task.id} className="flex items-start justify-between px-4 py-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.name}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{SHIFT_LABELS[task.shift_type]}</span>
                          <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{task.priority}</span>
                          {task.requires_photo && <span className="text-[10px] text-primary">📷</span>}
                          {task.requires_approval && <span className="text-[10px] text-yellow-600">✓</span>}
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Viewer */}
      {viewingPhotoId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewingPhotoId(null)}>
          <div className="bg-card rounded-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            {assignments.find(a => a.id === viewingPhotoId)?.photo_url && (
              <img src={assignments.find(a => a.id === viewingPhotoId).photo_url} alt="Task proof" className="w-full h-auto rounded-t-xl max-h-96 object-cover" />
            )}
            <div className="p-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setViewingPhotoId(null)}>Close</Button>
              <Button onClick={() => { handleApproveTask(viewingPhotoId); setViewingPhotoId(null); }} className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Task</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Reason for Rejection</Label>
            <Textarea value={rejectionComment} onChange={(e) => setRejectionComment(e.target.value)} placeholder="Explain why this task needs to be redone..." className="mt-2 min-h-20" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button onClick={() => handleRejectTask(rejectingId)} className="bg-red-600 hover:bg-red-700">Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} type="sidework_tasks" onImport={async (rows) => {
        await Promise.all(rows.map(row => base44.entities.SideWorkTask.create({
          name: row.name, description: row.description || "", role: ROLES.includes(row.role) ? row.role : "server",
          shift_type: SHIFTS.includes(row.shift_type) ? row.shift_type : "closing", priority: ["high", "medium", "low"].includes(row.priority) ? row.priority : "medium",
          due_time: row.due_time || "", requires_photo: row.requires_photo === "true" || row.requires_photo === true,
          requires_approval: row.requires_approval === "true" || row.requires_approval === true, is_active: true,
        })));
        load();
      }} />

      {/* Bulk Add Dialog (kept simple) */}
      {showBulkDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowBulkDialog(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-lg">Bulk Add Tasks</h2>
              <button onClick={() => setShowBulkDialog(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Role</label><select className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm" value={bulkRole} onChange={e => setBulkRole(e.target.value)}>{ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Shift</label><select className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm" value={bulkShift} onChange={e => setBulkShift(e.target.value)}>{SHIFTS.map(s => <option key={s} value={s}>{SHIFT_LABELS[s]}</option>)}</select></div>
              </div>
              <div className="space-y-3">
                {bulkRows.map((row, i) => (
                  <div key={i} className="grid gap-2">
                    <input className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm" value={row.name} onChange={e => updateBulkRow(i, "name", e.target.value)} placeholder="Task name *" />
                    <input className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm" value={row.description} onChange={e => updateBulkRow(i, "description", e.target.value)} placeholder="Description" />
                    <input className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm" value={row.due_time} onChange={e => updateBulkRow(i, "due_time", e.target.value)} placeholder="Due time (e.g. 5:00 PM)" />
                    <div className="flex gap-3">
                      <select className="flex-1 h-8 px-2 rounded-lg bg-background border border-border text-sm" value={row.priority} onChange={e => updateBulkRow(i, "priority", e.target.value)}>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      {bulkRows.length > 1 && <button onClick={() => removeBulkRow(i)} className="text-destructive"><X className="h-4 w-4" /></button>}
                    </div>
                    <div className="flex gap-3 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={row.requires_photo} onChange={e => updateBulkRow(i, "requires_photo", e.target.checked)} />Photo</label>
                      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={row.requires_approval} onChange={e => updateBulkRow(i, "requires_approval", e.target.checked)} />Approval</label>
                    </div>
                  </div>
                ))}
                <button onClick={addBulkRow} className="text-xs text-primary hover:text-primary/80"><Plus className="h-3 w-3 inline mr-1" />Add another</button>
              </div>
            </div>
            <div className="flex gap-2 justify-end p-5 border-t border-border">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
              <Button onClick={saveBulk} disabled={bulkSaving}>{bulkSaving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Task Template</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Task Name</Label><Input className="mt-1" value={taskForm.name} onChange={e => setTaskForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Roll silverware" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role</Label><Select value={taskForm.role} onValueChange={v => setTaskForm(p => ({ ...p, role: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Shift</Label><Select value={taskForm.shift_type} onValueChange={v => setTaskForm(p => ({ ...p, shift_type: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{SHIFT_LABELS[s]}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={taskForm.requires_photo} onChange={e => setTaskForm(p => ({ ...p, requires_photo: e.target.checked }))} />Photo Required</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={taskForm.requires_approval} onChange={e => setTaskForm(p => ({ ...p, requires_approval: e.target.checked }))} />Needs Approval</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
            <Button onClick={createTask} disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Task</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Task</Label><Select value={assignForm.task_id} onValueChange={v => setAssignForm(p => ({ ...p, task_id: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{tasks.map(t => <SelectItem key={t.id} value={t.id}>{ROLE_LABELS[t.role]} • {t.name}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={assignForm.assigned_to_individual} onChange={e => setAssignForm(p => ({ ...p, assigned_to_individual: e.target.checked }))} />Assign to person</label></div>
            {assignForm.assigned_to_individual && <>
              <div><Label>Name</Label><Input className="mt-1" value={assignForm.assigned_to_name} onChange={e => setAssignForm(p => ({ ...p, assigned_to_name: e.target.value }))} placeholder="Employee name" /></div>
              <div><Label>Email</Label><Input className="mt-1" value={assignForm.assigned_to_email} onChange={e => setAssignForm(p => ({ ...p, assigned_to_email: e.target.value }))} placeholder="employee@restaurant.com" /></div>
            </>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={assignTask} disabled={saving}>{saving ? "Assigning..." : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}