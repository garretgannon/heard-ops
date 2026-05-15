import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  Lock,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Save,
  ClipboardList,
  Sparkles,
  Star,
  Store,
  Activity,
  LogOut,
  Shield,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { haptics } from "@/utils/haptics";
import DesktopPageHeader from "@/components/DesktopPageHeader";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRE_SHIFT_DUTY = "Set up and conduct pre-shift briefing";

const DUTIES_CONFIG = [
  { text: "Review incoming handoff",                   xp: 10, icon: MessageSquareText },
  { text: PRE_SHIFT_DUTY,                              xp: 25, icon: Users,             requiresPreShift: true },
  { text: "Verify 86'd items and event changes",       xp: 10, icon: Flame },
  { text: "Walk all active stations",                  xp: 15, icon: MapPin },
  { text: "Check critical equipment and open issues",  xp: 15, icon: AlertTriangle },
  { text: "Confirm staffing and breaks",               xp: 10, icon: Users },
  { text: "Review manager follow-ups",                 xp: 10, icon: ClipboardCheck },
  { text: "Prepare closing handoff",                   xp: 15, icon: ArrowRight },
];
const DUTIES = DUTIES_CONFIG.map(d => d.text);

const SHIFT_META = {
  morning:   { label: "Opening Command",  color: "text-amber-400",  glow: "rgba(251,191,36,0.25)",   bg: "rgba(251,191,36,0.06)" },
  afternoon: { label: "Midday Command",   color: "text-blue-400",   glow: "rgba(96,165,250,0.25)",   bg: "rgba(96,165,250,0.06)" },
  evening:   { label: "Dinner Command",   color: "text-primary",    glow: "rgba(230,106,31,0.3)",    bg: "rgba(230,106,31,0.06)" },
  night:     { label: "Closing Command",  color: "text-purple-400", glow: "rgba(167,139,250,0.25)",  bg: "rgba(167,139,250,0.06)" },
};

const STAGE_CONFIG = [
  { id: "start", label: "Pre-Shift", num: "01", icon: ClipboardList },
  { id: "run",   label: "Running",   num: "02", icon: Activity      },
  { id: "close", label: "Sign-Off",  num: "03", icon: LogOut        },
];

function stageFromLocation(location) {
  if (location.pathname === "/shift-handoff") return "close";

  const stage = new URLSearchParams(location.search).get("stage");
  if (stage === "debrief" || stage === "handoff" || stage === "close") return "close";
  if (stage === "ops" || stage === "run") return "run";
  return "start";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayKey() { return new Date().toISOString().slice(0, 10); }

function currentShiftKey() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 16) return "afternoon";
  if (h < 23) return "evening";
  return "night";
}

function recentDate(item) {
  return item?.created_date || item?.updated_date || item?.date || item?.eventDate || item?.waste_date || "";
}

function titleFor(item, fallback) {
  return item?.title || item?.eventName || item?.item_name || item?.notes_for_next_manager || fallback;
}

function safeEntityCall(call) {
  return call?.catch?.(() => []) || Promise.resolve([]);
}

const DEFAULT_HANDOFF_PROMPTS = [
  "All sidework and required checklist items are complete or have a documented follow-up.",
  "All open issues from this shift have a resolution or next action.",
  "All 86'd items and waste/log notes from this shift have been reviewed.",
];

function recordDateKey(item) {
  const value = item?.date || item?.created_date || item?.createdAt || item?.created_at || item?.dateTime || item?.completed_at || item?.completedAt || "";
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function isForDate(item, date) {
  const key = recordDateKey(item);
  return !key || key === date;
}

function reviewKey(prefix, item, index) {
  return `${prefix}:${item?.id || item?.source_entity_id || item?.source_task_id || index}`;
}

function fieldText(item, fields, fallback = "") {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }
  return fallback;
}

function statusText(item) {
  return [item?.status, item?.priority, item?.area || item?.station || item?.location].filter(Boolean).join(" • ");
}

// ─── XP Float ─────────────────────────────────────────────────────────────────

function XpFloat({ amount, onDone }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.25 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      onAnimationComplete={onDone}
      className="pointer-events-none fixed bottom-40 left-1/2 z-[2000] -translate-x-1/2 text-2xl font-black text-primary"
      style={{ textShadow: "0 0 16px rgba(230,106,31,0.9)" }}
    >
      +{amount} XP
    </motion.div>,
    document.body
  );
}

// ─── Stage pipeline ───────────────────────────────────────────────────────────

