import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import SideWorkTaskCard from "../components/sidework/SideWorkTaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, ListPlus, FileUp, X, AlertCircle, Clock, CheckCircle2, Users } from "lucide-react";
import ImportDialog from "../components/ImportDialog";

const ROLES = ["server", "bartender", "host", "busser", "food_runner"];
const ROLE_LABELS = { server: "Server", bartender: "Bartender", host: "Host", busser: "Busser", food_runner: "Food Runner" };
const SHIFTS = ["opening", "mid", "closing"];
const SHIFT_LABELS = { opening: "Opening", mid: "Mid-Shift", closing: "Closing" };

export default function SideWorkManager() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState("opening");
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
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // By employee
  const byEmployee = {};
  assignments.forEach(a => {
    const key = a.assigned_to_name || a.assigned_to_email || "Unassigned";
    if (!byEmployee[key]) byEmployee[key] = { total: 0, done: 0, pending: 0 };
    byEmployee[key].total++;
    if (a.status === "approved" || a.status === "completed") byEmployee[key].done++;
    if (a.status === "pending") byEmployee[key].pending++;
  });

  // Get assignments by shift with filters
  const getAssignmentsByShift = (shift) => {
    let result = assignments.filter(a => a.shift_type === shift);
    if (roleFilter !== "all") result = result.filter(a => a.role === roleFilter);
    if (statusFilter !== "all") result = result.filter(a => a.status === statusFilter);
    return result;
  };

  // Group by role
  const getGroupedByRole = (shift) => {
    const filtered = getAssignmentsByShift(shift);
    const grouped = {};
    filtered.forEach(a => {
      if (!grouped[a.role]) grouped[a.role] = { all: [], pending: [], approved: [] };
      grouped[a.role].all.push(a);
      if (a.status === "pending" || a.status === "rejected") grouped[a.role].pending.push(a);
      if (a.status === "approved") grouped[a.role].approved.push(a);
    });
    return grouped;
  };

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
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowTaskDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />Template
          </Button>
          <Button size="sm" onClick={() => setShowAssignDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />Assign Task
          </Button>
          <Button size="sm" variant="secondary" onClick={assignAllTasks} disabled={assigningAll}>
            {assigningAll ? "Assigning..." : "Assign All"}
          </Button>
          <Button size="sm" variant="outline" onClick={openBulkDialog}>
            <ListPlus className="h-4 w-4 mr-1" />Bulk
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4 mr-1" />Import
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit flex-wrap">
        {["opening", "closing", "templates"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t === "opening" ? "Opening" : t === "closing" ? "Closing" : "Templates"}
          </button>
        ))}
      </div>

      {/* Filters for shift views */}
      {(tab === "opening" || tab === "closing") && (
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
            <button onClick={() => setRoleFilter("all")} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", roleFilter === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>All Roles</button>
            {ROLES.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", roleFilter === r ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>{ROLE_LABELS[r]}</button>
            ))}
          </div>
          <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
            <button onClick={() => setStatusFilter("all")} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", statusFilter === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>All</button>
            <button onClick={() => setStatusFilter("pending")} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", statusFilter === "pending" ? "bg-red-500/20 text-red-700" : "text-muted-foreground hover:text-foreground")}>Pending</button>
            <button onClick={() => setStatusFilter("approved")} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", statusFilter === "approved" ? "bg-green-500/20 text-green-700" : "text-muted-foreground hover:text-foreground")}>Approved</button>
          </div>
        </div>
      )}

      {/* Opening/Closing Shift View */}
      {(tab === "opening" || tab === "closing") && (
        <div className="space-y-4">
          {Object.entries(getGroupedByRole(tab)).map(([role, data]) => (
            <div key={role} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Role Header */}
              <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm capitalize">{ROLE_LABELS[role]}</span>
                  <span className="text-xs text-muted-foreground">{data.approved.length}/{data.all.length}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${data.all.length > 0 ? (data.approved.length / data.all.length) * 100 : 0}%` }} />
                </div>
              </div>
              {/* Tasks */}
              <div className="divide-y divide-border">
                {data.pending.length > 0 && (
                  <div className="px-4 py-3 bg-red-500/5">
                    <p className="text-xs font-semibold text-red-700 mb-2">Pending ({data.pending.length})</p>
                    <div className="space-y-2">
                      {data.pending.map(a => (
                        <SideWorkTaskCard key={a.id} assignment={a} currentUser={user} isManager={true} onRefresh={load} />
                      ))}
                    </div>
                  </div>
                )}
                {data.approved.length > 0 && (
                  <div className="px-4 py-3 bg-green-500/5">
                    <p className="text-xs font-semibold text-green-700 mb-2">Approved ({data.approved.length})</p>
                    <div className="space-y-2 opacity-60">
                      {data.approved.map(a => (
                        <SideWorkTaskCard key={a.id} assignment={a} currentUser={user} isManager={true} onRefresh={load} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {Object.keys(getGroupedByRole(tab)).length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
              No tasks assigned for {tab} shift.
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {tab === "templates" && (
        <div className="space-y-3">
          {tasks.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">No task templates yet. Create one!</div>
          )}
          {ROLES.map(role => {
            const roleTasks = tasks.filter(t => t.role === role);
            if (roleTasks.length === 0) return null;
            return (
              <div key={role} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                  <span className="font-semibold text-sm">{ROLE_LABELS[role]}</span>
                </div>
                <div className="divide-y divide-border">
                  {roleTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{task.name}</span>
                          <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{SHIFT_LABELS[task.shift_type]}</span>
                          <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{task.priority}</span>
                          {task.requires_photo && <span className="text-[10px] text-primary">📷 Photo</span>}
                          {task.requires_approval && <span className="text-[10px] text-yellow-400">✓ Approval</span>}
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                        {task.due_time && <p className="text-xs text-muted-foreground">Due: {task.due_time}</p>}
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
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

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="sidework_tasks"
        onImport={async (rows) => {
          await Promise.all(rows.map(row =>
            base44.entities.SideWorkTask.create({
              name: row.name,
              description: row.description || "",
              role: ["server", "bartender", "host", "busser", "food_runner"].includes(row.role) ? row.role : "server",
              shift_type: ["opening", "mid", "closing"].includes(row.shift_type) ? row.shift_type : "closing",
              priority: ["high", "medium", "low"].includes(row.priority) ? row.priority : "medium",
              due_time: row.due_time || "",
              requires_photo: row.requires_photo === "true" || row.requires_photo === true,
              requires_approval: row.requires_approval === "true" || row.requires_approval === true,
              is_active: true,
            })
          ));
          load();
        }}
      />

      {/* Bulk Add Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowBulkDialog(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-lg">Bulk Add Tasks</h2>
              <button onClick={() => setShowBulkDialog(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                  <select className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={bulkRole} onChange={e => setBulkRole(e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Shift</label>
                  <select className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={bulkShift} onChange={e => setBulkShift(e.target.value)}>
                    {SHIFTS.map(s => <option key={s} value={s}>{SHIFT_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                  <div className="col-span-4">Task Name *</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-2">Due Time</div>
                  <div className="col-span-1"></div>
                </div>
                {bulkRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input
                        className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={row.name}
                        onChange={e => updateBulkRow(i, "name", e.target.value)}
                        placeholder="Task name"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={row.description}
                        onChange={e => updateBulkRow(i, "description", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={row.priority}
                        onChange={e => updateBulkRow(i, "priority", e.target.value)}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        className="w-full h-8 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={row.due_time}
                        onChange={e => updateBulkRow(i, "due_time", e.target.value)}
                        placeholder="5:00 PM"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {bulkRows.length > 1 && (
                        <button onClick={() => removeBulkRow(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="col-span-11 flex gap-4 pl-1">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground">
                        <input type="checkbox" checked={row.requires_photo} onChange={e => updateBulkRow(i, "requires_photo", e.target.checked)} />
                        📷 Photo
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground">
                        <input type="checkbox" checked={row.requires_approval} onChange={e => updateBulkRow(i, "requires_approval", e.target.checked)} />
                        ✓ Approval
                      </label>
                    </div>
                  </div>
                ))}
                <button onClick={addBulkRow} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors pt-1">
                  <Plus className="h-4 w-4" /> Add another task
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end p-5 border-t border-border">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
              <Button onClick={saveBulk} disabled={bulkSaving}>
                {bulkSaving ? "Saving…" : `Save ${bulkRows.filter(r => r.name.trim()).length || ""} Tasks`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Template Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Task Template</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Task Name</Label><Input className="mt-1" value={taskForm.name} onChange={e => setTaskForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Roll silverware" /></div>
            <div><Label>Description</Label><Input className="mt-1" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional instructions..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={taskForm.role} onValueChange={v => setTaskForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shift</Label>
                <Select value={taskForm.shift_type} onValueChange={v => setTaskForm(p => ({ ...p, shift_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{SHIFT_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Due Time</Label><Input className="mt-1" value={taskForm.due_time} onChange={e => setTaskForm(p => ({ ...p, due_time: e.target.value }))} placeholder="e.g., 5:00 PM" /></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={taskForm.requires_photo} onChange={e => setTaskForm(p => ({ ...p, requires_photo: e.target.checked }))} className="rounded" />
                Requires Photo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={taskForm.requires_approval} onChange={e => setTaskForm(p => ({ ...p, requires_approval: e.target.checked }))} className="rounded" />
                Requires Approval
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
            <Button onClick={createTask} disabled={saving}>{saving ? "Saving..." : "Create Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Task Today</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Task Template</Label>
              <Select value={assignForm.task_id} onValueChange={v => setAssignForm(p => ({ ...p, task_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a task..." /></SelectTrigger>
                <SelectContent>{tasks.map(t => <SelectItem key={t.id} value={t.id}>{ROLE_LABELS[t.role]} — {t.name} ({SHIFT_LABELS[t.shift_type]})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign to Role (optional)</Label>
              <Input className="mt-1" value={assignForm.role_assignment} onChange={e => setAssignForm(p => ({ ...p, role_assignment: e.target.value }))} placeholder="e.g., Server, Bartender" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={assignForm.assigned_to_individual} onChange={e => setAssignForm(p => ({ ...p, assigned_to_individual: e.target.checked }))} className="rounded" />
                Assign to specific person
              </label>
            </div>
            {assignForm.assigned_to_individual && (
              <>
                <div><Label>Staff Name</Label><Input className="mt-1" value={assignForm.assigned_to_name} onChange={e => setAssignForm(p => ({ ...p, assigned_to_name: e.target.value }))} placeholder="e.g., Sarah" /></div>
                <div><Label>Staff Email</Label><Input className="mt-1" value={assignForm.assigned_to_email} onChange={e => setAssignForm(p => ({ ...p, assigned_to_email: e.target.value }))} placeholder="staff@example.com" /></div>
              </>
            )}
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