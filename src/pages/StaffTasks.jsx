import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardList, CheckCircle2, ArrowRight, Camera, UserRound, Play } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ActivePrepStep from "@/components/prep-flow/ActivePrepStep";
import PrepCompletionScreen from "@/components/prep-flow/PrepCompletionScreen";
import { haptics } from "@/utils/haptics";
import { useToast } from "@/hooks/useToast";
import { useUnifiedState } from "@/lib/UnifiedStateContext";
import UpdateQuantitySheet from "@/components/tasks/UpdateQuantitySheet";
import TaskVisual from "@/components/TaskVisual";

const rawCache = { prepItems: null, sideWork: null, generatedTasks: null, ts: 0 };
const CACHE_TTL = 30_000;

async function uploadTaskFiles(files) {
  const uploader = base44.integrations?.Core?.UploadFile || base44.integrations?.UploadFile;
  const list = Array.from(files || []);
  if (list.length === 0) return [];
  const urls = await Promise.all(list.map(async (file) => {
    if (!uploader) return URL.createObjectURL(file);
    const result = await uploader({ file });
    return result?.file_url || result?.url || '';
  }));
  return urls.filter(Boolean);
}

const DEMO_PREP_IMAGES = {
  ranch: "/demo-prep/ranch.svg",
  pico: "/demo-prep/pico.svg",
  romaine: "/demo-prep/romaine.svg",
  guac: "/demo-prep/guacamole.svg",
};

function demoPrepItems(user) {
  const email = user?.email || "demo@heardos.local";
  const role = user?.role || "line_cook";
  return [
    {
      id: "demo-prep-ranch",
      name: "Ranch",
      station_name: "Pantry",
      assigned_to_individual: email,
      assigned_to_name: "Maya Chen",
      due_time: "10:30 AM",
      status: "in_progress",
      priority: "high",
      completed_qty: 3,
      quantity: 8,
      unit: "qt",
      master_photo_url: DEMO_PREP_IMAGES.ranch,
      demo: true,
    },
    {
      id: "demo-prep-pico",
      name: "Pico de Gallo",
      station_name: "Pantry",
      assigned_to_individual: email,
      assigned_to_name: "Andre Ruiz",
      due_time: "11:00 AM",
      status: "pending",
      priority: "medium",
      completed_qty: 0,
      quantity: 2,
      unit: "hotel pans",
      master_photo_url: DEMO_PREP_IMAGES.pico,
      demo: true,
    },
    {
      id: "demo-prep-romaine",
      name: "Cut Romaine",
      station_name: "Salad",
      role_assignment: role,
      assigned_to_name: "Jess Morgan",
      due_time: "11:30 AM",
      status: "pending",
      priority: "medium",
      completed_qty: 0,
      quantity: 6,
      unit: "bins",
      master_photo_url: DEMO_PREP_IMAGES.romaine,
      demo: true,
    },
    {
      id: "demo-prep-guac",
      name: "Guacamole",
      station_name: "Line",
      allow_all_roles: true,
      assigned_to_name: "Taylor Kim",
      due_time: "12:00 PM",
      status: "pending",
      priority: "critical",
      completed_qty: 0,
      quantity: 1,
      unit: "hotel pan",
      master_photo_url: DEMO_PREP_IMAGES.guac,
      demo: true,
    },
  ];
}

function demoSideWork(user) {
  return [
    {
      id: "demo-side-pantry-open",
      task_name: "Pantry station setup",
      role: "Pantry",
      assigned_to_name: "Maya Chen",
      assigned_to_email: user?.email,
      assigned_to_individual: true,
      due_time: "10:15 AM",
      status: "pending",
      priority: "medium",
      requires_photo: false,
      demo: true,
    },
  ];
}

/* ── helpers ────────────────────────────────────────────── */
function urgencyRank(t) {
  if (t.status === "overdue") return 0;
  if (t.priority === "critical") return 1;
  if (t.status === "in_progress") return 2;
  if (t.priority === "high") return 3;
  return 4;
}

