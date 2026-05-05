import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Camera, CheckCircle2, Clock, AlertCircle, Plus, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomSheet from "../components/BottomSheet";

export const hideBase44Index = true;

const todayStr = new Date().toISOString().split("T")[0];
const DEPT_FILTERS = ["All", "FOH", "BOH", "Bar"];

const roleToDept = (role = "") => {
  const r = role.toLowerCase();
  if (["bartender", "bar"].includes(r)) return "Bar";
  if (["cook", "prep", "dishwasher", "boh"].includes(r)) return "BOH";
  return "FOH";
};

const STATUS_STYLE = {
  pending:     { label: "Pending",     cls: "bg-gray-500/12 text-gray-500 border-gray-500/20" },
  in_progress: { label: "In Progress", cls: "bg-amber-500/12 text-amber-400 border-amber-500/20" },
  completed:   { label: "Done",        cls: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" },
  approved:    { label: "Approved",    cls: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" },
  overdue:     { label: "Overdue",     cls: "bg-red-500/12 text-red-400 border-red-500/20" },
};

function MetricTile({ label, value, color, alert }) {
  return (
    <div className={cn("flex flex-col gap-0 bg-[#111827] border rounded-xl p-2.5 min-w-0", alert ? "border-red-500/30" : "border-[#1F2937]")}>
      <span className={cn("text-[20px] font-extrabold leading-none", color)}>{value}</span>
      <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5 leading-tight">{label}</span>
    </div>
  );
}

function TaskCard({ task, onStart, onComplete, onPhotoUpload }) {
  const st = STATUS_STYLE[task.status] || STATUS_STYLE.pending;
  const isDone = ["completed", "approved"].includes(task.status);
  const needsPhoto = task.requires_photo && !task.photo_url;

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-3 border-b border-[#1A2235] last:border-0",
      task.status === "overdue" && "bg-red-500/4"
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("text-[13px] font-semibold leading-tight truncate", isDone ? "line-through text-gray-600" : "text-white")}>
            {task.task_name}
          </p>
          {needsPhoto && <Camera className="h-3 w-3 text-amber-400 shrink-0" />}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
          {task.assigned_to_name && (
            <span className="text-[10px] text-gray-600">{task.assigned_to_name.split(" ")[0]}</span>
          )}
          {task.role_assignment && (
            <><span className="text-[9px] text-gray-700">·</span>
            <span className="text-[10px] text-gray-600">{task.role_assignment}</span></>
          )}
          {task.due_time && (
            <><span className="text-[9px] text-gray-700">·</span>
            <span className={cn("text-[10px] flex items-center gap-0.5", task.status === "overdue" ? "text-red-400 font-bold" : "text-gray-600")}>
              <Clock className="h-2.5 w-2.5" />{task.due_time}
            </span></>
          )}
        </div>
      </div>

      {!isDone && (
        <div className="shrink-0">
          {task.status === "pending" || task.status === "overdue" ? (
            <button onClick={() => onStart(task)}
              className={cn("h-7 px-2.5 rounded-lg text-[11px] font-bold active:scale-95 transition-transform border",
                task.status === "overdue"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400")}>
              Start
            </button>
          ) : task.status === "in_progress" ? (
            needsPhoto ? (
              <button onClick={() => onPhotoUpload(task)}
                className="h-7 px-2.5 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/20 text-[11px] font-bold text-[#F5A623] flex items-center gap-1 active:scale-95 transition-transform">
                <Camera className="h-3 w-3" /> Photo
              </button>
            ) : (
              <button onClick={() => onComplete(task)}
                className="h-7 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 active:scale-95 transition-transform">
                ✓ Done
              </button>
            )
          ) : null}
        </div>
      )}
      {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
    </div>
  );
}

const EMPTY_FORM = { task_name: "", role: "server", shift_type: "closing", due_time: "", station: "", priority: "medium", requires_photo: false, date: todayStr };

export default function SideWork() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.SideWorkAssignment.filter({ date: todayStr });
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return tasks;
    return tasks.filter(t => roleToDept(t.role || t.role_assignment) === filter);
  }, [tasks, filter]);

  const assigned  = tasks.length;
  const completed = tasks.filter(t => ["completed","approved"].includes(t.status)).length;
  const pending   = tasks.filter(t => t.status === "pending").length;
  const overdue   = tasks.filter(t => t.status === "overdue").length;

  const byShift = useMemo(() => {
    const groups = {};
    filtered.forEach(t => {
      const key = t.shift_type || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [filtered]);

  const SHIFT_LABEL = { opening: "Opening", mid: "Mid-Shift", closing: "Closing", daily: "Daily", weekly: "Weekly", other: "Other" };

  const handleStart = async (task) => {
    await base44.entities.SideWorkAssignment.update(task.id, { status: "in_progress" });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "in_progress" } : t));
  };

  const handleComplete = async (task) => {
    await base44.entities.SideWorkAssignment.update(task.id, { status: "completed", completed_at: new Date().toISOString() });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "completed" } : t));
    toast.success("Task completed ✓");
  };

  const handleCreate = async () => {
    if (!form.task_name.trim()) return;
    setSaving(true);
    const created = await base44.entities.SideWorkAssignment.create({ ...form, status: "pending" });
    setTasks(prev => [...prev, created]);
    setSheetOpen(false);
    setForm(EMPTY_FORM);
    setSaving(false);
    toast.success("Task added");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-2.5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-orange-400" />
            <h1 className="text-[17px] font-extrabold text-white tracking-tight">Side Work</h1>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">{format(new Date(), "EEEE, MMM d")} · {tasks.length} tasks</p>
        </div>
        <button onClick={() => setSheetOpen(true)}
          className="h-9 w-9 rounded-xl bg-[#F5A623] flex items-center justify-center active:scale-95 transition-transform">
          <Plus className="h-4 w-4 text-black" />
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricTile label="Total"    value={assigned}  color="text-white" />
        <MetricTile label="Done"     value={completed} color={completed > 0 ? "text-emerald-400" : "text-white"} />
        <MetricTile label="Pending"  value={pending}   color={pending > 0 ? "text-amber-400" : "text-white"} />
        <MetricTile label="Overdue"  value={overdue}   color={overdue > 0 ? "text-red-400" : "text-white"} alert={overdue > 0} />
      </div>

      {/* Department filters */}
      <div className="flex gap-1.5">
        {DEPT_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95",
              filter === f ? "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30" : "bg-[#111827] text-gray-600 border-[#1F2937]")}>
            {f}
          </button>
        ))}
      </div>

      {/* Overdue alert */}
      {overdue > 0 && (
        <div className="flex items-center gap-2 bg-red-500/6 border border-red-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-[12px] text-red-300 font-semibold">{overdue} overdue task{overdue > 1 ? "s" : ""} — action needed</p>
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-10 text-center text-[12px] text-gray-600">
          No tasks for {filter === "All" ? "today" : filter}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(byShift).map(([shift, shiftTasks]) => {
            const doneCount = shiftTasks.filter(t => ["completed","approved"].includes(t.status)).length;
            const pct = Math.round((doneCount / shiftTasks.length) * 100);
            const hasOverdue = shiftTasks.some(t => t.status === "overdue");
            return (
              <div key={shift} className={cn("bg-[#111827] border rounded-xl overflow-hidden", hasOverdue ? "border-red-500/25" : "border-[#1F2937]")}>
                <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#1A2235]">
                  <p className="text-[12px] font-bold text-white flex-1">{SHIFT_LABEL[shift] || shift}</p>
                  <div className="h-1 w-14 bg-[#1A2235] rounded-full overflow-hidden">
                    <div className={cn("h-1 rounded-full", pct === 100 ? "bg-emerald-500" : hasOverdue ? "bg-red-500" : "bg-[#F5A623]")} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-600 font-semibold">{doneCount}/{shiftTasks.length}</span>
                </div>
                {shiftTasks.map(t => (
                  <TaskCard key={t.id} task={t} onStart={handleStart} onComplete={handleComplete} onPhotoUpload={setPhotoSheet} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task — iOS bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Side Work Task">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Task Name</label>
            <input value={form.task_name} onChange={e => setForm(p => ({ ...p, task_name: e.target.value }))}
              placeholder="e.g. Roll silverware"
              className="mt-1.5 w-full h-12 px-3 text-[14px] border border-[#1F2937] rounded-xl bg-[#111827] text-white focus:outline-none focus:ring-1 focus:ring-[#F5A623]/40 placeholder:text-gray-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Role</label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger className="h-11 mt-1.5 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="server">Server</SelectItem>
                  <SelectItem value="bartender">Bartender</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="busser">Busser</SelectItem>
                  <SelectItem value="cook">Cook</SelectItem>
                  <SelectItem value="food_runner">Food Runner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Shift</label>
              <Select value={form.shift_type} onValueChange={v => setForm(p => ({ ...p, shift_type: v }))}>
                <SelectTrigger className="h-11 mt-1.5 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="opening">Opening</SelectItem>
                  <SelectItem value="mid">Mid-Shift</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Due Time</label>
              <input type="time" value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))}
                className="mt-1.5 w-full h-11 px-3 text-[13px] border border-[#1F2937] rounded-xl bg-[#111827] text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Station</label>
              <input value={form.station} onChange={e => setForm(p => ({ ...p, station: e.target.value }))}
                placeholder="e.g. Section 2"
                className="mt-1.5 w-full h-11 px-3 text-[13px] border border-[#1F2937] rounded-xl bg-[#111827] text-white focus:outline-none placeholder:text-gray-700" />
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <button type="button" onClick={() => setForm(p => ({ ...p, requires_photo: !p.requires_photo }))}
              className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-colors", form.requires_photo ? "bg-[#F5A623]" : "bg-[#1F2937]")}>
              <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform", form.requires_photo ? "translate-x-[22px]" : "translate-x-1")} />
            </button>
            <span className="text-[14px] text-white font-semibold">Requires photo proof</span>
          </div>
          <button onClick={handleCreate} disabled={saving || !form.task_name.trim()}
            className="w-full h-13 py-3.5 bg-[#F5A623] text-black font-bold rounded-2xl text-[15px] disabled:opacity-50 active:scale-[0.97] transition-transform">
            {saving ? "Saving..." : "Add Task"}
          </button>
        </div>
      </BottomSheet>

      {/* Photo Required sheet */}
      <BottomSheet open={!!photoSheet} onClose={() => setPhotoSheet(null)} title="Photo Required">
        <div className="flex flex-col items-center gap-4 py-2">
          <Camera className="h-12 w-12 text-amber-400" />
          <p className="text-[14px] text-gray-300 text-center leading-relaxed">
            Upload a photo to complete <span className="font-bold text-white">{photoSheet?.task_name}</span>
          </p>
          <label className="w-full h-12 bg-[#F5A623] text-black font-bold rounded-2xl text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform cursor-pointer">
            <Camera className="h-4 w-4" /> Take / Upload Photo
            <input type="file" accept="image/*" capture="environment" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !photoSheet) return;
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                await base44.entities.SideWorkAssignment.update(photoSheet.id, { photo_url: file_url, status: "completed", completed_at: new Date().toISOString() });
                setTasks(prev => prev.map(t => t.id === photoSheet.id ? { ...t, photo_url: file_url, status: "completed" } : t));
                setPhotoSheet(null);
                toast.success("Photo uploaded & task completed ✓");
              }} />
          </label>
        </div>
      </BottomSheet>
    </div>
  );
}