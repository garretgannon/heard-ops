import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, AlertCircle, Clock, CheckCircle2, Play, Camera,
  Plus, TrendingUp, ChevronRight, X
} from "lucide-react";
import MetricTile from "../components/MetricTile";
import { cn } from "@/lib/utils";
import { format, differenceInHours, isToday, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const todayStr = new Date().toISOString().split("T")[0];

// Frequency buckets
const FREQ_TABS = ["Daily", "Weekly", "Monthly", "Deep Clean"];
const FREQ_MAP = { Daily: "daily", Weekly: "weekly", Monthly: "monthly", "Deep Clean": "deep_clean" };

// Areas for grouping
const AREAS = ["Kitchen", "Bar", "Dining Room", "Restrooms", "Other"];

const STATUS_STYLE = {
  pending:     { label: "Not Started", cls: "bg-gray-500/12 text-gray-500 border-gray-500/20" },
  in_progress: { label: "In Progress", cls: "bg-amber-500/12 text-amber-400 border-amber-500/20" },
  completed:   { label: "Completed",   cls: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" },
  approved:    { label: "Approved",    cls: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" },
  overdue:     { label: "Overdue",     cls: "bg-red-500/12 text-red-400 border-red-500/20" },
};



function TaskRow({ task, onStart, onComplete, onPhotoRequired }) {
  const st = STATUS_STYLE[task.status] || STATUS_STYLE.pending;
  const isDone = ["completed", "approved"].includes(task.status);
  const isOverdue = task.status === "overdue";
  const needsPhoto = task.requires_photo && !task.photo_url;

  const handleAction = () => {
    if (needsPhoto && task.status === "in_progress") { onPhotoRequired(task); return; }
    if (isDone) return;
    if (task.status === "pending" || task.status === "overdue") { onStart(task); return; }
    onComplete(task);
  };

  const actionLabel = needsPhoto && task.status === "in_progress" ? "📷" : task.status === "pending" || task.status === "overdue" ? "Start" : "Done";
  const actionCls = isOverdue
    ? "bg-red-500/10 border-red-500/20 text-red-400"
    : task.status === "in_progress"
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : "bg-amber-500/10 border-amber-500/20 text-amber-400";

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-2 border-b border-[#1A2235] last:border-0",
      isOverdue && "bg-red-500/4"
    )}>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[12px] font-semibold leading-tight truncate", isDone ? "line-through text-gray-600" : "text-white")}>{task.task_name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {task.assigned_to_name && <span className="text-[10px] text-gray-600">{task.assigned_to_name.split(" ")[0]}</span>}
          {task.due_time && <><span className="text-gray-700 text-[9px]">·</span><span className={cn("text-[10px]", isOverdue ? "text-red-400 font-bold" : "text-gray-600")}>{task.due_time}</span></>}
        </div>
      </div>
      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", st.cls)}>{st.label}</span>
      {isDone
        ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        : <button onClick={handleAction} className={cn("h-6 px-2 rounded-lg text-[10px] font-bold active:scale-95 transition-transform border shrink-0", actionCls)}>
            {actionLabel}
          </button>
      }
    </div>
  );
}

function AreaCard({ area, tasks, onStart, onComplete, onPhotoRequired }) {
  const [expanded, setExpanded] = useState(true);
  const done = tasks.filter(t => ["completed","approved"].includes(t.status)).length;
  const overdue = tasks.filter(t => t.status === "overdue").length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className={cn("bg-[#111827] border rounded-xl overflow-hidden", overdue > 0 ? "border-red-500/25" : "border-[#1F2937]")}>
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left active:bg-[#1A2235] transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-white">{area}</p>
            {overdue > 0 && <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">{overdue} late</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="h-1 w-16 bg-[#1A2235] rounded-full overflow-hidden">
              <div className={cn("h-1 rounded-full", pct === 100 ? "bg-emerald-500" : overdue > 0 ? "bg-red-500" : "bg-[#F5A623]")} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-gray-600">{done}/{tasks.length}</span>
          </div>
        </div>
        <span className={cn("text-[11px] font-bold shrink-0", pct === 100 ? "text-emerald-400" : overdue > 0 ? "text-red-400" : "text-[#F5A623]")}>{pct}%</span>
        <ChevronRight className={cn("h-3.5 w-3.5 text-gray-700 transition-transform shrink-0", expanded && "rotate-90")} />
      </button>
      {expanded && (
        <div className="border-t border-[#1A2235]">
          {tasks.map(t => <TaskRow key={t.id} task={t} onStart={onStart} onComplete={onComplete} onPhotoRequired={onPhotoRequired} />)}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = { task_name: "", role: "All", shift_type: "daily", due_time: "16:00", area: "Kitchen", priority: "medium", requires_photo: false, date: todayStr };

export default function Cleaning() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // for trend (all dates)
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Daily");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [photoTask, setPhotoTask] = useState(null);

  const load = async () => {
    const [todayTasks, recentTasks] = await Promise.all([
      base44.entities.SideWorkAssignment.filter({ date: todayStr }),
      base44.entities.SideWorkAssignment.list("-date", 500),
    ]);
    // Filter cleaning tasks by shift_type or task_name keywords
    const isClean = t => ["daily","weekly","monthly","deep_clean"].includes(t.shift_type) ||
      /clean|mop|sweep|sanitiz|wipe|scrub|restroom|trash|dishes|restock/i.test(t.task_name || "");
    setTasks(todayTasks.filter(isClean));
    setAllTasks(recentTasks.filter(isClean));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const tabTasks = useMemo(() => {
    const freq = FREQ_MAP[activeTab];
    return tasks.filter(t => t.shift_type === freq || (!t.shift_type && activeTab === "Daily"));
  }, [tasks, activeTab]);

  // Metrics
  const daily = tasks.filter(t => t.shift_type === "daily" || !t.shift_type);
  const weekly = tasks.filter(t => t.shift_type === "weekly");
  const overdue = tasks.filter(t => t.status === "overdue").length;
  const done = tasks.filter(t => ["completed","approved"].includes(t.status)).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  // Needs attention
  const attention = tabTasks.filter(t => {
    if (t.status === "overdue") return true;
    if (t.status === "pending" && t.due_time) {
      const [h, m] = t.due_time.split(":").map(Number);
      const due = new Date(); due.setHours(h, m, 0, 0);
      return differenceInHours(due, new Date()) <= 1;
    }
    return false;
  });

  // Group by area
  const byArea = useMemo(() => {
    const groups = {};
    tabTasks.forEach(t => {
      const area = t.station || (AREAS.find(a => new RegExp(a, "i").test(t.task_name || "")) || "Other");
      if (!groups[area]) groups[area] = [];
      groups[area].push(t);
    });
    return groups;
  }, [tabTasks]);

  // Trend (last 7 days)
  const trendData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const ds = format(d, "yyyy-MM-dd");
    const dayTasks = allTasks.filter(t => t.date === ds);
    const dayDone = dayTasks.filter(t => ["completed","approved"].includes(t.status)).length;
    const p = dayTasks.length > 0 ? Math.round((dayDone / dayTasks.length) * 100) : 0;
    return { day: format(d, "EEE"), pct: p, count: dayDone };
  }), [allTasks]);

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
    setDialogOpen(false);
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
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">Cleaning Command Center</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">{format(new Date(), "EEEE, MMM d")} · {tasks.length} tasks</p>
        </div>
        <button onClick={() => setDialogOpen(true)}
          className="h-8 px-3 rounded-xl bg-[#F5A623] text-black text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricTile label="Daily"    value={daily.length}  color="text-white" />
        <MetricTile label="Weekly"   value={weekly.length} color="text-white" />
        <MetricTile label="Overdue"  value={overdue}       color={overdue > 0 ? "text-red-400" : "text-white"} alert={overdue > 0} />
        <MetricTile label="Complete" value={`${pct}%`}     color={pct >= 80 ? "text-emerald-400" : "text-amber-400"} />
      </div>

      {/* Progress bar */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Today's Progress</span>
          <span className={cn("text-[12px] font-extrabold", pct === 100 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400")}>{pct}%</span>
        </div>
        <div className="h-1.5 w-full bg-[#1A2235] rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5">{done}/{tasks.length} tasks complete</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {FREQ_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95",
              activeTab === tab ? "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30" : "bg-[#111827] text-gray-600 border-[#1F2937]")}>
            {tab}
          </button>
        ))}
      </div>

      {/* Needs Attention */}
      {attention.length > 0 && (
        <div className="bg-red-500/6 border border-red-500/25 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-500/12">
            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="text-[12px] font-bold text-red-400 flex-1">Needs Attention</span>
            <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded-full">{attention.length}</span>
          </div>
          {attention.map(t => {
            const isOd = t.status === "overdue";
            return (
              <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 border-b border-red-500/8 last:border-0">
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isOd ? "bg-red-400 animate-pulse" : "bg-amber-400")} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white truncate">{t.task_name}</p>
                  <p className={cn("text-[10px]", isOd ? "text-red-400" : "text-amber-400")}>
                    {isOd ? "Overdue" : `Due ${t.due_time}`} · {t.assigned_to_name || "Unassigned"}
                  </p>
                </div>
                {!["completed","approved"].includes(t.status) && (
                  <button onClick={() => t.status === "pending" ? handleStart(t) : handleComplete(t)}
                    className={cn("h-6 px-2 rounded-lg text-[10px] font-bold active:scale-95 transition-transform border",
                      isOd ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400")}>
                    {t.status === "pending" ? "Start" : "Done"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tasks by Area */}
      {tabTasks.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center text-[12px] text-gray-600">
          No {activeTab.toLowerCase()} tasks today
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(byArea).map(([area, areaTasks]) => (
            <AreaCard key={area} area={area} tasks={areaTasks} onStart={handleStart} onComplete={handleComplete} onPhotoRequired={setPhotoTask} />
          ))}
        </div>
      )}



      {/* Trend chart */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-[#F5A623]" />
          <p className="text-[12px] font-bold text-white">Completion Trend <span className="text-gray-600 font-normal">— 7 days</span></p>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={trendData} barSize={14}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "#0B0F14", border: "1px solid #1F2937", borderRadius: 8, fontSize: 11 }}
              formatter={v => [`${v}%`, "Completion"]}
              cursor={{ fill: "rgba(245,166,35,0.06)" }}
            />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {trendData.map((e, i) => <Cell key={i} fill={e.pct >= 80 ? "#10B981" : e.pct >= 50 ? "#F5A623" : e.pct > 0 ? "#EF4444" : "#1F2937"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[15px]">Add Cleaning Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Task Name *</label>
              <input value={form.task_name} onChange={e => setForm(p => ({ ...p, task_name: e.target.value }))}
                placeholder="e.g. Mop kitchen floor"
                className="mt-1 w-full h-9 px-3 text-[13px] border border-[#1F2937] rounded-lg bg-[#111827] text-white focus:outline-none placeholder:text-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Frequency</label>
                <Select value={form.shift_type} onValueChange={v => setForm(p => ({ ...p, shift_type: v }))}>
                  <SelectTrigger className="h-8 mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="deep_clean">Deep Clean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Area</label>
                <Select value={form.area || "Kitchen"} onValueChange={v => setForm(p => ({ ...p, area: v, station: v }))}>
                  <SelectTrigger className="h-8 mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Due Time</label>
                <input type="time" value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))}
                  className="mt-1 w-full h-8 px-2 text-[12px] border border-[#1F2937] rounded-lg bg-[#111827] text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="h-8 mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setForm(p => ({ ...p, requires_photo: !p.requires_photo }))}
                className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", form.requires_photo ? "bg-[#F5A623]" : "bg-[#1F2937]")}>
                <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", form.requires_photo ? "translate-x-[18px]" : "translate-x-1")} />
              </button>
              <label className="text-[12px] text-gray-400 font-semibold">Requires photo proof</label>
            </div>
            <button onClick={handleCreate} disabled={saving || !form.task_name.trim()}
              className="w-full h-10 bg-[#F5A623] text-black font-bold rounded-xl text-[13px] disabled:opacity-50 active:scale-95 transition-transform">
              {saving ? "Saving..." : "Add Task"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Required Dialog */}
      {photoTask && (
        <Dialog open={!!photoTask} onOpenChange={() => setPhotoTask(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Photo Required</DialogTitle></DialogHeader>
            <div className="flex flex-col items-center gap-3 py-2">
              <Camera className="h-10 w-10 text-amber-400" />
              <p className="text-[13px] text-gray-300 text-center">Upload a photo to complete <span className="font-bold text-white">{photoTask.task_name}</span></p>
              <input type="file" accept="image/*" capture="environment"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const { file_url } = await base44.integrations.Core.UploadFile({ file });
                  await base44.entities.SideWorkAssignment.update(photoTask.id, { photo_url: file_url, status: "completed", completed_at: new Date().toISOString() });
                  setTasks(prev => prev.map(t => t.id === photoTask.id ? { ...t, photo_url: file_url, status: "completed" } : t));
                  setPhotoTask(null);
                  toast.success("Photo uploaded & task completed ✓");
                }}
                className="w-full text-[12px] text-gray-400" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export const hideBase44Index = true;