function StagePipeline({ active, acknowledged }) {
  const activeIdx = STAGE_CONFIG.findIndex(s => s.id === active);

  return (
    <div className="flex items-center gap-0">
      {STAGE_CONFIG.map((stage, i) => {
        const Icon = stage.icon;
        const isActive = stage.id === active;
        const isDone = i < activeIdx;

        return (
          <div key={stage.id} className="flex items-center">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition-all duration-300",
              isActive
                ? "border border-primary/50 bg-primary/15 text-primary"
                : isDone
                  ? "border border-green-500/30 bg-green-500/8 text-green-400"
                  : "border border-border/40 bg-transparent text-muted-foreground/50"
            )}
              style={isActive ? { boxShadow: "0 0 12px rgba(230,106,31,0.2)" } : undefined}
            >
              {isDone
                ? <Check className="h-3 w-3" />
                : <Icon className="h-3 w-3" />
              }
              <span className="hidden sm:inline">{stage.label}</span>
              <span className="sm:hidden">{stage.num}</span>
            </div>
            {i < STAGE_CONFIG.length - 1 && (
              <div className={cn(
                "mx-1 h-px w-4 transition-colors",
                i < activeIdx ? "bg-green-500/40" : "bg-border/30"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Intel card ───────────────────────────────────────────────────────────────

function IntelCard({ id, icon: Icon, label, count, severity = "neutral", children, onViewed }) {
  const [open, setOpen] = useState(false);
  const [viewed, setViewed] = useState(false);

  const iconColor = severity === "critical" ? "text-red-400" : severity === "warning" ? "text-amber-400" : "text-primary";
  const badgeStyle = severity === "critical" && count > 0
    ? "border-red-500/30 bg-red-500/10 text-red-400"
    : severity === "warning" && count > 0
      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
      : "border-border/30 text-muted-foreground";

  const toggle = () => {
    const next = !open;
    setOpen(next);
    haptics.light();
    if (next && !viewed) {
      setViewed(true);
      onViewed?.(id);
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-colors duration-300",
        viewed ? "border-border/50" : "border-border/40"
      )}
      style={{
        background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={cn("h-4 w-4 shrink-0", viewed ? "text-green-400/70" : iconColor)} />
          <span className={cn("text-sm font-black transition-colors", viewed ? "text-foreground/70" : "text-foreground")}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {viewed && <Check className="h-3 w-3 text-green-400/60" />}
          <span className={cn("rounded-full border px-2 py-0.5 text-xs font-black tabular-nums", badgeStyle)}>{count}</span>
          <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.18 }}>
            <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground/50" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1 border-t border-border/20 px-4 pb-3 pt-2.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IntelRow({ title, meta, severity = "neutral" }) {
  const dot = severity === "critical" ? "bg-red-400/80" : severity === "warning" ? "bg-amber-400/80" : "bg-border/60";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/20 px-3 py-2.5"
      style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
        {meta && <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{meta}</p>}
      </div>
    </div>
  );
}

function EmptyIntel({ text }) {
  return <p className="py-1 text-xs text-muted-foreground">{text}</p>;
}

// ─── Duty card ────────────────────────────────────────────────────────────────

function DutyCard({ config, checked, locked, onToggle, xpFloat, onXpDone }) {
  const Icon = config.icon;
  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onToggle}
        disabled={locked}
        layout
        animate={{
          borderColor: checked ? "rgba(34,197,94,0.4)" : locked ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)",
          backgroundColor: checked ? "rgba(34,197,94,0.06)" : "transparent",
        }}
        transition={{ duration: 0.25 }}
        className="flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border/25 px-4 py-3 text-left"
        style={{ background: checked ? "rgba(34,197,94,0.06)" : "linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)" }}
      >
        {/* Status icon */}
        <motion.div
          animate={{
            backgroundColor: checked ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)",
            borderColor: checked ? "rgba(34,197,94,0.5)" : locked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)",
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
        >
          <AnimatePresence mode="wait">
            {checked
              ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Check className="h-4 w-4 text-green-400" />
                </motion.div>
              : locked
                ? <motion.div key="lock"><Lock className="h-3.5 w-3.5 text-muted-foreground/40" /></motion.div>
                : <motion.div key="icon"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></motion.div>
            }
          </AnimatePresence>
        </motion.div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-bold leading-snug transition-all",
            checked ? "text-muted-foreground line-through" : locked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {config.text}
          </p>
          {locked && <p className="mt-0.5 text-[10px] text-amber-400/70">Complete pre-shift briefing first</p>}
        </div>

        {/* XP badge */}
        <div className={cn(
          "flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black transition-all",
          checked
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : locked
              ? "border-border/20 text-muted-foreground/30"
              : "border-primary/25 bg-primary/8 text-primary"
        )}>
          <Zap className="h-2.5 w-2.5" />
          {config.xp}
        </div>
      </motion.button>

      {/* XP float */}
      <AnimatePresence>
        {xpFloat && (
          <XpFloat key={xpFloat} amount={config.xp} onDone={onXpDone} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shift complete overlay ───────────────────────────────────────────────────

function ShiftComplete({ shiftXp, checkedDuties, shift, onDismiss }) {
  const meta = SHIFT_META[shift] || SHIFT_META.evening;
  const pct = Math.round((checkedDuties.length / DUTIES.length) * 100);
  const grade = pct === 100 ? "S" : pct >= 80 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "D";
  const gradeColor = grade === "S" ? "text-yellow-400" : grade === "A" ? "text-green-400" : grade === "B" ? "text-primary" : "text-amber-400";

  useEffect(() => {
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.55 }, colors: ["#E66A1F", "#FB923C", "#FCD34D"] });
    setTimeout(() => {
      confetti({ particleCount: 40, angle: 60,  spread: 50, origin: { x: 0 }, colors: ["#22c55e", "#FCD34D"] });
      confetti({ particleCount: 40, angle: 120, spread: 50, origin: { x: 1 }, colors: ["#22c55e", "#FCD34D"] });
    }, 400);
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
        className="w-full max-w-sm space-y-5 text-center"
      >
        {/* Trophy */}
        <div className="relative mx-auto h-24 w-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-primary/30 border-t-primary"
            style={{ boxShadow: "0 0 24px rgba(230,106,31,0.25)" }}
          />
          <div className="absolute inset-2 flex items-center justify-center rounded-full border border-border/40 bg-black/60">
            <Trophy className="h-10 w-10 text-primary" style={{ filter: "drop-shadow(0 0 8px rgba(230,106,31,0.7))" }} />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Shift Complete</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">{meta.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Handoff saved. Next manager is briefed.</p>
        </div>

        {/* Stats */}
        <div
          className="overflow-hidden rounded-2xl border border-border/40"
          style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
        >
          <div
            className="border-b border-border/30 py-4"
            style={{ background: "linear-gradient(135deg, rgba(230,106,31,0.1) 0%, rgba(230,106,31,0.03) 100%)" }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">XP Earned</p>
            <p className="mt-0.5 text-4xl font-black text-foreground" style={{ textShadow: "0 0 24px rgba(230,106,31,0.5)" }}>
              {shiftXp}
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border/30">
            <div className="flex flex-col items-center justify-center gap-0.5 py-3">
              <p className={cn("text-3xl font-black", gradeColor)}>{grade}</p>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Grade</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5 py-3">
              <p className="text-2xl font-black text-foreground">{checkedDuties.length}/{DUTIES.length}</p>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Duties</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5 py-3">
              <p className="text-2xl font-black text-green-400">{pct}%</p>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Complete</p>
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full rounded-2xl py-3.5 text-sm font-black text-white active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)",
            boxShadow: "0 0 0 1px rgba(230,106,31,0.35), 0 0 20px rgba(230,106,31,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          New Shift
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ManagerShift() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState(() => stageFromLocation(location));
  const [briefing, setBriefing] = useState({
    handoffs: [], managerLogs: [], eightySix: [],
    waste: [], events: [], issues: [], tasks: [], staff: [],
    shiftLogs: [], checklists: [], handoffPrompts: [],
  });
  const [preShiftSaved, setPreShiftSaved] = useState(false);
  const [preShiftId, setPreShiftId]       = useState(null);
  const [preShiftForm, setPreShiftForm]   = useState({
    roles: "", specialCleaning: "", reservations: "", outOfStock: "", specials: "", notes: "",
  });
  const [acknowledged, setAcknowledged]   = useState(false);
  const [checkedDuties, setCheckedDuties] = useState([]);
  const [handoffNotes, setHandoffNotes]   = useState("");
  const [debriefReviews, setDebriefReviews] = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [shiftComplete, setShiftComplete] = useState(false);
  const [viewedIntelCards, setViewedIntelCards] = useState(new Set());

  const INTEL_CARD_IDS = ["handoff", "eightySix", "issues", "events", "logs"];
  const allCardsViewed = INTEL_CARD_IDS.every(id => viewedIntelCards.has(id));

  const markCardViewed = (id) => {
    setViewedIntelCards(prev => new Set([...prev, id]));
  };

  // Gamification
  const [shiftXp, setShiftXp]         = useState(0);
  const [xpFloats, setXpFloats]       = useState([]);

  const date  = todayKey();
  const shift = currentShiftKey();
  const preShiftEntityShift = shift === "night" ? "evening" : shift;
  const ackKey = `heard-manager-shift-ack:${date}:${shift}:${user?.email || "manager"}`;
  const meta = SHIFT_META[shift] || SHIFT_META.evening;

  const load = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    try {
      const [handoffs, managerLogs, eightySix, waste, events, issues, tasks, staff, preShifts, unifiedLogs, logEntries, sideWork, closing, opening, handoffTemplates, templateItems] = await Promise.all([
        safeEntityCall(base44.entities.ShiftHandoff?.list?.("-created_date", 8)),
        safeEntityCall(base44.entities.ManagerLog?.list?.("-created_date", 12)),
        safeEntityCall(base44.entities.EightySixItem?.filter?.({ is_active: true })),
        safeEntityCall(base44.entities.WasteEntry?.list?.("-created_date", 8)),
        safeEntityCall(base44.entities.BEO?.list?.("-eventDate", 8)),
        safeEntityCall(base44.entities.Issue?.filter?.({ status: "open" })),
        safeEntityCall(base44.entities.Task?.list?.("-updated_date", 20)),
        safeEntityCall(base44.entities.StaffShift?.filter?.({ date })),
        safeEntityCall(base44.entities.PreShift?.filter?.({ date, shift: preShiftEntityShift })),
        safeEntityCall(base44.entities.UnifiedLog?.list?.("-created_date", 80)),
        safeEntityCall(base44.entities.LogEntry?.list?.("-completed_at", 80)),
        safeEntityCall(base44.entities.DailySideWorkTask?.filter?.({ date })),
        safeEntityCall(base44.entities.ClosingChecklist?.filter?.({ date })),
        safeEntityCall(base44.entities.OpeningChecklist?.filter?.({ date })),
        safeEntityCall(base44.entities.Template?.filter?.({ template_type: "handoff", is_active: true })),
        safeEntityCall(base44.entities.TemplateItem?.list?.("sort_order", 120)),
      ]);

      const upcomingEvents = events.filter(e => !e.eventDate || e.eventDate >= date).slice(0, 4);
      const activeEightySix = eightySix.slice(0, 4);
      const currentPreShift = preShifts?.[0];
      const templateIds = new Set(handoffTemplates.map(t => t.id));
      const customPrompts = templateItems
        .filter(item => templateIds.has(item.templateId))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(item => item.handoff_question || item.title)
        .filter(Boolean);
      const incompleteStatuses = new Set(["pending", "in_progress", "pending_review", "overdue", "missed", "blocked"]);
      const requiredChecklistItems = [
        ...sideWork.filter(item => incompleteStatuses.has(item.status)),
        ...closing.filter(item => incompleteStatuses.has(item.status) || item.flagged_for_handoff),
        ...opening.filter(item => incompleteStatuses.has(item.status)),
        ...tasks.filter(item => item.is_required_for_close && !["completed", "approved"].includes(item.status)),
      ];
      const shiftLogs = [
        ...unifiedLogs.filter(log => isForDate(log, date) && log.type !== "shift_handoff"),
        ...logEntries.filter(log => isForDate(log, date)),
      ].slice(0, 20);

      setBriefing({
        handoffs: handoffs.slice(0, 3),
        managerLogs: managerLogs.filter(l => l.status !== "resolved").slice(0, 4),
        eightySix: activeEightySix,
        waste: waste.slice(0, 4),
        events: upcomingEvents,
        issues: issues.slice(0, 4),
        tasks: tasks.filter(t => !["complete", "approved"].includes(t.status)).slice(0, 6),
        staff: staff.slice(0, 60),
        shiftLogs,
        checklists: requiredChecklistItems.slice(0, 20),
        handoffPrompts: customPrompts.length ? customPrompts : DEFAULT_HANDOFF_PROMPTS,
      });
      setPreShiftSaved(Boolean(currentPreShift));
      setPreShiftId(currentPreShift?.id || null);
      setPreShiftForm({
        roles: currentPreShift?.staffing_notes || staff.map(p => [p.employee_name, p.role, p.station].filter(Boolean).join(" - ")).join("\n"),
        specialCleaning: currentPreShift?.issues || "",
        reservations: currentPreShift?.reservations || upcomingEvents.map(e => [e.eventName, e.startTime, e.room, e.guestCount ? `${e.guestCount} guests` : ""].filter(Boolean).join(" - ")).join("\n"),
        outOfStock: currentPreShift?.items_86d || activeEightySix.map(i => [i.item_name, i.category].filter(Boolean).join(" - ")).join("\n"),
        specials: currentPreShift?.specials || "",
        notes: currentPreShift?.notes || "",
      });
      setAcknowledged(localStorage.getItem(ackKey) === "true");
      if (currentPreShift) {
        setCheckedDuties(prev => prev.includes(PRE_SHIFT_DUTY) ? prev : [...prev, PRE_SHIFT_DUTY]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [ackKey]);
  useEffect(() => {
    setActiveStage(stageFromLocation(location));
  }, [location.pathname, location.search]);

  const totals = useMemo(() => {
    const critical = briefing.issues.length + briefing.eightySix.length;
    const followUps = briefing.managerLogs.length + briefing.tasks.length + briefing.checklists.length;
    return { critical, followUps };
  }, [briefing]);

  const debriefItems = useMemo(() => {
    const items = [];

    briefing.checklists.forEach((item, index) => {
      items.push({
        key: reviewKey("checklist", item, index),
        group: "Sidework / Checklist",
        title: fieldText(item, ["taskName", "task_name", "title"], "Checklist item"),
        meta: statusText(item) || "Required before shift close",
        requiresNote: true,
      });
    });

    briefing.issues.forEach((item, index) => {
      items.push({
        key: reviewKey("issue", item, index),
        group: "Issues",
        title: fieldText(item, ["title", "description"], "Open issue"),
        meta: statusText(item),
        requiresNote: true,
      });
    });

    briefing.eightySix.forEach((item, index) => {
      items.push({
        key: reviewKey("86", item, index),
        group: "86'd Items",
        title: fieldText(item, ["item_name", "title", "name"], "86'd item"),
        meta: fieldText(item, ["category", "notes", "reason"], "Active 86 item"),
        requiresNote: false,
      });
    });

    briefing.shiftLogs.forEach((item, index) => {
      items.push({
        key: reviewKey("log", item, index),
        group: "Logs Created This Shift",
        title: fieldText(item, ["title", "log_type", "type"], "Shift log"),
        meta: fieldText(item, ["description", "notes", "corrective_action"], statusText(item)),
        requiresNote: item.status === "open" || item.status === "flagged" || item.pass_fail_status === "fail",
      });
    });

    return items;
  }, [briefing]);

  const debriefCompleteCount = debriefItems.filter(item => {
    const review = debriefReviews[item.key];
    return review?.status && (!review.requiresNote || review.note?.trim());
  }).length;

  const updateDebriefReview = (key, updates) => {
    setDebriefReviews(prev => ({
      ...prev,
      [key]: {
        requiresNote: prev[key]?.requiresNote || updates.requiresNote || false,
        ...prev[key],
        ...updates,
      },
    }));
  };

  const addXp = (amount) => {
    setShiftXp(prev => prev + amount);
    const id = Date.now() + Math.random();
    setXpFloats(prev => [...prev, id]);
    setTimeout(() => setXpFloats(prev => prev.filter(x => x !== id)), 1200);
  };

  const toggleDuty = (config) => {
    const { text: duty, xp, requiresPreShift } = config;
    if (requiresPreShift && !preShiftSaved) {
      haptics.warning();
      toast.error("Save the pre-shift briefing first");
      return;
    }
    const wasChecked = checkedDuties.includes(duty);
    if (!wasChecked) {
      const newChecked = [...checkedDuties, duty];
      haptics.light();
      setCheckedDuties(newChecked);
      addXp(xp);
      if (newChecked.length === DUTIES.length) {
        setTimeout(() => haptics.success(), 300);
      }
    } else {
      setCheckedDuties(prev => prev.filter(d => d !== duty));
    }
  };

  const updatePreShiftField = (field, value) => {
    setPreShiftSaved(false);
    setCheckedDuties(prev => prev.filter(d => d !== PRE_SHIFT_DUTY));
    setPreShiftForm(prev => ({ ...prev, [field]: value }));
  };

  const savePreShift = async () => {
    if (!preShiftForm.roles.trim() || !preShiftForm.notes.trim()) {
      toast.error("Add staff roles and briefing notes");
      return;
    }
    const talkingPoints = [
      preShiftForm.reservations && `Reservations/BEO:\n${preShiftForm.reservations}`,
      preShiftForm.outOfStock && `Out of stock / 86:\n${preShiftForm.outOfStock}`,
      preShiftForm.specials && `Specials:\n${preShiftForm.specials}`,
      preShiftForm.specialCleaning && `Special cleaning:\n${preShiftForm.specialCleaning}`,
      preShiftForm.notes && `Briefing notes:\n${preShiftForm.notes}`,
    ].filter(Boolean).join("\n\n");

    const payload = {
      date, shift: preShiftEntityShift,
      staffing_notes: preShiftForm.roles,
      specials: preShiftForm.specials,
      issues: preShiftForm.specialCleaning,
      notes: talkingPoints,
    };

    const saved = preShiftId
      ? await base44.entities.PreShift?.update?.(preShiftId, payload).catch(() => null)
      : await base44.entities.PreShift?.create?.(payload).catch(() => null);

    if (saved?.id) setPreShiftId(saved.id);
    setPreShiftSaved(true);
    addXp(15);
    setCheckedDuties(prev => prev.includes(PRE_SHIFT_DUTY) ? prev : [...prev, PRE_SHIFT_DUTY]);
    haptics.success();
    toast.success("Pre-shift briefing saved");
  };

  const acknowledgeBriefing = async () => {
    haptics.medium();
    localStorage.setItem(ackKey, "true");
    setAcknowledged(true);
    addXp(20);
    await base44.entities.ManagerLog?.create?.({
      title: `${meta.label} briefing reviewed`,
      category: "shift_note", shift,
      notes: "Incoming handoff and shift briefing acknowledged.",
      priority: totals.critical > 0 ? "high" : "medium",
      status: "resolved",
      logged_by: user?.email,
      logged_by_name: user?.full_name,
    }).catch(() => null);
    toast.success("Briefing acknowledged");
    setActiveStage("run");
  };

  const completeHandoff = async () => {
    if (!preShiftSaved) {
      haptics.warning();
      toast.error("Complete the pre-shift briefing before closing the shift");
      setActiveStage("run");
      return;
    }
    if (!handoffNotes.trim()) {
      haptics.warning();
      toast.error("Add handoff notes for the next manager");
      return;
    }
    const incompleteReview = debriefItems.find(item => {
      const review = debriefReviews[item.key];
      return !review?.status || ((item.requiresNote || review.status !== "no_follow_up") && !review.note?.trim());
    });
    if (incompleteReview) {
      haptics.warning();
      toast.error(`Resolve or clear follow-up for: ${incompleteReview.title}`);
      return;
    }
    haptics.medium();
    setSubmitting(true);
    try {
      const reviewSummary = debriefItems.map(item => {
        const review = debriefReviews[item.key];
        const status = review?.status === "follow_up" ? "Follow-up needed" : "No follow-up needed";
        return `${item.group}: ${item.title} — ${status}${review?.note ? ` (${review.note})` : ""}`;
      });
      const followUpItems = debriefItems.filter(item => debriefReviews[item.key]?.status === "follow_up");

      await base44.entities.ShiftHandoff?.create?.({
        date, shift,
        logged_by: user?.email || user?.full_name || "Manager",
        department: "All",
        urgency: totals.critical > 0 ? "high" : "medium",
        notes_for_next_manager: [handoffNotes, reviewSummary.join("\n")].filter(Boolean).join("\n\nDebrief review:\n"),
        items_86d: briefing.eightySix.map(i => i.item_name).join(", "),
        maintenance_problems: followUpItems.map(i => i.title).join("; "),
        prep_concerns: briefing.checklists.map(i => fieldText(i, ["taskName", "task_name", "title"], "Checklist item")).join("; "),
        reservations_to_watch: briefing.events.map(e => e.eventName).join("; "),
        tags: ["FOH", "BOH", "Prep"],
        resolved_items: debriefItems.filter(item => debriefReviews[item.key]?.status === "no_follow_up").map(item => item.key),
      });
      await base44.entities.UnifiedLog?.create?.({
        type: "shift_handoff",
        title: `${meta.label} handoff`,
        description: handoffNotes,
        status: followUpItems.length ? "open" : "resolved",
        priority: followUpItems.length ? "high" : "medium",
        visibility: "team_log",
        follow_up_required: followUpItems.length > 0,
        created_by: user?.email,
        custom_metadata: { shift, date, reviewSummary },
      }).catch(() => null);
      addXp(50);
      haptics.strong();
      setShiftComplete(true);
    } catch {
      toast.error("Could not save handoff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissComplete = () => {
    setShiftComplete(false);
    setHandoffNotes("");
    setDebriefReviews({});
    setActiveStage("start");
    setShiftXp(0);
    setCheckedDuties([]);
    load({ quiet: true });
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent"
          style={{ boxShadow: "0 0 20px rgba(230,106,31,0.35)" }}
        />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading shift data…</p>
      </div>
    );
  }

  const dutiesPct = Math.round((checkedDuties.length / DUTIES.length) * 100);

  return (
    <div className="min-h-screen pb-36 lg:pb-12">
      <DesktopPageHeader title="Shift" subtitle="Manager briefing, duties, and handoff" />

      {/* Sticky HUD header */}
      <div
        className="lg:hidden sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{
          background: "linear-gradient(180deg, rgba(6,10,16,0.97) 0%, rgba(8,13,20,0.95) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 16px rgba(0,0,0,0.5)",
        }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", meta.color)}>
              Manager Shift
            </p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-foreground">{meta.label}</h1>
          </div>
          <button
            type="button"
            onClick={() => load({ quiet: true })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 transition-all"
            style={{ background: "rgba(255,255,255,0.04)" }}
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", refreshing && "animate-spin")} />
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-2.5 flex items-center gap-3">
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black",
            totals.critical > 0 ? "border-amber-500/25 text-amber-400/80" : "border-border/30 text-muted-foreground/60"
          )}>
            <AlertTriangle className="h-3 w-3" />
            {totals.critical} critical
          </div>
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black",
            dutiesPct === 100 ? "border-green-500/30 bg-green-500/8 text-green-400" : "border-border/30 text-muted-foreground/60"
          )}>
            <ClipboardCheck className="h-3 w-3" />
            {checkedDuties.length}/{DUTIES.length} duties
          </div>
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black",
            shiftXp > 0 ? "border-primary/30 bg-primary/8 text-primary" : "border-border/30 text-muted-foreground/60"
          )}>
            <Zap className="h-3 w-3" />
            {shiftXp} XP
          </div>
        </div>

        {/* Duty progress bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/40">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${dutiesPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              background: dutiesPct === 100
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : "linear-gradient(90deg, hsl(22,76%,38%), hsl(22,76%,55%))",
              boxShadow: dutiesPct === 100 ? "0 0 8px rgba(34,197,94,0.5)" : "0 0 6px rgba(230,106,31,0.4)",
            }}
          />
        </div>

        {/* Stage pipeline */}
        <div className="mt-3 flex items-center justify-center">
          <div className="flex gap-1">
            {STAGE_CONFIG.map(stage => (
              <button
                key={stage.id}
                type="button"
                onClick={() => { haptics.light(); setActiveStage(stage.id); }}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-black transition-all duration-300 border",
                  activeStage === stage.id
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/40 bg-transparent text-muted-foreground/50 hover:text-foreground hover:border-border/60"
                )}
                style={activeStage === stage.id ? { boxShadow: "0 0 12px rgba(230,106,31,0.2)" } : undefined}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop stage nav — replaces the hidden mobile HUD tabs */}
      <div className="hidden lg:flex items-center gap-2 px-8 py-3 border-b border-border/20 bg-card/30">
        <div className="flex gap-1">
          {STAGE_CONFIG.map(stage => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.id;
            const activeIdx = STAGE_CONFIG.findIndex(s => s.id === activeStage);
            const isDone = STAGE_CONFIG.findIndex(s => s.id === stage.id) < activeIdx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => { haptics.light(); setActiveStage(stage.id); }}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'glow-active'
                    : isDone
                      ? 'text-green-400 hover:bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                {stage.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={cn('text-xs font-bold', totals.critical > 0 ? 'text-amber-400/80' : 'text-muted-foreground')}>
            {totals.critical} critical
          </span>
          <span className={cn('text-xs font-bold', checkedDuties.length === DUTIES.length ? 'text-green-400' : 'text-muted-foreground')}>
            {checkedDuties.length}/{DUTIES.length} duties
          </span>
          <span className={cn('text-xs font-bold', shiftXp > 0 ? 'text-primary' : 'text-muted-foreground')}>
            {shiftXp} XP
          </span>
          <button
            type="button"
            onClick={() => load({ quiet: true })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted transition-all"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Stage content */}
      <div className="mx-auto max-w-3xl lg:max-w-5xl px-4 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >

            {/* ── INTEL ──────────────────────────────────────────────── */}
            {activeStage === "start" && (
              <>
                {/* Scorecard */}
                <div
                  className="grid grid-cols-3 divide-x divide-border/20 overflow-hidden rounded-2xl border border-border/40"
                  style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
                >
                  {[
                    { label: "Critical", value: briefing.issues.length + briefing.eightySix.length, color: briefing.issues.length + briefing.eightySix.length > 0 ? "text-red-400" : "text-muted-foreground/40" },
                    { label: "Warnings", value: briefing.events.length, color: briefing.events.length > 0 ? "text-amber-400" : "text-muted-foreground/40" },
                    { label: "Follow-Ups", value: briefing.managerLogs.length + briefing.tasks.length, color: "text-foreground/70" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center justify-center gap-0.5 py-4">
                      <p className={cn("text-2xl font-black tabular-nums", color)}>{value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Acknowledge banner */}
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4",
                    acknowledged ? "border-green-500/30" : "border-border/40"
                  )}
                  style={{
                    background: acknowledged
                      ? "rgba(34,197,94,0.05)"
                      : "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)",
                  }}
                >
                  {acknowledged
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400 mt-0.5" />
                    : <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  }
                  <div className="flex-1">
                    <p className="text-sm font-black text-foreground">
                      {acknowledged ? "Intel reviewed — you're good to go" : "Review shift intel before starting"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Acknowledging logs a manager note and moves you to Ops. +20 XP
                    </p>
                  </div>
                  {acknowledged && (
                    <div className="flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-black text-green-400">
                      <Zap className="h-2.5 w-2.5" /> 20
                    </div>
                  )}
                </div>

                <div className="lg:grid lg:grid-cols-2 lg:gap-3 space-y-3 lg:space-y-0">
                  <IntelCard id="handoff" icon={MessageSquareText} label="Previous Handoff" count={briefing.handoffs.length} onViewed={markCardViewed}>
                    {briefing.handoffs.length === 0
                      ? <EmptyIntel text="No recent handoff found." />
                      : briefing.handoffs.map(item => (
                          <IntelRow key={item.id} title={item.notes_for_next_manager || item.notes || "Handoff note"}
                            meta={[item.department, item.urgency].filter(Boolean).join(" — ")} />
                        ))
                    }
                  </IntelCard>

                  <IntelCard id="eightySix" icon={Flame} label="86'd Items" count={briefing.eightySix.length} severity={briefing.eightySix.length > 0 ? "critical" : "neutral"} onViewed={markCardViewed}>
                    {briefing.eightySix.length === 0
                      ? <EmptyIntel text="Nothing 86'd right now." />
                      : briefing.eightySix.map(item => (
                          <IntelRow key={item.id} title={item.item_name} meta={item.category || item.notes} severity="critical" />
                        ))
                    }
                  </IntelCard>

                  <IntelCard id="issues" icon={AlertTriangle} label="Open Issues" count={briefing.issues.length} severity={briefing.issues.length > 0 ? "critical" : "neutral"} onViewed={markCardViewed}>
                    {briefing.issues.length === 0
                      ? <EmptyIntel text="No open issues." />
                      : briefing.issues.map(item => (
                          <IntelRow key={item.id} title={item.title} meta={item.category || item.priority} severity="critical" />
                        ))
                    }
                  </IntelCard>

                  <IntelCard id="events" icon={CalendarClock} label="BEOs / Events" count={briefing.events.length} severity={briefing.events.length > 0 ? "warning" : "neutral"} onViewed={markCardViewed}>
                    {briefing.events.length === 0
                      ? <EmptyIntel text="No upcoming events." />
                      : briefing.events.map(item => (
                          <IntelRow key={item.id} title={item.eventName}
                            meta={[item.eventDate, item.startTime, item.room].filter(Boolean).join(" · ")} severity="warning" />
                        ))
                    }
                  </IntelCard>

                  <IntelCard id="logs" icon={Store} label="Manager Logs & Waste" count={briefing.managerLogs.length + briefing.waste.length} onViewed={markCardViewed}>
                    {[...briefing.managerLogs, ...briefing.waste].length === 0
                      ? <EmptyIntel text="No manager notes or recent waste." />
                      : [...briefing.managerLogs, ...briefing.waste].slice(0, 6).map(item => (
                          <IntelRow key={`${item.id}-${recentDate(item)}`} title={titleFor(item, "Shift note")}
                            meta={item.category || item.reason || recentDate(item)} />
                        ))
                    }
                  </IntelCard>
                </div>

                {/* Progress before acknowledge */}
                {!acknowledged && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] font-bold text-muted-foreground">
                      {viewedIntelCards.size}/{INTEL_CARD_IDS.length} sections reviewed
                    </p>
                    <div className="flex gap-1">
                      {INTEL_CARD_IDS.map(cid => (
                        <div
                          key={cid}
                          className={cn(
                            "h-1 w-6 rounded-full transition-all duration-300",
                            viewedIntelCards.has(cid) ? "bg-green-400/60" : "bg-border/40"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={acknowledgeBriefing}
                  disabled={acknowledged || !allCardsViewed}
                  className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black text-white transition-all active:scale-[0.98]"
                  style={{
                    background: acknowledged
                      ? "linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0.2) 100%)"
                      : allCardsViewed
                        ? "linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)"
                        : "rgba(255,255,255,0.04)",
                    boxShadow: acknowledged
                      ? "0 0 0 1px rgba(34,197,94,0.3)"
                      : allCardsViewed
                        ? "0 0 0 1px rgba(230,106,31,0.4), 0 0 24px rgba(230,106,31,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
                        : "0 0 0 1px rgba(255,255,255,0.06)",
                    opacity: !acknowledged && !allCardsViewed ? 0.5 : 1,
                  }}
                >
                  {acknowledged
                    ? <><CheckCircle2 className="h-5 w-5" />Intel Acknowledged — +20 XP</>
                    : allCardsViewed
                      ? <><Shield className="h-5 w-5" />Acknowledge Briefing</>
                      : <><Shield className="h-5 w-5" />Review all sections to continue</>
                  }
                </button>
              </>
            )}

            {/* ── OPS ────────────────────────────────────────────────── */}
            {activeStage === "run" && (
              <>
                <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-3 lg:space-y-0">
                  {/* Left: Pre-shift briefing form */}
                  <div>
                    <div
                      className={cn(
                        "overflow-hidden rounded-2xl border",
                        preShiftSaved ? "border-green-500/30" : "border-primary/30"
                      )}
                      style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
                    >
                      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                        <div className="flex items-start gap-2.5">
                          <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="text-sm font-black text-foreground">Pre-Shift Briefing</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">Required to unlock full duty XP. +25 XP on save.</p>
                          </div>
                        </div>
                        <span className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black",
                          preShiftSaved ? "border-green-500/35 bg-green-500/12 text-green-400" : "border-primary/35 bg-primary/12 text-primary"
                        )}>
                          {preShiftSaved ? "✓ Ready" : "Required"}
                        </span>
                      </div>

                      <div className="space-y-3 px-4 pb-4">
                        {/* Staff list */}
                        {briefing.staff.length > 0 && (
                          <div className="rounded-xl border border-border/40 p-3" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scheduled Today</p>
                              <span className="text-xs font-black text-foreground">{briefing.staff.length}</span>
                            </div>
                            <div className="space-y-1">
                              {briefing.staff.slice(0, 8).map(person => (
                                <div key={person.id || person.employee_name} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-semibold text-foreground truncate">{person.employee_name}</span>
                                  <span className="shrink-0 text-muted-foreground">{[person.role, person.station, person.start_time].filter(Boolean).join(" · ")}</span>
                                </div>
                              ))}
                              {briefing.staff.length > 8 && <p className="text-xs text-muted-foreground">+{briefing.staff.length - 8} more</p>}
                            </div>
                          </div>
                        )}

                        {[
                          { field: "roles",           label: "Roles / Assignments",     rows: 4, placeholder: "Who is working, role changes, sections, stations, breaks…" },
                          { field: "reservations",    label: "Reservations / BEO",      rows: 3, placeholder: "Large parties, VIPs, private events, service timing…" },
                          { field: "outOfStock",      label: "Out of Stock / 86",       rows: 3, placeholder: "86'd items, low stock, substitutions…" },
                          { field: "specials",        label: "Specials",                rows: 3, placeholder: "Food, drinks, promos, talking points…" },
                          { field: "specialCleaning", label: "Special Cleaning / Focus",rows: 2, placeholder: "Cleaning priorities, reset items, inspection focus…" },
                          { field: "notes",           label: "Briefing Notes",          rows: 4, placeholder: "What you will say to the team before service…" },
                        ].map(({ field, label, rows, placeholder }) => (
                          <label key={field} className="block space-y-1.5">
                            <span className="text-xs font-black text-foreground">{label}</span>
                            <textarea
                              value={preShiftForm[field]}
                              onChange={e => updatePreShiftField(field, e.target.value)}
                              rows={rows}
                              placeholder={placeholder}
                              className="w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                            />
                          </label>
                        ))}

                        <button
                          type="button"
                          onClick={savePreShift}
                          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white active:scale-[0.98] transition-all"
                          style={{
                            background: "linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)",
                            boxShadow: "0 0 0 1px rgba(230,106,31,0.35), 0 0 16px rgba(230,106,31,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                          }}
                        >
                          <Save className="h-4 w-4" />
                          Save Briefing — +15 XP
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Duties + Quick nav */}
                  <div className="space-y-3">
                    {/* Duties list */}
                    <div
                      className="overflow-hidden rounded-2xl border border-border/40"
                      style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
                    >
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="text-sm font-black text-foreground">Mission Objectives</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-black tabular-nums", dutiesPct === 100 ? "text-green-400" : "text-foreground")}>
                            {checkedDuties.length}/{DUTIES.length}
                          </span>
                          {dutiesPct === 100 && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-border/30 px-3 pb-3 pt-3">
                        {DUTIES_CONFIG.map((config) => {
                          const locked = config.requiresPreShift && !preShiftSaved;
                          const checked = checkedDuties.includes(config.text);
                          const floatKey = xpFloats[xpFloats.length - 1];
                          return (
                            <DutyCard
                              key={config.text}
                              config={config}
                              checked={checked}
                              locked={locked}
                              onToggle={() => toggleDuty(config)}
                              xpFloat={!checked && floatKey}
                              onXpDone={() => setXpFloats(prev => prev.slice(1))}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick nav */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Floor Map", sub: "Station readiness", path: "/operational-map", icon: MapPin },
                        { label: "Approvals", sub: "Pending reviews",   path: "/approvals",       icon: ClipboardCheck },
                      ].map(({ label, sub, path, icon: Icon }) => (
                        <button
                          key={path}
                          type="button"
                          onClick={() => navigate(path)}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border/40 px-3 py-3 text-left transition-all hover:border-border/60"
                          style={{ background: "linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)" }}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-black text-foreground">{label}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── DEBRIEF ────────────────────────────────────────────── */}
            {activeStage === "close" && (
              <>
                {/* Shift recap */}
                <div
                  className="grid grid-cols-3 gap-2 overflow-hidden rounded-2xl border border-border/40"
                  style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
                >
                  {[
                    { label: "Required", value: debriefItems.length, color: debriefItems.length > 0 ? "text-primary" : "text-green-400" },
                    { label: "Reviewed", value: `${debriefCompleteCount}/${debriefItems.length}`, color: debriefCompleteCount === debriefItems.length ? "text-green-400" : "text-foreground" },
                    { label: "Follow-Ups", value: debriefItems.filter(item => debriefReviews[item.key]?.status === "follow_up").length, color: "text-amber-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center justify-center gap-0.5 py-3 text-center">
                      <p className={cn("text-2xl font-black", color)}>{value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Required confirmations */}
                <div
                  className="overflow-hidden rounded-2xl border border-border/40"
                  style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
                >
                  <div className="flex items-start gap-2.5 px-4 pt-4 pb-3">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-black text-foreground">Required Close Review</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Every checklist, sidework item, issue, 86 item, and shift log needs a resolution or no-follow-up confirmation.</p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border/30 px-4 py-4">
                    {debriefItems.length === 0 ? (
                      <div className="rounded-xl border border-green-500/25 bg-green-500/6 px-3 py-3">
                        <p className="text-sm font-black text-green-400">No required follow-up items found.</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Add closing notes below before completing the shift.</p>
                      </div>
                    ) : (
                      debriefItems.map(item => {
                        const review = debriefReviews[item.key] || {};
                        const needsNote = item.requiresNote || review.status === "follow_up";
                        return (
                          <div key={item.key} className="rounded-xl border border-border/40 p-3" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">{item.group}</p>
                                <p className="mt-1 text-sm font-black text-foreground">{item.title}</p>
                                {item.meta && <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>}
                              </div>
                              {review.status && (
                                <CheckCircle2 className={cn("h-4 w-4 shrink-0", review.status === "follow_up" ? "text-amber-400" : "text-green-400")} />
                              )}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => updateDebriefReview(item.key, { status: "no_follow_up", requiresNote: item.requiresNote })}
                                className={cn(
                                  "rounded-lg border px-3 py-2 text-xs font-black transition-all",
                                  review.status === "no_follow_up" ? "border-green-500/40 bg-green-500/12 text-green-400" : "border-border/40 text-muted-foreground"
                                )}
                              >
                                No Follow-Up
                              </button>
                              <button
                                type="button"
                                onClick={() => updateDebriefReview(item.key, { status: "follow_up", requiresNote: true })}
                                className={cn(
                                  "rounded-lg border px-3 py-2 text-xs font-black transition-all",
                                  review.status === "follow_up" ? "border-amber-500/40 bg-amber-500/12 text-amber-400" : "border-border/40 text-muted-foreground"
                                )}
                              >
                                Follow-Up Needed
                              </button>
                            </div>
                            {(review.status || item.requiresNote) && (
                              <textarea
                                value={review.note || ""}
                                onChange={e => updateDebriefReview(item.key, { note: e.target.value, requiresNote: needsNote })}
                                rows={2}
                                placeholder={needsNote ? "Resolution or next action required" : "Optional note"}
                                className="mt-2 w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Custom handoff prompts */}
                <div
                  className="overflow-hidden rounded-2xl border border-border/40"
                  style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
                >
                  <div className="flex items-start gap-2.5 px-4 py-4">
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-black text-foreground">Handoff Requirements</p>
                      <div className="mt-2 space-y-1.5">
                        {briefing.handoffPrompts.map(prompt => (
                          <div key={prompt} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                            <span>{prompt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Handoff notes */}
                <div
                  className="overflow-hidden rounded-2xl border border-border/40"
                  style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
                >
                  <div className="flex items-start gap-2.5 px-4 pt-4 pb-3">
                    <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-black text-foreground">Handoff to Next Manager</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Summarize open items, guest issues, staffing notes. +50 XP on submit.</p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 space-y-3">
                    <textarea
                      value={handoffNotes}
                      onChange={e => setHandoffNotes(e.target.value)}
                      rows={7}
                      placeholder="What does the next manager need to know?"
                      className="w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />

                    <button
                      type="button"
                      onClick={completeHandoff}
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white disabled:opacity-60 active:scale-[0.98] transition-all"
                      style={{
                        background: "linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)",
                        boxShadow: "0 0 0 1px rgba(230,106,31,0.35), 0 0 24px rgba(230,106,31,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                    >
                      <Trophy className="h-5 w-5" />
                      {submitting ? "Saving…" : "Complete Shift — +50 XP"}
                    </button>
                  </div>
                </div>

                {/* Handoff history link */}
                <button
                  type="button"
                  onClick={() => navigate("/logs?type=shift_handoff")}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-3.5 text-left transition-all hover:border-border/60 active:scale-[0.99]"
                  style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="status-marker status-marker-md status-neutral">
                      <Star className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-foreground">Shift Handoff Log</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">View all previous handoff notes and shift history</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Shift complete overlay */}
      <AnimatePresence>
        {shiftComplete && (
          <ShiftComplete
            shiftXp={shiftXp}
            checkedDuties={checkedDuties}
            shift={shift}
            onDismiss={handleDismissComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
