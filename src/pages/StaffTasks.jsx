import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardList, Flame, CheckCircle2, ArrowRight } from "lucide-react";
import { haptics } from "@/utils/haptics";
import { useToast } from "@/hooks/useToast";
import { useUnifiedState } from "@/lib/UnifiedStateContext";
import UpdateQuantitySheet from "@/components/tasks/UpdateQuantitySheet";

const rawCache = { prepItems: null, sideWork: null, ts: 0 };
const CACHE_TTL = 30_000;

/* ── helpers ────────────────────────────────────────────── */
function urgencyRank(t) {
  if (t.status === "overdue") return 0;
  if (t.priority === "critical") return 1;
  if (t.status === "in_progress") return 2;
  if (t.priority === "high") return 3;
  return 4;
}

function buildData(prepItems, sideWork, filter, user) {
  const myPrep = prepItems.filter(i => {
    if (["completed", "approved"].includes(i.status)) return false;
    if (i.assigned_to_individual === user?.email) return true;
    if (i.role_assignment === user?.role && !i.assigned_to_individual) return true;
    if (i.allow_all_roles && !i.role_assignment && !i.assigned_to_individual) return true;
    return false;
  });
  const mySideWork = sideWork.filter(t => {
    if (["completed", "approved"].includes(t.status)) return false;
    if (t.assigned_to_individual && t.assigned_to_email === user?.email) return true;
    if (t.role_assignment === user?.role && !t.assigned_to_individual) return true;
    if (!t.role_assignment && !t.assigned_to_individual) return true;
    return false;
  });

  const allTasks = [
    ...myPrep.map(i => ({
      id: i.id, type: "prep", name: i.name || "Prep Item",
      station: i.station_name || "Prep", assignee: i.assigned_to_individual,
      due_time: i.due_time, status: i.status || "pending",
      priority: i.priority || "medium",
      qty_done: i.completed_qty || 0, qty_needed: parseFloat(i.quantity) || 1,
      unit: i.unit || "", requires_photo: !!i.master_photo_url,
      _raw: i,
    })),
    ...mySideWork.map(t => ({
      id: t.id, type: "sidework", name: t.task_name || "Task",
      station: t.role || "Side Work", assignee: t.assigned_to_name,
      due_time: t.due_time, status: t.status || "pending",
      priority: t.priority || "medium",
      requires_photo: t.requires_photo,
      _raw: t,
    })),
  ];

  const typeMap = { prep: "prep", sidework: "sidework", "side-work": "sidework" };
  const filtered = filter === "all" ? allTasks : allTasks.filter(t => t.type === (typeMap[filter] || filter));
  const sorted = [...filtered].sort((a, b) => urgencyRank(a) - urgencyRank(b));

  const groups = { "Needs Attention": [], "Due Soon": [], "In Progress": [], "To Do": [] };
  sorted.forEach(t => {
    if (t.status === "overdue" || t.priority === "critical") groups["Needs Attention"].push(t);
    else if (t.status === "in_progress") groups["In Progress"].push(t);
    else if (t.due_time) groups["Due Soon"].push(t);
    else groups["To Do"].push(t);
  });

  const total = allTasks.length;
  const overdue = allTasks.filter(t => t.status === "overdue").length;
  const dueSoon = allTasks.filter(t => t.due_time && t.status !== "completed").length;
  const shiftScore = total > 0 ? Math.max(0, Math.round(((total - overdue) / total) * 100)) : 100;

  return { groups, total, dueSoon, overdue, shiftScore };
}

/* ── Status badge styles ─────────────────────────────────── */
const statusStyles = {
  pending:     "bg-slate-500/15 text-slate-400 border-slate-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  overdue:     "bg-red-500/15 text-red-400 border-red-500/30",
  critical:    "bg-red-500/15 text-red-400 border-red-500/30",
  completed:   "bg-green-500/15 text-green-400 border-green-500/30",
  approved:    "bg-green-500/15 text-green-400 border-green-500/30",
};