function buildData(prepItems, sideWork, generatedTasks, filter, user) {
  const useDemo = (prepItems?.length || 0) === 0 && (sideWork?.length || 0) === 0 && (generatedTasks?.length || 0) === 0;
  const sourcePrep = useDemo ? demoPrepItems(user) : prepItems;
  const sourceSideWork = useDemo ? demoSideWork(user) : sideWork;
  const sourceGenerated = generatedTasks || [];

  const myPrep = sourcePrep.filter(i => {
    if (["completed", "approved"].includes(i.status)) return false;
    if (i.assigned_to_individual === user?.email) return true;
    if (i.role_assignment === user?.role && !i.assigned_to_individual) return true;
    if (i.allow_all_roles && !i.role_assignment && !i.assigned_to_individual) return true;
    return false;
  });
  const mySideWork = sourceSideWork.filter(t => {
    if (["completed", "approved"].includes(t.status)) return false;
    if (t.assigned_to_individual && t.assigned_to_email === user?.email) return true;
    if (t.role_assignment === user?.role && !t.assigned_to_individual) return true;
    if (!t.role_assignment && !t.assigned_to_individual) return true;
    return false;
  });
  const myGenerated = sourceGenerated.filter(t => {
    if (["completed", "approved"].includes(t.status)) return false;
    if (t.assigned_user_email === user?.email) return true;
    if (t.assigned_role === user?.role) return true;
    if (!t.assigned_user_email && !t.assigned_role) return true;
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
      image_url: i.master_photo_url || i.image_url,
      assignee_name: i.assigned_to_name || i.assignee_name,
      demo: !!i.demo,
      _raw: i,
    })),
    ...mySideWork.map(t => ({
      id: t.id, type: "sidework", name: t.taskName || t.task_name || "Task",
      station: t.station || t.role || "Side Work", assignee: t.assigned_to_name,
      due_time: t.dueTime || t.due_time, status: t.status || "pending",
      priority: t.priority || "medium",
      requires_photo: t.requiresPhoto || t.requires_photo,
      demo: !!t.demo,
      _raw: t,
    })),
    ...myGenerated.map(t => ({
      id: t.id,
      type: t.task_type === "cleaning_task" ? "cleaning" : t.task_type === "maintenance_check" ? "issues" : t.task_type === "temperature_check" ? "food-safety" : "sidework",
      name: t.task_title || "Station Task",
      station: t.station_name || t.station_id || "Station",
      assignee: t.assigned_user_email,
      due_time: t.due_time,
      status: t.status || "pending",
      priority: t.priority || "medium",
      requires_photo: (t.required_proof || []).includes("photo"),
      demo: false,
      _raw: t,
      _entity: "GeneratedTask",
    })),
  ];

  const typeMap = { prep: "prep", sidework: "sidework", "side-work": "sidework", cleaning: "cleaning", "food-safety": "food-safety", issues: "issues" };
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
function PrepTaskCard({ task, onUpdateQty, onStart, navigate }) {
  const pct = Math.min(Math.round((task.qty_done / task.qty_needed) * 100), 100);
  return (
    <div className="app-card overflow-hidden p-0">
      <div className="relative h-36 overflow-hidden">
        <TaskVisual type="prep" name={task.name} imageUrl={task.image_url} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Prep</p>
            <h3 className="truncate text-2xl font-black tracking-tight text-white">{task.name}</h3>
          </div>
          <div className="status-marker status-marker-lg status-info bg-black/45">{pct}%</div>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className={cn("status-pill", statusStyles[task.status] || statusStyles.pending)}>
              {task.status.replace("_", " ").toUpperCase()}
            </span>
            {task.demo && <span className="status-pill status-neutral">Demo</span>}
            {task.requires_photo && <span className="status-pill status-neutral">Photo</span>}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{task.station}{task.due_time && ` · Due ${task.due_time}`}</span>
          </div>
          {task.assignee_name && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="status-marker status-marker-sm status-neutral">
                <UserRound className="h-3 w-3" />
              </span>
              <span>Assigned to {task.assignee_name}</span>
            </div>
          )}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold">
              <span className="text-muted-foreground">{task.qty_done} / {task.qty_needed} {task.unit}</span>
              <span className="text-foreground">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex border-t border-border/50">
        <button
          onClick={() => {
            haptics.medium();
            task.demo ? navigate("/prep-lists") : onUpdateQty(task);
          }}
          className="flex-1 h-11 text-xs font-bold text-primary flex items-center justify-center gap-1.5 active:bg-primary/10 transition-all"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          {task.demo ? "Preview Prep" : "Update Quantity"}
        </button>
        <div className="w-px bg-border/50" />
        <button
          onClick={() => onStart?.(task)}
          className="px-4 h-10 text-xs font-bold text-primary flex items-center gap-1.5 active:bg-primary/10 transition-all"
        >
          <Play className="h-3 w-3" /> Start
        </button>
      </div>
    </div>
  );
}

