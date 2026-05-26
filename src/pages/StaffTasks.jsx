import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardList, CheckCircle2, ArrowRight, Camera, UserRound, Play, ChefHat, X, MapPin, ImagePlus, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import DesktopPageHeader from "@/components/DesktopPageHeader";
import ActivePrepStep from "@/components/prep-flow/ActivePrepStep";
import PrepCompletionScreen from "@/components/prep-flow/PrepCompletionScreen";
import { haptics } from "@/utils/haptics";
import { useToast } from "@/hooks/useToast";
import { useUnifiedState } from "@/lib/UnifiedStateContext";
import UpdateQuantitySheet from "@/components/tasks/UpdateQuantitySheet";
import TaskVisual from "@/components/TaskVisual";
import PrepRecipeSheet from "@/components/PrepRecipeSheet";

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
      unit: i.unit || "", requires_photo: i.photoRequired || i.requires_photo || !!i.master_photo_url,
      chef_approval_required: i.chefApprovalRequired || i.chef_approval_required || false,
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
      requires_photo: t.photoRequired || t.requiresPhoto || t.requires_photo || false,
      chef_approval_required: t.chefApprovalRequired || t.chef_approval_required || false,
      demo: !!t.demo,
      _raw: t,
    })),
    ...myGenerated.map(t => ({
      id: t.id,
      type: t.task_type === "cleaning_task" ? "cleaning" : t.task_type === "maintenance_check" ? "issues" : t.task_type === "temperature_check" ? "food-safety" : "sidework",
      name: t.task_title || "Station Task",
      station: t.station_name || t.station_id || "Station",
      assignee: t.assigned_user_name || t.assigned_user_email,
      due_time: t.due_time,
      status: t.status || "pending",
      priority: t.priority || "medium",
      requires_photo: (t.required_proof || []).includes("photo"),
      image_url: t.source_photo_url || t.photo_url || t.image_url || t.attachment_urls?.[0],
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
  const [showRecipe, setShowRecipe] = useState(false);
  const linkedRecipeId = task._raw?.linked_recipe_id;
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
            task.demo ? navigate("/tasks?tab=prep") : onUpdateQty(task);
          }}
          className="flex-1 h-11 text-xs font-bold text-primary flex items-center justify-center gap-1.5 active:bg-primary/10 transition-all"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          {task.demo ? "Preview Prep" : "Update Quantity"}
        </button>
        {linkedRecipeId && (
          <>
            <div className="w-px bg-border/50" />
            <button
              onClick={() => { haptics.light(); setShowRecipe(true); }}
              className="px-4 h-11 text-xs font-bold text-amber-400 flex items-center gap-1.5 active:bg-amber-500/10 transition-all"
            >
              <ChefHat className="h-3.5 w-3.5" /> Recipe
            </button>
          </>
        )}
        <div className="w-px bg-border/50" />
        <button
          onClick={() => onStart?.(task)}
          className="px-4 h-11 text-xs font-bold text-primary flex items-center gap-1.5 active:bg-primary/10 transition-all"
        >
          <Play className="h-3 w-3" /> Start
        </button>
      </div>
      <PrepRecipeSheet open={showRecipe} onClose={() => setShowRecipe(false)} recipeId={linkedRecipeId} />
    </div>
  );
}