/* ── Prep Task Card ─────────────────────────────────────── */
function PrepTaskCard({ task, onUpdateQty, navigate }) {
  const pct = Math.min(Math.round((task.qty_done / task.qty_needed) * 100), 100);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0 mt-0.5">
          <ClipboardList className="h-4 w-4 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300">Prep</span>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", statusStyles[task.status] || statusStyles.pending)}>
              {task.status.replace("_", " ").toUpperCase()}
            </span>
            {task.requires_photo && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300">📷 REQ</span>}
          </div>
          <p className="text-sm font-bold text-foreground truncate">{task.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{task.station}{task.due_time && ` · Due ${task.due_time}`}</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold">
              <span className="text-muted-foreground">{task.qty_done} / {task.qty_needed} {task.unit}</span>
              <span className="text-foreground">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex border-t border-border">
        <button
          onClick={() => { haptics.medium(); onUpdateQty(task); }}
          className="flex-1 h-10 text-xs font-bold text-primary flex items-center justify-center gap-1.5 active:bg-primary/10 transition-all"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Update Quantity
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => navigate("/prep-lists")}
          className="px-4 h-10 text-xs font-bold text-muted-foreground flex items-center gap-1 active:bg-muted/50 transition-all"
        >
          Open <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Side Work Task Card ────────────────────────────────── */
function SideWorkTaskCard({ task, onComplete, completing, navigate }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
          <Flame className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">Side Work</span>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", statusStyles[task.status] || statusStyles.pending)}>
              {task.status.replace("_", " ").toUpperCase()}
            </span>
            {task.requires_photo && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300">📷 REQ</span>}
          </div>
          <p className="text-sm font-bold text-foreground truncate">{task.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {task.station}{task.assignee && ` · ${task.assignee}`}{task.due_time && ` · Due ${task.due_time}`}
          </p>
        </div>
      </div>
      <div className="flex border-t border-border">
        <button
          onClick={() => { haptics.medium(); onComplete(task); }}
          disabled={completing}
          className="flex-1 h-10 text-xs font-bold text-green-400 flex items-center justify-center gap-1.5 active:bg-green-500/10 transition-all disabled:opacity-40"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {completing ? "Saving…" : "Mark Complete"}
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => navigate("/side-work")}
          className="px-4 h-10 text-xs font-bold text-muted-foreground flex items-center gap-1 active:bg-muted/50 transition-all"
        >
          Open <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Group header ───────────────────────────────────────── */
const groupColors = {
  "Needs Attention": "text-red-400",
  "Due Soon":        "text-amber-400",
  "In Progress":     "text-blue-400",
  "To Do":           "text-muted-foreground",
};

function GroupHeader({ label, count }) {
  return (
    <div className="flex items-center justify-between mt-5 mb-2">
      <h3 className={cn("text-xs font-bold uppercase tracking-wider", groupColors[label] || "text-muted-foreground")}>{label}</h3>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{count}</span>
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "prep", label: "Prep" },
  { id: "sidework", label: "Side Work" },
  { id: "cleaning", label: "Cleaning" },
  { id: "food-safety", label: "Food Safety" },
  { id: "issues", label: "Issues" },
];

/* ── Page ───────────────────────────────────────────────── */
export default function StaffTasks() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const { recordAction, setActiveTab } = useUnifiedState();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [completingTask, setCompletingTask] = useState({});
  const [selectedPrepTask, setSelectedPrepTask] = useState(null);
  const [pullRefresh, setPullRefresh] = useState(0);
  const scrollRef = useRef(null);
  const todayStr = new Date().toISOString().split("T")[0];

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    if (scrollTop <= 0) {
      setPullRefresh(Math.min(100, Math.abs(scrollTop) * 0.5));
    }
  };

  const handleTouchEnd = () => {
    if (pullRefresh > 50) {
      haptics.medium();
      load();
    }
    setPullRefresh(0);
  };

  const load = async () => {
    const [prepItems, sideWork] = await Promise.all([
      base44.entities.PrepItem.list("-created_date", 500),
      base44.entities.SideWorkAssignment.filter({ date: todayStr }),
    ]);
    rawCache.prepItems = prepItems;
    rawCache.sideWork = sideWork;
    rawCache.ts = Date.now();
    setData(buildData(prepItems, sideWork, filter, user));
    setLoading(false);
  };

  useEffect(() => {
    if (rawCache.prepItems && rawCache.sideWork) {
      setData(buildData(rawCache.prepItems, rawCache.sideWork, filter, user));
    }
  }, [filter]);

  useEffect(() => {
    if (!user?.email) return;
    if (!rawCache.prepItems || Date.now() - rawCache.ts > CACHE_TTL) {
      load();
    } else {
      setData(buildData(rawCache.prepItems, rawCache.sideWork, filter, user));
      setLoading(false);
    }
    let debounce;
    const unsub = base44.entities.PrepItem.subscribe(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => load(), 1500);
    });
    return () => { unsub?.(); clearTimeout(debounce); };
  }, [user?.email]);

  const handleCompleteTask = async (task) => {
    haptics.medium();
    setCompletingTask(prev => ({ ...prev, [task.id]: true }));
    await base44.entities.SideWorkAssignment.update(task.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user?.email,
    });
    toast("Task completed ✓");
    recordAction("task_completed", { taskId: task.id });
    setActiveTab("/");
    setCompletingTask(prev => ({ ...prev, [task.id]: false }));
    setTimeout(() => load(), 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAnyTasks = data && Object.values(data.groups).some(g => g.length > 0);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onTouchEnd={handleTouchEnd}
      className="pb-28 lg:overflow-auto"
      style={{ maxHeight: 'calc(100vh - 52px)', overscrollBehavior: 'contain' }}
    >
      {pullRefresh > 0 && (
        <div className="sticky top-0 z-30 flex items-center justify-center h-12 bg-primary/10">
          <div
            className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent transition-transform"
            style={{ transform: `rotate(${pullRefresh * 3.6}deg)` }}
          />
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 pt-3 pb-3">
        <h1 className="text-lg font-bold text-foreground">My Tasks</h1>
        <p className="text-[11px] text-muted-foreground">Your shift mission list</p>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Shift summary card */}
        {data && (
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-4">
            <div className="text-center pr-4 border-r border-border">
              <p className="text-2xl font-bold text-primary">{data.shiftScore}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Shift Score</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold text-foreground">{data.total}</p>
                <p className="text-[10px] text-muted-foreground">Assigned</p>
              </div>
              <div>
                <p className="text-base font-bold text-amber-400">{data.dueSoon}</p>
                <p className="text-[10px] text-muted-foreground">Due Soon</p>
              </div>
              <div>
                <p className="text-base font-bold text-red-400">{data.overdue}</p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { haptics.light(); setFilter(f.id); }}
              className={cn(
                "flex-shrink-0 h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap border transition-all active:scale-95",
                filter === f.id
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task groups */}
        {hasAnyTasks ? (
          Object.entries(data.groups).map(([group, tasks]) => {
            if (tasks.length === 0) return null;
            return (
              <div key={group}>
                <GroupHeader label={group} count={tasks.length} />
                <div className="space-y-2">
                  {tasks.map(task =>
                    task.type === "prep" ? (
                      <PrepTaskCard
                        key={task.id}
                        task={task}
                        onUpdateQty={t => { haptics.medium(); setSelectedPrepTask(t); }}
                        navigate={navigate}
                      />
                    ) : (
                      <SideWorkTaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        completing={!!completingTask[task.id]}
                        navigate={navigate}
                      />
                    )
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            <p className="text-base font-bold text-foreground">You're all caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No tasks assigned to you right now.</p>
          </div>
        )}
      </div>

      {/* Update Quantity Sheet */}
      {selectedPrepTask && (
        <UpdateQuantitySheet
          task={selectedPrepTask}
          onClose={() => setSelectedPrepTask(null)}
          onSuccess={() => {
            setSelectedPrepTask(null);
            setTimeout(() => load(), 300);
          }}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;