/* ── Side Work Task Card ────────────────────────────────── */
function SideWorkTaskCard({ task, onComplete, completing, navigate }) {
  const [completionFiles, setCompletionFiles] = useState([]);

  return (
    <div className="app-card overflow-hidden p-0">
      <div className="flex items-start gap-3 p-3">
        <TaskVisual type="sidework" name={task.name} step={task.station} compact className="h-14 w-14 shrink-0 rounded-xl border border-border/50" />
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
        <label className="px-3 h-10 text-xs font-bold text-muted-foreground flex items-center gap-1 active:bg-muted/50 transition-all cursor-pointer">
          <Camera className="h-3.5 w-3.5" />
          {completionFiles.length ? completionFiles.length : 'Proof'}
          <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(event) => setCompletionFiles(Array.from(event.target.files || []))} />
        </label>
        <div className="w-px bg-border" />
        <button
          onClick={() => { haptics.medium(); onComplete(task, completionFiles); }}
          disabled={completing}
          className="flex-1 h-10 text-xs font-bold text-green-400 flex items-center justify-center gap-1.5 active:bg-green-500/10 transition-all disabled:opacity-40"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {completing ? "Saving…" : "Mark Complete"}
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => navigate(task._entity === "GeneratedTask" ? "/station-shift" : "/side-work")}
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
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { recordAction, setActiveTab } = useUnifiedState();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => searchParams.get("tab") || "all");
  const [completingTask, setCompletingTask] = useState({});
  const [selectedPrepTask, setSelectedPrepTask] = useState(null);
  const [activePrepFlow, setActivePrepFlow] = useState(null);   // { item, steps }
  const [prepFlowPhase, setPrepFlowPhase] = useState(null);      // 'active' | 'complete'
  const [prepFlowCompletion, setPrepFlowCompletion] = useState(null);
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

  useEffect(() => {
    setFilter(searchParams.get("tab") || "all");
  }, [searchParams]);

  const load = async () => {
    const [prepItems, sideWork, generatedTasks] = await Promise.all([
      base44.entities.PrepItem.list("-created_date", 100).catch(() => rawCache.prepItems || []),
      base44.entities.DailySideWorkTask
        ? base44.entities.DailySideWorkTask.filter({ date: todayStr }).catch(() => rawCache.sideWork || [])
        : base44.entities.SideWorkAssignment.filter({ date: todayStr }).catch(() => rawCache.sideWork || []),
      base44.entities.GeneratedTask.filter({ due_date: todayStr }).catch(() => rawCache.generatedTasks || []),
    ]);
    rawCache.prepItems = prepItems;
    rawCache.sideWork = sideWork;
    rawCache.generatedTasks = generatedTasks;
    rawCache.ts = Date.now();
    setData(buildData(prepItems, sideWork, generatedTasks, filter, user));
    setLoading(false);
  };

  useEffect(() => {
    if (rawCache.prepItems && rawCache.sideWork) {
      setData(buildData(rawCache.prepItems, rawCache.sideWork, rawCache.generatedTasks || [], filter, user));
    }
  }, [filter]);

  useEffect(() => {
    if (!user?.email) return;
    if (!rawCache.prepItems || Date.now() - rawCache.ts > CACHE_TTL) {
      load();
    } else {
      setData(buildData(rawCache.prepItems, rawCache.sideWork, rawCache.generatedTasks || [], filter, user));
      setLoading(false);
    }
    let debounce;
    const unsub = base44.entities.PrepItem.subscribe(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => load(), 1500);
    });
    return () => { unsub?.(); clearTimeout(debounce); };
  }, [user?.email]);

  const launchPrepFlow = async (task) => {
    haptics.medium();
    const itemSteps = await base44.entities.PrepStep.filter({ prep_item_id: task.id }, "step_number").catch(() => []);
    setActivePrepFlow({ item: task._raw, steps: itemSteps });
    setPrepFlowPhase("active");
    setPrepFlowCompletion({ startedAt: Date.now(), photos: [] });
  };

  const handlePrepFlowComplete = async (data) => {
    const item = activePrepFlow?.item;
    if (!item) return;
    const updates = {
      status: "completed",
      completed_by: user?.full_name || user?.email,
      completed_at: new Date().toISOString(),
      photo_url: data?.photos?.[0] || "",
    };
    await base44.entities.PrepItem.update(item.id, updates).catch(() => {});
    setPrepFlowCompletion(prev => ({ ...prev, ...data }));
    setPrepFlowPhase("complete");
    setTimeout(() => load(), 400);
  };

  const handleCompleteTask = async (task, files = []) => {
    haptics.medium();
    if (task.demo) {
      toast("Demo task preview only");
      return;
    }
    setCompletingTask(prev => ({ ...prev, [task.id]: true }));
    const attachmentUrls = await uploadTaskFiles(files);
    if (task._entity === "GeneratedTask") {
      await base44.entities.GeneratedTask.update(task.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        completion_attachment_urls: attachmentUrls,
      });
    } else if (base44.entities.DailySideWorkTask) {
      await base44.entities.DailySideWorkTask.update(task.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        completedBy: user?.email,
        photoUrl: attachmentUrls[0] || '',
        completion_attachment_urls: attachmentUrls,
      });
    } else {
      await base44.entities.SideWorkAssignment.update(task.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: user?.email,
        completion_attachment_urls: attachmentUrls,
      });
    }
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
      className="pb-40 lg:pb-28 lg:overflow-auto"
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

      <div className="px-4 py-3 space-y-4 max-w-[1100px] mx-auto lg:px-6">
        {/* Shift summary card */}
        {data && (
          <div className="card-glass border border-border rounded-xl p-3 flex items-center gap-4">
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
                        onStart={launchPrepFlow}
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

      {/* Prep Flow Engine */}
      <AnimatePresence>
        {prepFlowPhase === "active" && activePrepFlow && (
          <ActivePrepStep
            item={activePrepFlow.item}
            steps={activePrepFlow.steps}
            ingredients={[]}
            requiresPhoto={activePrepFlow.item?.requires_photo || false}
            onComplete={handlePrepFlowComplete}
            onClose={() => { setPrepFlowPhase(null); setActivePrepFlow(null); }}
          />
        )}
        {prepFlowPhase === "complete" && activePrepFlow && (
          <PrepCompletionScreen
            item={activePrepFlow.item}
            completionData={prepFlowCompletion}
            onDone={() => { setPrepFlowPhase(null); setActivePrepFlow(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export const hideBase44Index = true;