/* ── Side Work Task Card ────────────────────────────────── */
function SideWorkTaskCard({ task, onComplete, completing, navigate }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [chefApproved, setChefApproved] = useState(false);
  const [showChefSignOff, setShowChefSignOff] = useState(false);
  const [uploading, setUploading] = useState(false);

  const photoBlocking = task.requires_photo && !photoUrl;
  const chefBlocking = task.chef_approval_required && !chefApproved;
  const canComplete = !photoBlocking && !chefBlocking;

  const handlePhotoCapture = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch {
      setPhotoUrl(URL.createObjectURL(file));
    }
    setUploading(false);
  };

  return (
    <div className="app-card overflow-hidden p-0">
      <div className="flex items-start gap-3 p-3">
        <TaskVisual type="sidework" name={task.name} step={task.station} imageUrl={task.image_url} compact className="h-14 w-14 shrink-0 rounded-2xl border border-border/50" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">Side Work</span>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", statusStyles[task.status] || statusStyles.pending)}>
              {task.status.replace("_", " ").toUpperCase()}
            </span>
            {task.requires_photo && (
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", photoUrl ? "bg-green-500/15 text-green-400" : "bg-primary/15 text-primary")}>
                {photoUrl ? "📷 Done" : "📷 Required"}
              </span>
            )}
            {task.chef_approval_required && (
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", chefApproved ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400")}>
                {chefApproved ? "Chef ✓" : "Chef Req"}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-foreground truncate">{task.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {task.station}{task.assignee && ` · ${task.assignee}`}{task.due_time && ` · Due ${task.due_time}`}
          </p>
        </div>
      </div>
      <div className="flex border-t border-border">
        <label className={cn(
          "px-3 h-11 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
          photoUrl ? "text-green-400" : task.requires_photo ? "text-primary" : "text-muted-foreground",
          "active:bg-muted/50"
        )}>
          <Camera className="h-3.5 w-3.5" />
          {uploading ? "…" : photoUrl ? "Retake" : task.requires_photo ? "Photo*" : "Photo"}
          <input type="file" accept="image/*" capture="environment" className="ops-input hidden"
            onChange={e => e.target.files[0] && handlePhotoCapture(e.target.files[0])} />
        </label>
        {task.chef_approval_required && (
          <>
            <div className="w-px bg-border" />
            <button
              onClick={() => setShowChefSignOff(true)}
              className={cn(
                "px-3 h-11 text-xs font-bold flex items-center gap-1 transition-all active:bg-muted/50",
                chefApproved ? "text-emerald-400" : "text-amber-400"
              )}
            >
              <ChefHat className="h-3.5 w-3.5" />
              {chefApproved ? "Approved" : "Sign-Off"}
            </button>
          </>
        )}
        <div className="w-px bg-border" />
        <button
          onClick={() => { haptics.medium(); onComplete(task, photoUrl ? [photoUrl] : []); }}
          disabled={completing || !canComplete}
          className="flex-1 h-11 text-xs font-bold text-green-400 flex items-center justify-center gap-1.5 active:bg-green-500/10 transition-all disabled:opacity-40"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {completing ? "Saving…" : "Complete"}
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => navigate(task._entity === "GeneratedTask" ? "/station-shift" : "/tasks?tab=sidework")}
          className="px-4 h-11 text-xs font-bold text-muted-foreground flex items-center gap-1 active:bg-muted/50 transition-all"
        >
          Open <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {showChefSignOff && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#030507] flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6">
              <ChefHat className="h-10 w-10 text-emerald-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/70 mb-2">Chef Sign-Off Required</p>
            <p className="text-2xl font-extrabold text-white mb-2">{task.name}</p>
            <p className="text-white/40 text-sm mb-10">Hand your phone to the chef to taste and approve this item before it can be marked complete.</p>
            <button
              onClick={() => { setChefApproved(true); setShowChefSignOff(false); haptics.medium(); }}
              className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-extrabold text-base flex items-center justify-center gap-2 mb-3 active:scale-[0.97] transition-transform"
            >
              <CheckCircle2 className="h-5 w-5" />
              Tastes Good — Approve
            </button>
            <button
              onClick={() => setShowChefSignOff(false)}
              className="text-white/30 text-sm font-semibold py-2"
            >
              Cancel
            </button>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
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

function PhotoTaskSheet({ open, onClose, onCreated, currentUser, toast }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [taskType, setTaskType] = useState("cleaning_task");
  const [priority, setPriority] = useState("medium");
  const [stationId, setStationId] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [stations, setStations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingLists(true);
    Promise.all([
      base44.entities.Station?.list?.("name", 200).catch(() => []) || Promise.resolve([]),
      base44.entities.Employee?.list?.("full_name", 200).catch(() => []) || Promise.resolve([]),
    ]).then(([stationData, employeeData]) => {
      if (cancelled) return;
      setStations((stationData || []).filter((station) => station?.isActive !== false));
      setEmployees((employeeData || []).filter((employee) => employee?.isActive !== false));
      setLoadingLists(false);
    });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const resetAndClose = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setTitle("");
    setNotes("");
    setTaskType("cleaning_task");
    setPriority("medium");
    setStationId("");
    setAssigneeEmail("");
    setSaving(false);
    onClose();
  };

  const handleFile = (file) => {
    if (!file) return;
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const saveTask = async () => {
    if (!title.trim()) {
      toast("Add what needs to be done");
      return;
    }
    setSaving(true);
    try {
      const station = stations.find((item) => item.id === stationId);
      const assignee = employees.find((item) => item.email === assigneeEmail);
      const uploaded = photoFile ? await uploadTaskFiles([photoFile]) : [];
      const sourcePhotoUrl = uploaded[0] || "";
      const dueDate = new Date().toISOString().split("T")[0];
      const payload = {
        task_title: title.trim(),
        description: notes.trim(),
        task_type: taskType,
        priority,
        status: "pending",
        due_date: dueDate,
        station_id: station?.id || "",
        station_name: station?.name || "",
        assigned_user_email: assignee?.email || "",
        assigned_user_name: assignee?.full_name || assignee?.name || "",
        created_by_email: currentUser?.email || "",
        created_by_name: currentUser?.full_name || currentUser?.name || "",
        required_proof: sourcePhotoUrl ? ["photo"] : [],
        source_photo_url: sourcePhotoUrl,
        photo_url: sourcePhotoUrl,
        attachment_urls: sourcePhotoUrl ? [sourcePhotoUrl] : [],
      };
      await base44.entities.GeneratedTask.create(payload);
      await base44.entities.UnifiedLog?.create?.({
        type: taskType === "maintenance_check" ? "maintenance" : "task",
        title: title.trim(),
        description: notes.trim(),
        status: "open",
        priority,
        station_id: station?.id || "",
        station_name: station?.name || "",
        assigned_to: assignee?.email || "",
        photo_url: sourcePhotoUrl,
        created_by: currentUser?.email || "",
      }).catch(() => null);
      toast("Task assigned");
      onCreated?.();
      resetAndClose();
    } catch (error) {
      console.error("Failed to create photo task:", error);
      toast("Could not assign task");
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end bg-black/75 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-background shadow-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Photo Task</p>
            <h2 className="truncate text-lg font-black text-foreground">Assign work from a photo</h2>
          </div>
          <button onClick={resetAndClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/60 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-4 py-4">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="ops-input hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            {photoPreview ? (
              <button type="button" onClick={() => fileRef.current?.click()} className="relative block h-52 w-full overflow-hidden rounded-2xl border border-border/60">
                <img src={photoPreview} alt="Task context" className="h-full w-full object-cover" />
                <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-black text-white">Retake</span>
              </button>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/35 bg-primary/5 text-primary">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-black">Take photo</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">What needs to happen?</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Clean broken sushi case"
              className="h-12 w-full rounded-2xl border border-border/60 bg-background px-3 text-base font-bold text-foreground outline-none focus:border-primary/50"
            />
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add context, location details, or safety notes..."
              className="min-h-20 w-full resize-none rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</span>
              <select value={taskType} onChange={(event) => setTaskType(event.target.value)} className="h-11 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm font-bold text-foreground">
                <option value="cleaning_task">Cleaning</option>
                <option value="maintenance_check">Maintenance / Fix</option>
                <option value="sidework_task">Side work</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-11 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm font-bold text-foreground">
                <option value="medium">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Station</span>
              <select value={stationId} onChange={(event) => setStationId(event.target.value)} className="h-11 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm font-bold text-foreground">
                <option value="">{loadingLists ? "Loading..." : "Any station"}</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Person</span>
              <select value={assigneeEmail} onChange={(event) => setAssigneeEmail(event.target.value)} className="h-11 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm font-bold text-foreground">
                <option value="">{loadingLists ? "Loading..." : "Anyone"}</option>
                {employees.map((employee) => (
                  <option key={employee.id || employee.email} value={employee.email}>{employee.full_name || employee.name || employee.email}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="shrink-0 border-t border-border/50 p-4">
          <button
            type="button"
            onClick={saveTask}
            disabled={saving || !title.trim()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            {saving ? "Assigning..." : "Assign Task"}
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { recordAction, setActiveTab } = useUnifiedState();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => searchParams.get("tab") || "all");
  const [completingTask, setCompletingTask] = useState({});
  const [selectedPrepTask, setSelectedPrepTask] = useState(null);
  const [showPhotoTask, setShowPhotoTask] = useState(false);
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
      className="max-w-full overflow-x-hidden pb-40 lg:overflow-auto lg:pb-28"
      style={{ maxHeight: '100%', overscrollBehavior: 'contain' }}
    >
      {pullRefresh > 0 && (
        <div className="sticky top-0 z-30 flex items-center justify-center h-12 bg-primary/10">
          <div
            className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent transition-transform"
            style={{ transform: `rotate(${pullRefresh * 3.6}deg)` }}
          />
        </div>
      )}
      <DesktopPageHeader
        title="My Tasks"
        subtitle="Your shift mission list"
        actions={isAdmin && (
          <button
            type="button"
            onClick={() => setShowPhotoTask(true)}
            className="h-8 px-3 rounded-2xl border border-primary/30 bg-primary/10 text-xs font-bold text-primary flex items-center gap-1.5 hover:bg-primary/15 active:scale-95 transition-all"
          >
            <Camera className="h-3.5 w-3.5" />
            Photo Assign Task
          </button>
        )}
      />
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-foreground">My Tasks</h1>
            <p className="text-[11px] text-muted-foreground">Your shift mission list</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowPhotoTask(true)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-3 text-xs font-black text-primary-foreground active:scale-95"
            >
              <Camera className="h-4 w-4" />
              Assign
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] space-y-4 overflow-x-hidden px-4 py-3 lg:px-6 lg:pt-14">
        {/* Shift summary card */}
        {data && (
          <div className="card-glass flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-border p-3 sm:gap-4">
            <div className="shrink-0 border-r border-border pr-3 text-center sm:pr-4">
              <p className="text-2xl font-bold text-primary">{data.shiftScore}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Shift Score</p>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-1 text-center sm:gap-2">
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
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
          <div className="pill-slider-container">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => { haptics.light(); setFilter(f.id); }}
                className={cn(
                  "glass-pill",
              filter === f.id
                    ? "glow-active"
                    :  ""
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
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

      <PhotoTaskSheet
        open={showPhotoTask}
        onClose={() => setShowPhotoTask(false)}
        currentUser={user}
        toast={toast}
        onCreated={() => {
          rawCache.generatedTasks = null;
          setTimeout(() => load(), 250);
        }}
      />

      {/* Prep Flow Engine */}
      <AnimatePresence>
        {prepFlowPhase === "active" && activePrepFlow && (
          <ActivePrepStep
            item={activePrepFlow.item}
            steps={activePrepFlow.steps}
            ingredients={[]}
            requiresPhoto={activePrepFlow.item?.requires_photo || false}
            requiresChefApproval={activePrepFlow.item?.chef_approval_required || false}
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
