import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useCurrentUser } from "../hooks/useCurrentUser";
import SideWorkTaskCard from "../components/sidework/SideWorkTaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, CheckCircle2, Clock, AlertCircle, Users, Trash2, Zap } from "lucide-react";

const ROLES = ["server", "bartender", "host", "busser", "food_runner"];
const ROLE_LABELS = { server: "Server", bartender: "Bartender", host: "Host", busser: "Busser", food_runner: "Food Runner" };
const SHIFTS = ["opening", "mid", "closing"];
const SHIFT_LABELS = { opening: "Opening", mid: "Mid-Shift", closing: "Closing" };

const TABS = ["dashboard", "approvals", "tasks", "assign"];
const TAB_LABELS = { dashboard: "Dashboard", approvals: "Approvals", tasks: "Task Templates", assign: "Assign Today" };

export default function SideWorkManager() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assigningAll, setAssigningAll] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", role: "server", shift_type: "closing", priority: "medium", due_time: "", requires_photo: false, requires_approval: false });
  const [assignForm, setAssignForm] = useState({ task_id: "", assigned_to_email: "", assigned_to_name: "" });

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

  // Dashboard stats
  const pending = assignments.filter(a => a.status === "pending" || a.status === "rejected");
  const pendingApprovals = assignments.filter(a => a.status === "completed");
  const approved = assignments.filter(a => a.status === "approved");

  const now = new Date();
  const late = pending.filter(a => {
    if (!a.due_time) return false;
    const [time, ampm] = a.due_time.split(" ");
    if (!time) return false;
    const [h, m] = time.split(":").map(Number);
    let hours = h;
    if (ampm === "PM" && h !== 12) hours += 12;
    if (ampm === "AM" && h === 12) hours = 0;
    const due = new Date(); due.setHours(hours, m || 0, 0, 0);
    return now > due;
  });

  // By employee
  const byEmployee = {};
  assignments.forEach(a => {
    const key = a.assigned_to_name || a.assigned_to_email || "Unassigned";
    if (!byEmployee[key]) byEmployee[key] = { total: 0, done: 0 };
    byEmployee[key].total++;
    if (a.status === "approved" || a.status === "completed") byEmployee[key].done++;
  });

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
      status: "pending",
    });
    setShowAssignDialog(false);
    setAssignForm({ task_id: "", assigned_to_email: "", assigned_to_name: "" });
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Side Work Manager</h1>
          <p className="text-muted-foreground mt-1">Today — {todayStr}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowTaskDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />New Template
          </Button>
          <Button size="sm" onClick={() => setShowAssignDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />Assign Task
          </Button>
          <Button size="sm" variant="secondary" onClick={assignAllTasks} disabled={assigningAll}>
            <Zap className="h-4 w-4 mr-1" />{assigningAll ? "Assigning..." : "Assign All Today"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {TAB_LABELS[t]}
            {t === "approvals" && pendingApprovals.length > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingApprovals.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "To Do", value: pending.length, icon: AlertCircle, color: "text-red-400" },
              { label: "Pending Approval", value: pendingApprovals.length, icon: Clock, color: "text-yellow-400" },
              { label: "Late Tasks", value: late.length, icon: AlertCircle, color: "text-orange-400" },
              { label: "Approved", value: approved.length, icon: CheckCircle2, color: "text-green-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <stat.icon className={cn("h-5 w-5 mb-2", stat.color)} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* By employee */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" />By Employee</h2>
            {Object.keys(byEmployee).length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments yet today.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byEmployee).map(([name, { total, done }]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground text-xs">{done}/{total}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All today's tasks */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">All Today's Tasks</h2>
            {assignments.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                No tasks assigned today. Use "Assign All Today" to load from templates.
              </div>
            ) : assignments.map(a => (
              <SideWorkTaskCard key={a.id} assignment={a} currentUser={user} isManager={true} onRefresh={load} />
            ))}
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {tab === "approvals" && (
        <div className="space-y-3">
          {pendingApprovals.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">No pending approvals.</div>
          ) : pendingApprovals.map(a => (
            <SideWorkTaskCard key={a.id} assignment={a} currentUser={user} isManager={true} onRefresh={load} />
          ))}
        </div>
      )}

      {/* Task Templates Tab */}
      {tab === "tasks" && (
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
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Tab */}
      {tab === "assign" && (
        <div className="space-y-3">
          {SHIFTS.map(shift => {
            const shiftAssignments = assignments.filter(a => a.shift_type === shift);
            if (shiftAssignments.length === 0) return null;
            return (
              <div key={shift} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                  <span className="font-semibold text-sm">{SHIFT_LABELS[shift]}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{shiftAssignments.filter(a => a.status === "approved").length}/{shiftAssignments.length} done</span>
                </div>
                <div className="p-3 space-y-2">
                  {shiftAssignments.map(a => (
                    <SideWorkTaskCard key={a.id} assignment={a} currentUser={user} isManager={true} onRefresh={load} />
                  ))}
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
              No tasks assigned today.
            </div>
          )}
        </div>
      )}

      {/* Create Task Template Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Task Template</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Task Name</Label><Input className="mt-1" value={taskForm.name} onChange={e => setTaskForm(p => ({...p, name: e.target.value}))} placeholder="e.g., Roll silverware" /></div>
            <div><Label>Description</Label><Textarea className="mt-1" rows={2} value={taskForm.description} onChange={e => setTaskForm(p => ({...p, description: e.target.value}))} placeholder="Optional instructions..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={taskForm.role} onValueChange={v => setTaskForm(p => ({...p, role: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shift</Label>
                <Select value={taskForm.shift_type} onValueChange={v => setTaskForm(p => ({...p, shift_type: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{SHIFT_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm(p => ({...p, priority: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Due Time</Label><Input className="mt-1" value={taskForm.due_time} onChange={e => setTaskForm(p => ({...p, due_time: e.target.value}))} placeholder="e.g., 5:00 PM" /></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={taskForm.requires_photo} onChange={e => setTaskForm(p => ({...p, requires_photo: e.target.checked}))} className="rounded" />
                Requires Photo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={taskForm.requires_approval} onChange={e => setTaskForm(p => ({...p, requires_approval: e.target.checked}))} className="rounded" />
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
              <Select value={assignForm.task_id} onValueChange={v => setAssignForm(p => ({...p, task_id: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a task..." /></SelectTrigger>
                <SelectContent>{tasks.map(t => <SelectItem key={t.id} value={t.id}>{ROLE_LABELS[t.role]} — {t.name} ({SHIFT_LABELS[t.shift_type]})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Staff Name (optional)</Label><Input className="mt-1" value={assignForm.assigned_to_name} onChange={e => setAssignForm(p => ({...p, assigned_to_name: e.target.value}))} placeholder="e.g., Sarah" /></div>
            <div><Label>Staff Email (optional)</Label><Input className="mt-1" value={assignForm.assigned_to_email} onChange={e => setAssignForm(p => ({...p, assigned_to_email: e.target.value}))} placeholder="staff@example.com" /></div>
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