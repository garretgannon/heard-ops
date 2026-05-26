import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Flame,
  Lock,
  MapPin,
  MessageSquareText,
  Mic,
  RefreshCw,
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
import { ShiftMobileGuide, ShiftStageNav } from "@/components/shift/ShiftWorkflowShell";
import ManagerShiftDebriefDesktop from "@/components/shift/ManagerShiftDebriefDesktop";
import ManagerShiftMobileClose from "@/components/shift/ManagerShiftMobileClose";
import ManagerShiftDesktopRun from "@/components/shift/ManagerShiftDesktopRun";
import { useShiftContext } from "@/hooks/useShiftContext";
import { BriefingContextBanner, BriefingProfileSelector } from "@/components/ShiftLaunch/BriefingContextPanel";
import {
  filterStaffForContext, filterIssuesForContext, filterLogsForContext,
  filterEightySixForContext, filterWasteForContext,
  filterReservationsForContext, generateTalkingPoints,
} from "@/lib/briefingProfiles";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRE_SHIFT_DUTY = "Set up and conduct pre-shift meeting";

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
  morning:   { label: "Opening Shift",  color: "text-amber-400",  glow: "rgba(251,191,36,0.25)",   bg: "rgba(251,191,36,0.06)" },
  afternoon: { label: "Midday Shift",   color: "text-blue-400",   glow: "rgba(96,165,250,0.25)",   bg: "rgba(96,165,250,0.06)" },
  evening:   { label: "Dinner Service", color: "text-primary",    glow: "rgba(255,107,0,0.3)",    bg: "rgba(255,107,0,0.06)" },
  night:     { label: "Closing Shift",  color: "text-purple-400", glow: "rgba(167,139,250,0.25)",  bg: "rgba(167,139,250,0.06)" },
};

const STAGE_CONFIG = [
  { id: "start", label: "Pre-Shift", num: "01", icon: ClipboardList, description: "Review shift intel and prepare your team notes." },
  { id: "run",   label: "Running",   num: "02", icon: Activity, description: "Work manager duties, walk stations, and track active follow-ups." },
  { id: "close", label: "Sign-Off",  num: "03", icon: LogOut, description: "Resolve the close review and leave the next manager a clear handoff." },
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

const LOG_CATEGORY_LABELS = {
  shift_note:    "Shift Note",
  waste:         "Waste",
  incident:      "Incident",
  maintenance:   "Maintenance",
  cash_drawer:   "Cash Drawer",
  cash_drop:     "Cash Drop",
  complaint:     "Guest Complaint",
  food_safety:   "Food Safety",
  equipment:     "Equipment",
  prep:          "Prep",
  cleaning:      "Cleaning",
};

function friendlyLogCategory(raw) {
  if (!raw) return "";
  const key = raw.toLowerCase().replace(/[\s-]/g, "_");
  return LOG_CATEGORY_LABELS[key] || raw;
}

// ─── Pre-shift form field definitions ─────────────────────────────────────────

const PRE_SHIFT_FIELD_DEFS = {
  roles:              { label: "Roles / Assignments",      rows: 4, placeholder: "Who is working, role changes, sections, stations, breaks…" },
  reservations:       { label: "Reservations / BEOs",      rows: 3, placeholder: "Large parties, VIPs, private events, service timing…" },
  outOfStock:         { label: "Out of Stock / 86",        rows: 3, placeholder: "86'd items, low stock, substitutions…" },
  specials:           { label: "Specials",                 rows: 3, placeholder: "Food, drinks, promos, talking points…" },
  specialCleaning:    { label: "Special Cleaning / Focus", rows: 2, placeholder: "Cleaning priorities, reset items, inspection focus…" },
  notes:              { label: "Shift Notes",              rows: 4, placeholder: "What you will say to the team before service…" },
  sideworkPriorities: { label: "Sidework Priorities",      rows: 2, placeholder: "Sidework assignments, station duties, priority tasks…" },
  prepNeeds:          { label: "Prep Needs",               rows: 3, placeholder: "Items needing prep, quantities, priority order…" },
  lineCheckNotes:     { label: "Line Check Notes",         rows: 3, placeholder: "Station temps, product quality, readiness, equipment status…" },
  tempCheckNotes:     { label: "Temperature Checks",       rows: 2, placeholder: "Walk-in, freezer, hot holding — any variances to note…" },
  beverageNotes:      { label: "Beverage Notes",           rows: 2, placeholder: "Par levels, tap status, batch recipes, feature cocktails…" },
  barPrepNotes:       { label: "Bar Prep",                 rows: 3, placeholder: "Garnish prep, batch cocktails, keg status, mise en place…" },
};

const FIELD_ORDER_BY_DEPT = {
  foh:     ['sideworkPriorities', 'specials', 'specialCleaning', 'notes'],
  boh:     ['prepNeeds', 'lineCheckNotes', 'tempCheckNotes', 'specials', 'notes'],
  bar:     ['beverageNotes', 'barPrepNotes', 'specials', 'notes'],
  banquet: ['specials', 'notes'],
  all:     ['specials', 'specialCleaning', 'notes'],
};

// ─── XP Float ─────────────────────────────────────────────────────────────────

function XpFloat({ amount, onDone }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.25 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      onAnimationComplete={onDone}
      className="pointer-events-none fixed bottom-40 left-1/2 z-[2000] -translate-x-1/2 text-2xl font-black text-primary"
      style={{ textShadow: "0 0 8px rgba(255,107,0,0.4)" }}
    >
      ✓
    </motion.div>,
    document.body
  );
}

// ─── Intel card ───────────────────────────────────────────────────────────────

function IntelCard({ id, icon: Icon, label, count, severity = "neutral", children, onViewed }) {
  const [open, setOpen] = useState(false);
  const [viewed, setViewed] = useState(false);

  const isClear = count === 0;
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
        "liquid-card overflow-hidden transition-colors duration-300",
        viewed
          ? isClear ? "border-green-500/20" : "border-amber-500/25"
          : count > 0 ? "border-amber-500/20" : "border-border/40"
      )}
      
    >
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 lg:px-5 lg:py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={cn(
            "h-4 w-4 lg:h-5 lg:w-5 shrink-0",
            viewed ? (isClear ? "text-green-400/70" : "text-amber-400/70") : iconColor
          )} />
          <span className={cn("text-sm lg:text-[15px] font-black transition-colors", viewed ? "text-foreground/70" : "text-foreground")}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {viewed
            ? isClear
              ? <Check className="h-3 w-3 text-green-400/60" />
              : <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-wide">Reviewed</span>
            : count > 0 && <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-wide">Review</span>
          }
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
    <div className="liquid-card flex items-start gap-3 border border-border/20 px-3 py-2.5 lg:px-4 lg:py-3">
      <div className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      <div className="min-w-0">
        <p className="text-sm lg:text-[15px] font-semibold text-foreground leading-snug">{title}</p>
        {meta && <p className="mt-0.5 text-[11px] lg:text-xs text-muted-foreground leading-snug">{meta}</p>}
      </div>
    </div>
  );
}

function EmptyIntel({ text, detail }) {
  return (
    <div className="py-1">
      <p className="text-xs text-muted-foreground">{text}</p>
      {detail && <p className="mt-0.5 text-[11px] text-muted-foreground/50">{detail}</p>}
    </div>
  );
}

function MobileIntelDetail({ title, empty, items, renderItem }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm font-semibold text-foreground">{empty}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item, index) => {
            const row = renderItem(item);
            return (
              <div key={item.id || `${title}-${index}`} className="liquid-card border border-border/35 px-3 py-2.5">
                <p className="text-sm font-bold leading-snug text-foreground">{row.title}</p>
                {row.meta && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{row.meta}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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
        className={cn(
          "liquid-card flex w-full items-center gap-3 px-4 py-3 text-left lg:px-5 lg:py-3.5",
          checked && "liquid-card-success"
        )}
      >
        {/* Status icon */}
        <motion.div
          animate={{
            backgroundColor: checked ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)",
            borderColor: checked ? "rgba(34,197,94,0.5)" : locked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)",
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl border"
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
            "text-sm lg:text-[15px] font-bold leading-snug transition-all",
            checked ? "text-muted-foreground line-through" : locked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {config.text}
          </p>
          {locked && <p className="mt-0.5 text-[10px] text-amber-400/70">Complete pre-shift briefing first</p>}
        </div>

        {/* Done indicator */}
        {checked && <Check className="h-3.5 w-3.5 shrink-0 text-green-400/60" />}
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
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.55 }, colors: ["#FF6B00", "#FB923C", "#FCD34D"] });
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
      className="fixed inset-0 z-[2000] flex items-center justify-center px-5 bg-background/90 backdrop-blur-md"
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
          />
          <div className="absolute inset-2 flex items-center justify-center rounded-full border border-border/40 bg-card">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Shift Complete</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">{meta.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Handoff saved. Next manager is briefed.</p>
        </div>

        {/* Stats */}
        <div className="liquid-card">
          <div
            className="border-b border-border/30 py-4 bg-primary/5"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Shift Complete</p>
            <p className="mt-0.5 text-4xl font-black text-foreground">
              {pct}%
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
          className="w-full rounded-2xl py-3.5 text-sm font-black text-white bg-primary hover:bg-primary-dark active:scale-[0.97] transition-all"
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

  // Shift Context Engine — detects role/dept/shift, drives data filtering
  const {
    context:          shiftContext,
    candidateProfiles,
    needsSelection,
    selectProfile,
    resetContext,
  } = useShiftContext(user);

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState(() => stageFromLocation(location));
  const [briefing, setBriefing] = useState({
    handoffs: [], managerLogs: [], eightySix: [],
    waste: [], events: [], issues: [], tasks: [], staff: [],
    shiftLogs: [], checklists: [], handoffPrompts: [],
    prepNeeds: [], reservationsList: [], allStaff: [],
  });
  const [preShiftSaved, setPreShiftSaved]         = useState(false);
  const [preShiftPublished, setPreShiftPublished] = useState(false);
  const [preShiftId, setPreShiftId]               = useState(null);
  const [preShiftForm, setPreShiftForm]   = useState({
    roles: "", specialCleaning: "", reservations: "", outOfStock: "", specials: "", notes: "",
    sideworkPriorities: "", prepNeeds: "", lineCheckNotes: "", tempCheckNotes: "",
    beverageNotes: "", barPrepNotes: "",
  });
  const [acknowledged, setAcknowledged]   = useState(false);
  const [checkedDuties, setCheckedDuties] = useState([]);
  const [handoffNotes, setHandoffNotes]   = useState("");
  const [debriefReviews, setDebriefReviews] = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [shiftComplete, setShiftComplete] = useState(false);
  const [viewedIntelCards, setViewedIntelCards] = useState(new Set());
  const [mobileIntelFocus, setMobileIntelFocus] = useState(null);
  const [preShiftExpandedField, setPreShiftExpandedField] = useState(null);
  const [closeFilterTab, setCloseFilterTab]     = useState('all');
  const [expandedImportRows, setExpandedImportRows] = useState(new Set());
  const [runPage, setRunPage] = useState(0);
  const runScrollRef = useRef(null);
  const handleRunScroll = () => {
    const el = runScrollRef.current;
    if (!el) return;
    setRunPage(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goToRunPage = (page) => {
    const el = runScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: page * el.clientWidth, behavior: 'smooth' });
  };

  const INTEL_CARD_IDS = ["handoff", "eightySix", "issues", "events", "logs"];
  const allCardsViewed = INTEL_CARD_IDS.every(id => viewedIntelCards.has(id));

  const toggleImportRow = (id) => setExpandedImportRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const markCardViewed = (id) => {
    setViewedIntelCards(prev => new Set([...prev, id]));
  };

  const openMobileIntelCard = (id) => {
    markCardViewed(id);
    setMobileIntelFocus(prev => prev === id ? null : id);
    haptics.light();
  };

  const renderMobileIntelDetail = (id) => {
    if (id === "issues") {
      return (
        <MobileIntelDetail
          title="Open Issues"
          empty="No open issues. Clear to continue."
          items={briefing.issues}
          renderItem={(item) => ({
            title: item.title || item.description || "Open issue",
            meta: [friendlyLogCategory(item.category), item.priority, item.area || item.station || item.location].filter(Boolean).join(" · "),
          })}
        />
      );
    }
    if (id === "handoff") {
      return (
        <MobileIntelDetail
          title="Previous Handoff"
          empty="No carry-over items from the previous shift."
          items={briefing.handoffs}
          renderItem={(item) => ({
            title: item.notes_for_next_manager || item.notes || "Handoff note",
            meta: [item.department, item.urgency, item.logged_by].filter(Boolean).join(" · "),
          })}
        />
      );
    }
    if (id === "eightySix") {
      return (
        <MobileIntelDetail
          title="86'd Items"
          empty="Nothing 86'd right now."
          items={briefing.eightySix}
          renderItem={(item) => ({
            title: item.item_name || "86'd item",
            meta: item.category || item.notes,
          })}
        />
      );
    }
    if (id === "events") {
      return (
        <MobileIntelDetail
          title="BEOs / Events"
          empty="No events or private dining today."
          items={briefing.events}
          renderItem={(item) => ({
            title: item.eventName || item.name || "Event",
            meta: [item.eventDate, item.startTime, item.room, item.guestCount ? `${item.guestCount} guests` : ""].filter(Boolean).join(" · "),
          })}
        />
      );
    }
    if (id === "logs") {
      return (
        <MobileIntelDetail
          title="Manager Notes"
          empty="No manager notes or waste entries."
          items={[...briefing.managerLogs, ...briefing.waste].slice(0, 6)}
          renderItem={(item) => ({
            title: titleFor(item, "Shift note"),
            meta: [friendlyLogCategory(item.category || item.reason), recentDate(item)].filter(Boolean).join(" · "),
          })}
        />
      );
    }
    return null;
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
      const handoffs          = await safeEntityCall(base44.entities.ShiftHandoff?.list?.("-created_date", 8));
      const managerLogs       = await safeEntityCall(base44.entities.ManagerLog?.list?.("-created_date", 12));
      const eightySix         = await safeEntityCall(base44.entities.EightySixItem?.filter?.({ is_active: true }));
      const waste             = await safeEntityCall(base44.entities.WasteEntry?.list?.("-created_date", 8));
      const events            = await safeEntityCall(base44.entities.BEO?.list?.("-eventDate", 8));
      const issues            = await safeEntityCall(base44.entities.Issue?.filter?.({ status: "open" }));
      const tasks             = await safeEntityCall(base44.entities.Task?.list?.("-updated_date", 20));
      const staff             = await safeEntityCall(base44.entities.StaffShift?.filter?.({ date }));
      const preShifts         = await safeEntityCall(base44.entities.PreShift?.filter?.({ date, shift: preShiftEntityShift }));
      const unifiedLogs       = await safeEntityCall(base44.entities.UnifiedLog?.list?.("-created_date", 80));
      const logEntries        = await safeEntityCall(base44.entities.LogEntry?.list?.("-completed_at", 80));
      const sideWork          = await safeEntityCall(base44.entities.DailySideWorkTask?.filter?.({ date }));
      const closing           = await safeEntityCall(base44.entities.ClosingChecklist?.filter?.({ date }));
      const opening           = await safeEntityCall(base44.entities.OpeningChecklist?.filter?.({ date }));
      const handoffTemplates  = await safeEntityCall(base44.entities.Template?.filter?.({ template_type: "handoff", is_active: true }));
      const templateItems     = await safeEntityCall(base44.entities.TemplateItem?.list?.("sort_order", 120));
      const prepCountsData    = await safeEntityCall(base44.entities.PrepInventoryCount?.list?.("-updated_date", 20));
      const reservationsData  = await safeEntityCall(base44.entities.Reservation?.filter?.({ date }));

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

      // Apply Shift Context filtering — each filter is a no-op when context is null/all-house
      const ctx = shiftContext;
      const rawStaff        = staff.slice(0, 80);
      const rawIssues       = issues.slice(0, 12);
      const rawManagerLogs  = managerLogs.filter(l => l.status !== "resolved").slice(0, 12);
      const rawWaste        = waste.slice(0, 8);
      const rawReservations = Array.isArray(reservationsData) ? reservationsData : [];
      const rawPrepCounts   = Array.isArray(prepCountsData)   ? prepCountsData   : [];

      const filteredStaff        = filterStaffForContext(rawStaff, ctx);
      const filteredReservations = filterReservationsForContext(rawReservations, ctx);
      const filteredPrepNeeds    = ctx?.importRules?.includePrepNeeds
        ? rawPrepCounts.filter(c => !['approved', 'complete'].includes(c.status)).slice(0, 15)
        : [];

      setBriefing({
        handoffs:         handoffs.slice(0, 3),
        managerLogs:      filterLogsForContext(rawManagerLogs, ctx).slice(0, 6),
        eightySix:        filterEightySixForContext(activeEightySix, ctx),
        waste:            filterWasteForContext(rawWaste, ctx).slice(0, 4),
        events:           upcomingEvents,
        issues:           filterIssuesForContext(rawIssues, ctx).slice(0, 6),
        tasks:            tasks.filter(t => !["complete", "approved"].includes(t.status)).slice(0, 6),
        staff:            filteredStaff,
        shiftLogs,
        checklists:       requiredChecklistItems.slice(0, 20),
        handoffPrompts:   customPrompts.length ? customPrompts : DEFAULT_HANDOFF_PROMPTS,
        reservationsList: filteredReservations,
        prepNeeds:        filteredPrepNeeds,
        allStaff:         staff.slice(0, 80),
      });
      setPreShiftSaved(Boolean(currentPreShift));
      setPreShiftPublished(currentPreShift?.status === 'published');
      setPreShiftId(currentPreShift?.id || null);

      const beoLines = upcomingEvents.map(e =>
        [e.eventName, e.startTime, e.room, e.guestCount ? `${e.guestCount} guests` : ""].filter(Boolean).join(" - ")
      );
      const rsvLines = filteredReservations.slice(0, 6).map(r =>
        [r.guest_name || r.name, r.arrival_time || r.time, r.party_size ? `${r.party_size} pax` : "", r.special_requests || r.dietary_notes].filter(Boolean).join(" - ")
      );
      const prepNeedLines = filteredPrepNeeds.slice(0, 8).map(c =>
        [c.station || c.item_name || 'Station', c.status, c.notes].filter(Boolean).join(": ")
      );

      const suggestedTalkingPoints = generateTalkingPoints({
        staff:        filteredStaff,
        reservations: filteredReservations,
        events:       upcomingEvents,
        eightySix:    activeEightySix,
        issues:       rawIssues,
        prepNeeds:    filteredPrepNeeds,
      }, ctx);

      setPreShiftForm({
        roles:              currentPreShift?.staffing_notes || filteredStaff.map(p => [p.employee_name, p.role, p.station].filter(Boolean).join(" - ")).join("\n"),
        specialCleaning:    currentPreShift?.issues || "",
        reservations:       currentPreShift?.reservations || [...beoLines, ...rsvLines].join("\n"),
        outOfStock:         currentPreShift?.items_86d || activeEightySix.map(i => [i.item_name, i.category].filter(Boolean).join(" - ")).join("\n"),
        specials:           currentPreShift?.specials || "",
        notes:              currentPreShift?.notes || (suggestedTalkingPoints.length ? suggestedTalkingPoints.join("\n") : ""),
        sideworkPriorities: currentPreShift?.sidework_priorities || "",
        prepNeeds:          currentPreShift?.prep_needs || prepNeedLines.join("\n"),
        lineCheckNotes:     currentPreShift?.line_check_notes || "",
        tempCheckNotes:     currentPreShift?.temp_check_notes || "",
        beverageNotes:      currentPreShift?.beverage_notes || "",
        barPrepNotes:       currentPreShift?.bar_prep_notes || "",
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

  // Re-filter when the shift context profile changes (user switches scope)
  useEffect(() => {
    if (shiftContext) load({ quiet: true });
     
  }, [shiftContext?.profileId]);

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
    if (!preShiftForm.notes.trim()) {
      toast.error("Add shift notes before saving");
      return;
    }
    const talkingPoints = [
      preShiftForm.reservations       && `Reservations/BEO:\n${preShiftForm.reservations}`,
      preShiftForm.outOfStock         && `Out of stock / 86:\n${preShiftForm.outOfStock}`,
      preShiftForm.specials           && `Specials:\n${preShiftForm.specials}`,
      preShiftForm.specialCleaning    && `Special cleaning:\n${preShiftForm.specialCleaning}`,
      preShiftForm.sideworkPriorities && `Sidework priorities:\n${preShiftForm.sideworkPriorities}`,
      preShiftForm.prepNeeds          && `Prep needs:\n${preShiftForm.prepNeeds}`,
      preShiftForm.lineCheckNotes     && `Line check:\n${preShiftForm.lineCheckNotes}`,
      preShiftForm.tempCheckNotes     && `Temperature checks:\n${preShiftForm.tempCheckNotes}`,
      preShiftForm.beverageNotes      && `Beverage notes:\n${preShiftForm.beverageNotes}`,
      preShiftForm.barPrepNotes       && `Bar prep:\n${preShiftForm.barPrepNotes}`,
      preShiftForm.notes              && `Briefing notes:\n${preShiftForm.notes}`,
    ].filter(Boolean).join("\n\n");

    const payload = {
      date, shift: preShiftEntityShift,
      staffing_notes:      preShiftForm.roles,
      specials:            preShiftForm.specials,
      issues:              preShiftForm.specialCleaning,
      reservations:        preShiftForm.reservations,
      items_86d:           preShiftForm.outOfStock,
      sidework_priorities: preShiftForm.sideworkPriorities,
      prep_needs:          preShiftForm.prepNeeds,
      line_check_notes:    preShiftForm.lineCheckNotes,
      temp_check_notes:    preShiftForm.tempCheckNotes,
      beverage_notes:      preShiftForm.beverageNotes,
      bar_prep_notes:      preShiftForm.barPrepNotes,
      notes:               talkingPoints,
    };

    const saved = preShiftId
      ? await base44.entities.PreShift?.update?.(preShiftId, payload).catch(() => null)
      : await base44.entities.PreShift?.create?.(payload).catch(() => null);

    if (saved?.id) setPreShiftId(saved.id);
    setPreShiftSaved(true);
    addXp(15);
    setCheckedDuties(prev => prev.includes(PRE_SHIFT_DUTY) ? prev : [...prev, PRE_SHIFT_DUTY]);
    haptics.success();
    toast.success("Pre-shift notes saved");
  };

  const publishBriefing = async () => {
    if (!preShiftForm.notes.trim()) {
      toast.error("Add shift notes before publishing");
      return;
    }
    const talkingPoints = [
      preShiftForm.reservations       && `Reservations/BEO:\n${preShiftForm.reservations}`,
      preShiftForm.outOfStock         && `Out of stock / 86:\n${preShiftForm.outOfStock}`,
      preShiftForm.specials           && `Specials:\n${preShiftForm.specials}`,
      preShiftForm.specialCleaning    && `Special cleaning:\n${preShiftForm.specialCleaning}`,
      preShiftForm.sideworkPriorities && `Sidework priorities:\n${preShiftForm.sideworkPriorities}`,
      preShiftForm.prepNeeds          && `Prep needs:\n${preShiftForm.prepNeeds}`,
      preShiftForm.lineCheckNotes     && `Line check:\n${preShiftForm.lineCheckNotes}`,
      preShiftForm.tempCheckNotes     && `Temperature checks:\n${preShiftForm.tempCheckNotes}`,
      preShiftForm.beverageNotes      && `Beverage notes:\n${preShiftForm.beverageNotes}`,
      preShiftForm.barPrepNotes       && `Bar prep:\n${preShiftForm.barPrepNotes}`,
      preShiftForm.notes              && `Briefing notes:\n${preShiftForm.notes}`,
    ].filter(Boolean).join("\n\n");

    const payload = {
      date, shift: preShiftEntityShift,
      staffing_notes:      preShiftForm.roles,
      specials:            preShiftForm.specials,
      issues:              preShiftForm.specialCleaning,
      reservations:        preShiftForm.reservations,
      items_86d:           preShiftForm.outOfStock,
      sidework_priorities: preShiftForm.sideworkPriorities,
      prep_needs:          preShiftForm.prepNeeds,
      line_check_notes:    preShiftForm.lineCheckNotes,
      temp_check_notes:    preShiftForm.tempCheckNotes,
      beverage_notes:      preShiftForm.beverageNotes,
      bar_prep_notes:      preShiftForm.barPrepNotes,
      notes:               talkingPoints,
      status:              'published',
      published_at:        new Date().toISOString(),
      published_by:        user?.full_name || user?.email || 'Manager',
    };

    const saved = preShiftId
      ? await base44.entities.PreShift?.update?.(preShiftId, payload).catch(() => null)
      : await base44.entities.PreShift?.create?.(payload).catch(() => null);

    if (saved?.id) setPreShiftId(saved.id);
    setPreShiftSaved(true);
    setPreShiftPublished(true);
    addXp(25);
    setCheckedDuties(prev => prev.includes(PRE_SHIFT_DUTY) ? prev : [...prev, PRE_SHIFT_DUTY]);
    haptics.success();
    toast.success("Published to staff phones");
  };

  const acknowledgeBriefing = async () => {
    haptics.medium();
    localStorage.setItem(ackKey, "true");
    setAcknowledged(true);
    addXp(20);
    await base44.entities.ManagerLog?.create?.({
      title: `${meta.label} intel reviewed`,
      category: "shift_note", shift,
      notes: "Incoming handoff and shift intel reviewed.",
      priority: totals.critical > 0 ? "high" : "medium",
      status: "resolved",
      logged_by: user?.email,
      logged_by_name: user?.full_name,
    }).catch(() => null);
    toast.success("Shift intel acknowledged");
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
          style={{ boxShadow: "0 0 12px rgba(255,107,0,0.18)" }}
        />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading shift data…</p>
      </div>
    );
  }

  const dutiesPct = Math.round((checkedDuties.length / DUTIES.length) * 100);
  const managerNextAction = (() => {
    if (activeStage === "start") {
      if (acknowledged) {
        return {
          label: "Move into Ops",
          detail: totals.critical > 0
            ? `${totals.critical} open item${totals.critical !== 1 ? "s" : ""} require awareness during the shift.`
            : "Shift intel is clear. Move into active management.",
          icon: Activity,
          tone: "text-primary",
          onClick: () => setActiveStage("run"),
        };
      }
      return {
        label: allCardsViewed ? "Acknowledge shift intel" : "Review shift intel",
        detail: allCardsViewed
          ? "All sections reviewed. Acknowledge to move into Ops."
          : `${viewedIntelCards.size}/${INTEL_CARD_IDS.length} sections reviewed before Ops.`,
        icon: Shield,
        tone: allCardsViewed ? "text-primary" : "text-muted-foreground",
        onClick: allCardsViewed ? acknowledgeBriefing : undefined,
      };
    }

    if (activeStage === "run") {
      if (!preShiftSaved) {
        return {
          label: "Save the pre-shift briefing",
          detail: "This is required before manager sign-off.",
          icon: Users,
          tone: "text-primary",
        };
      }
      if (checkedDuties.length < DUTIES.length) {
        return {
          label: "Work the manager duties",
          detail: `${DUTIES.length - checkedDuties.length} dut${DUTIES.length - checkedDuties.length !== 1 ? "ies" : "y"} left before sign-off.`,
          icon: ClipboardCheck,
          tone: "text-primary",
        };
      }
      return {
        label: "Prepare sign-off",
        detail: "Duties are complete. Review follow-ups and write the next handoff.",
        icon: LogOut,
        tone: "text-primary",
        onClick: () => setActiveStage("close"),
      };
    }

    if (shiftComplete) {
      return {
        label: "Shift complete",
        detail: "The next manager has a saved handoff.",
        icon: CheckCircle2,
        tone: "text-green-400",
      };
    }

    return {
      label: "Complete handoff",
      detail: `${debriefCompleteCount}/${debriefItems.length} follow-up items reviewed. Add notes before submitting.`,
      icon: LogOut,
      tone: debriefCompleteCount === debriefItems.length && handoffNotes.trim() ? "text-primary" : "text-muted-foreground",
      onClick: debriefCompleteCount === debriefItems.length && handoffNotes.trim() ? completeHandoff : undefined,
    };
  })();

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Shift" subtitle="Manager duties, shift intel, and handoff" />

      <ShiftMobileGuide
        eyebrow="Manager Shift"
        title={meta.label}
        stages={STAGE_CONFIG}
        activeStage={activeStage}
        onStageChange={(id) => { haptics.light(); setActiveStage(id); }}
        onRefresh={() => load({ quiet: true })}
        refreshing={refreshing}
        nextAction={activeStage === "close" ? managerNextAction : undefined}
        progress={activeStage === "start" ? undefined : {
          label: `${checkedDuties.length}/${DUTIES.length} duties`,
          value: dutiesPct,
          complete: dutiesPct === 100,
        }}
      />

      <ShiftStageNav
        stages={STAGE_CONFIG}
        activeStage={activeStage}
        onStageChange={(id) => { haptics.light(); setActiveStage(id); }}
        className="hidden lg:flex border-b border-border/20 bg-card/30 px-8 py-3 lg:mt-7"
        trailing={
          <>
            <span className={cn('text-xs font-bold', totals.critical > 0 ? 'text-amber-400/80' : 'text-muted-foreground')}>
              {totals.critical} critical
            </span>
            <span className={cn('text-xs font-bold', checkedDuties.length === DUTIES.length ? 'text-green-400' : 'text-muted-foreground')}>
              {checkedDuties.length}/{DUTIES.length} duties
            </span>
            <button
              type="button"
              onClick={() => load({ quiet: true })}
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-border/50 transition-all"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
            </button>
          </>
        }
      />

      {/* Stage content */}
      <div className="app-page lg:!pt-4">
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
                {/* Context banner — shared */}
                {needsSelection ? (
                  <BriefingProfileSelector profiles={candidateProfiles} onSelect={selectProfile} />
                ) : shiftContext ? (
                  <BriefingContextBanner
                    context={shiftContext}
                    counts={{ staff: briefing.staff.length, reservations: briefing.reservationsList.length, events: briefing.events.length, prepNeeds: briefing.prepNeeds.length, eightySix: briefing.eightySix.length, issues: briefing.issues.length, tasks: briefing.checklists.length }}
                    onReset={resetContext}
                  />
                ) : null}

                {/* ── MOBILE ── */}
                <div className="lg:hidden space-y-5">

                  {/* ─ Shift Intel ─ */}
                  <div className="liquid-card overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Shift Intel</p>
                        <p className="text-[13px] font-black text-foreground mt-0.5">
                          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {meta.label}
                        </p>
                      </div>
                      {/* Review progress dots */}
                      <div className="flex items-center gap-1">
                        {INTEL_CARD_IDS.map(cid => (
                          <div key={cid} className={cn('h-1.5 w-1.5 rounded-full transition-all duration-300', viewedIntelCards.has(cid) ? 'bg-green-400/70' : 'bg-white/[0.15]')} />
                        ))}
                      </div>
                    </div>

                    {/* Intel rows — accordion */}
                    {[
                      {
                        id: 'staff',
                        icon: Users,
                        label: 'Staff Scheduled',
                        count: briefing.staff.length,
                        emptyLabel: 'No schedule data',
                        accent: null,
                        detail: briefing.staff.length > 0 && (
                          <div className="space-y-2 px-4 pb-3 pt-1">
                            {briefing.staff.slice(0, 6).map((s, i) => (
                              <div key={s.id || i} className="flex items-center justify-between py-1">
                                <span className="text-[13px] font-semibold text-foreground">{s.employee_name || s.name || 'Staff'}</span>
                                <span className="text-[11px] text-muted-foreground">{[s.role, s.station].filter(Boolean).join(' · ')}</span>
                              </div>
                            ))}
                            {briefing.staff.length > 6 && <p className="text-[11px] text-muted-foreground">+{briefing.staff.length - 6} more</p>}
                          </div>
                        ),
                      },
                      {
                        id: 'eightySix',
                        icon: Flame,
                        label: "86'd Items",
                        count: briefing.eightySix.length,
                        emptyLabel: 'Nothing 86\'d',
                        accent: briefing.eightySix.length > 0 ? { color: 'text-red-400', bg: 'bg-red-500/12', border: 'border-red-500/20' } : null,
                        detail: briefing.eightySix.length > 0 && (
                          <div className="space-y-1.5 px-4 pb-3 pt-1">
                            {briefing.eightySix.map((item, i) => (
                              <div key={item.id || i} className="flex items-center gap-2.5 py-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-400/60 shrink-0" />
                                <span className="text-[13px] font-semibold text-foreground flex-1">{item.item_name}</span>
                                {item.category && <span className="text-[11px] text-muted-foreground">{item.category}</span>}
                              </div>
                            ))}
                          </div>
                        ),
                      },
                      {
                        id: 'events',
                        icon: CalendarClock,
                        label: 'Reservations & Events',
                        count: briefing.reservationsList.length + briefing.events.length,
                        emptyLabel: 'No reservations today',
                        accent: (briefing.reservationsList.length + briefing.events.length) > 0 ? { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' } : null,
                        detail: (briefing.events.length > 0 || briefing.reservationsList.length > 0) && (
                          <div className="space-y-2 px-4 pb-3 pt-1">
                            {[...briefing.events.slice(0,3), ...briefing.reservationsList.slice(0,3)].map((item, i) => (
                              <div key={item.id || i} className="flex items-start gap-2.5 py-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-400/60 shrink-0 mt-1.5" />
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-foreground leading-snug">{item.eventName || item.guest_name || item.name || 'Event'}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{[item.startTime || item.arrival_time, item.room, item.guestCount ? `${item.guestCount} guests` : item.party_size ? `${item.party_size} guests` : ''].filter(Boolean).join(' · ')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ),
                      },
                      {
                        id: 'issues',
                        icon: AlertTriangle,
                        label: 'Open Issues',
                        count: briefing.issues.length,
                        emptyLabel: 'All clear',
                        accent: briefing.issues.length > 0 ? { color: 'text-red-400', bg: 'bg-red-500/12', border: 'border-red-500/20' } : null,
                        detail: briefing.issues.length > 0 && (
                          <div className="space-y-1.5 px-4 pb-3 pt-1">
                            {briefing.issues.slice(0, 4).map((item, i) => (
                              <div key={item.id || i} className="flex items-start gap-2.5 py-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-400/70 shrink-0 mt-1.5" />
                                <p className="text-[13px] font-semibold text-foreground leading-snug flex-1">{item.title || item.description || 'Open issue'}</p>
                              </div>
                            ))}
                          </div>
                        ),
                      },
                      {
                        id: 'handoff',
                        icon: MessageSquareText,
                        label: 'Previous Handoff',
                        count: briefing.handoffs.length,
                        emptyLabel: 'No notes from last shift',
                        accent: null,
                        detail: briefing.handoffs.length > 0 && (
                          <div className="px-4 pb-3 pt-1 space-y-2">
                            {briefing.handoffs.slice(0, 2).map((item, i) => (
                              <p key={item.id || i} className="text-[13px] text-foreground leading-relaxed">{item.notes_for_next_manager || item.notes || 'Handoff note'}</p>
                            ))}
                          </div>
                        ),
                      },
                    ].map(({ id, icon: Icon, label, count, emptyLabel, accent, detail }, rowIdx, arr) => {
                      const isOpen = mobileIntelFocus === id;
                      const isLast = rowIdx === arr.length - 1;
                      return (
                        <div key={id}>
                          <button
                            type="button"
                            onClick={() => {
                              const next = isOpen ? null : id;
                              setMobileIntelFocus(next);
                              if (next) markCardViewed(id);
                            }}
                            className={cn(
                              'w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-white/[0.03]',
                              !isLast && 'border-b border-white/[0.06]'
                            )}
                          >
                            <Icon className={cn('h-[18px] w-[18px] shrink-0', accent ? accent.color : count > 0 ? 'text-foreground' : 'text-muted-foreground/50')} />
                            <span className={cn('flex-1 text-[15px] font-semibold', count > 0 ? 'text-foreground' : 'text-muted-foreground/60')}>{label}</span>
                            {count > 0 ? (
                              <span className={cn('text-[12px] font-bold px-2 py-0.5 rounded-full border', accent ? `${accent.bg} ${accent.color} ${accent.border}` : 'bg-white/[0.07] text-muted-foreground border-white/[0.08]')}>{count}</span>
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-400/50" />
                            )}
                            {detail && (
                              <ChevronRight className={cn('h-4 w-4 text-muted-foreground/30 transition-transform duration-200 ml-1', isOpen && 'rotate-90')} />
                            )}
                          </button>
                          {isOpen && detail && (
                            <div className="border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.025)' }}>
                              {detail}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ─ Briefing Notes (primary field) ─ */}
                  <div className="liquid-card overflow-hidden">
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your Briefing</p>
                        <p className="text-[13px] font-black text-foreground mt-0.5">What will you tell the team?</p>
                      </div>
                      {preShiftForm.notes.trim() && (
                        <span className="text-[11px] font-semibold text-green-400/80 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Written
                        </span>
                      )}
                    </div>
                    <textarea
                      value={preShiftForm.notes}
                      onChange={e => updatePreShiftField("notes", e.target.value)}
                      rows={5}
                      placeholder="Specials, priorities, staffing, anything the team needs to know before service starts…"
                      className="w-full px-4 pt-2 pb-4 resize-none bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/30 outline-none leading-relaxed"
                    />
                  </div>

                  {/* ─ Publish / Save ─ */}
                  <div className="space-y-2.5 pb-1">
                    {preShiftPublished ? (
                      <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-[14px] font-black text-green-400">Published to Staff</span>
                      </div>
                    ) : (
                      <button type="button" onClick={publishBriefing}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-black text-white bg-primary hover:bg-primary-dark active:scale-[0.97] transition-all">
                        Publish to Staff
                      </button>
                    )}

                    {preShiftPublished ? (
                      <button type="button" onClick={publishBriefing}
                        className="w-full py-2 text-center text-[13px] font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        Re-publish with changes
                      </button>
                    ) : (
                      <button type="button" onClick={savePreShift}
                        className="w-full py-2 text-center text-[13px] font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        Save Draft Only
                      </button>
                    )}
                  </div>

                  {/* ─ Pre-Shift Context (scope + auto-imported) ─ */}
                  <div className="liquid-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/[0.06]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pre-Shift Context</p>
                      <button type="button" onClick={() => load({ quiet: true })}
                        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                        <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} /> Refresh
                      </button>
                    </div>

                    {/* Shift scope */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/60">Shift Scope</p>
                      {candidateProfiles.length > 1 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {candidateProfiles.map(p => {
                            const isSelected = shiftContext?.profileId === p.id;
                            const roles = p.importRules?.staffRoles || [];
                            const cnt = roles.length > 0
                              ? briefing.allStaff.filter(s => roles.some(r => (s.role || '').toLowerCase().includes(r.toLowerCase()))).length
                              : briefing.allStaff.length;
                            return (
                              <button key={p.id} type="button"
                                onClick={() => { selectProfile(p); load({ quiet: true }); }}
                                className={cn('flex flex-col items-start rounded-2xl border px-3 py-2.5 text-left transition-all active:scale-[0.98]', isSelected ? 'border-primary/50 bg-primary/8' : 'border-white/[0.08]')}
                                style={isSelected ? { boxShadow: '0 0 8px rgba(255,107,0,0.15)' } : undefined}>
                                <span className={cn('text-[13px] font-black', isSelected ? 'text-primary' : 'text-foreground')}>{p.shortName || p.name}</span>
                                <span className="text-[11px] text-muted-foreground">{cnt} staff</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : shiftContext ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn('rounded-full border px-2.5 py-1 text-[13px] font-black',
                            shiftContext.department === 'foh'     ? 'border-blue-500/30 text-blue-400' :
                            shiftContext.department === 'boh'     ? 'border-amber-500/30 text-amber-400' :
                            shiftContext.department === 'bar'     ? 'border-teal-500/30 text-teal-400' :
                            shiftContext.department === 'banquet' ? 'border-cyan-500/30 text-cyan-400' :
                                                                     'border-primary/30 text-primary'
                          )}>{shiftContext.profileName}</span>
                          <button type="button" onClick={resetContext} className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Change</button>
                        </div>
                      ) : (
                        <p className="text-[13px] text-muted-foreground/50">No scope set — all house.</p>
                      )}
                    </div>

                    {/* Auto-imported accordion rows */}
                    {[
                      {
                        id: 'roles',
                        label: 'Roles & Assignments',
                        count: briefing.staff.length,
                        countCls: 'text-muted-foreground',
                        renderContent: () => briefing.staff.length === 0
                          ? <p className="text-[13px] text-muted-foreground/50">No shifts scheduled today</p>
                          : <div className="space-y-1.5">{briefing.staff.slice(0, 12).map((p, i) => (
                              <div key={p.id || i} className="flex items-center justify-between gap-2">
                                <span className="text-[13px] font-semibold text-foreground truncate">{p.employee_name}</span>
                                <span className="shrink-0 text-[11px] text-muted-foreground">{[p.role, p.station, p.start_time].filter(Boolean).join(' · ')}</span>
                              </div>
                            ))}{briefing.staff.length > 12 && <p className="text-[11px] text-muted-foreground/50">+{briefing.staff.length - 12} more</p>}</div>,
                      },
                      {
                        id: 'reservations',
                        label: 'Reservations / BEO',
                        count: briefing.events.length + briefing.reservationsList.length,
                        countCls: 'text-muted-foreground',
                        renderContent: () => briefing.events.length + briefing.reservationsList.length === 0
                          ? <p className="text-[13px] text-muted-foreground/50">No events or reservations today</p>
                          : <div className="space-y-1.5">
                              {briefing.events.map(e => (
                                <div key={e.id} className="flex items-start justify-between gap-2">
                                  <span className="text-[13px] font-semibold text-foreground">{e.eventName}</span>
                                  <span className="shrink-0 text-[11px] text-muted-foreground">{[e.startTime, e.room, e.guestCount ? `${e.guestCount} guests` : ''].filter(Boolean).join(' · ')}</span>
                                </div>
                              ))}
                              {briefing.reservationsList.map(r => (
                                <div key={r.id} className="flex items-start justify-between gap-2">
                                  <span className="text-[13px] font-semibold text-foreground">{r.guest_name || r.name || 'Reservation'}</span>
                                  <span className="shrink-0 text-[11px] text-muted-foreground">{[r.arrival_time || r.time, r.party_size ? `${r.party_size} pax` : ''].filter(Boolean).join(' · ')}</span>
                                </div>
                              ))}
                            </div>,
                      },
                      {
                        id: 'eightySix',
                        label: 'Out of Stock / 86',
                        count: briefing.eightySix.length,
                        countCls: briefing.eightySix.length > 0 ? 'text-red-400' : 'text-muted-foreground',
                        renderContent: () => briefing.eightySix.length === 0
                          ? <p className="text-[13px] text-muted-foreground/50 italic">All items available</p>
                          : <div className="space-y-1.5">{briefing.eightySix.map(i => (
                              <div key={i.id} className="flex items-center justify-between gap-2">
                                <span className="text-[13px] font-bold text-red-400">{i.item_name}</span>
                                <span className="shrink-0 text-[11px] text-muted-foreground">{i.category || i.notes || ''}</span>
                              </div>
                            ))}</div>,
                      },
                    ].map(row => (
                      <div key={row.id}>
                        <button type="button" onClick={() => toggleImportRow(row.id)}
                          className="flex w-full items-center gap-3 border-t border-white/[0.06] px-4 py-3.5 text-left transition-all active:bg-white/[0.02]">
                          <span className="flex-1 text-[15px] font-semibold text-foreground">{row.label}</span>
                          <span className={cn('text-[13px] font-black tabular-nums shrink-0', row.countCls)}>{row.count}</span>
                          <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform duration-200', expandedImportRows.has(row.id) && 'rotate-90')} />
                        </button>
                        {expandedImportRows.has(row.id) && (
                          <div className="border-t border-white/[0.04] px-4 pb-3 pt-2 space-y-1.5" style={{ background: 'rgba(255,255,255,0.025)' }}>
                            {row.renderContent()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ─ Pre-Shift Notes (dept fields) ─ */}
                  <div className={cn('liquid-card overflow-hidden', preShiftSaved && 'ring-1 ring-green-500/20')}>
                    <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Shift Notes</p>
                        <p className="text-[13px] font-black text-foreground mt-0.5">Briefing details by section</p>
                      </div>
                      {preShiftSaved && (
                        <span className="text-[11px] font-semibold text-green-400/80 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Saved
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 px-4 py-3">
                      {((() => {
                        const dept = shiftContext?.department || 'all';
                        const keys = FIELD_ORDER_BY_DEPT[dept] || FIELD_ORDER_BY_DEPT.all;
                        return keys.map(k => ({ field: k, ...PRE_SHIFT_FIELD_DEFS[k] }));
                      })()).map(({ field, label, rows, placeholder }) => (
                        <label key={field} className="block space-y-1.5">
                          <span className="text-[12px] font-black text-foreground/80">
                            {field === 'notes' ? 'Talking Points' : label}
                          </span>
                          <textarea
                            value={preShiftForm[field]}
                            onChange={e => updatePreShiftField(field, e.target.value)}
                            rows={field === 'notes' ? 4 : (rows || 2)}
                            placeholder={placeholder}
                            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/30 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/15 resize-none leading-relaxed"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ─ Continue to Running Shift ─ */}
                  {preShiftPublished && (
                    <button
                      type="button"
                      onClick={acknowledgeBriefing}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-black transition-all active:scale-[0.97]"
                      style={{
                        background: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        color: '#4ade80',
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Start the Shift
                    </button>
                  )}
                </div>

                {/* ── DESKTOP ── */}
                <div className="hidden lg:block">
                  {/* KPI strip */}
                  <div className="ops-metric-grid mb-4">
                    {[
                      { label: "Critical Items",  value: briefing.issues.length + briefing.eightySix.length, color: briefing.issues.length + briefing.eightySix.length > 0 ? "text-red-400" : "text-muted-foreground/30",   kickerText: briefing.issues.length + briefing.eightySix.length > 0 ? "Needs review" : "Clear",       kicker: briefing.issues.length + briefing.eightySix.length > 0 ? "text-red-400/70" : "text-muted-foreground/50" },
                      { label: "Events Today",    value: briefing.events.length,                              color: briefing.events.length > 0 ? "text-amber-400" : "text-muted-foreground/30",                              kickerText: briefing.events.length > 0 ? "Upcoming" : "None",                                       kicker: briefing.events.length > 0 ? "text-amber-400/70" : "text-muted-foreground/50" },
                      { label: "Follow-Ups",      value: briefing.managerLogs.length + briefing.tasks.length, color: briefing.managerLogs.length + briefing.tasks.length > 0 ? "text-foreground" : "text-muted-foreground/30", kickerText: "From last shift",                                                                       kicker: "text-muted-foreground/50" },
                      { label: "Intel Sections",  value: `${viewedIntelCards.size}/${INTEL_CARD_IDS.length}`, color: viewedIntelCards.size === INTEL_CARD_IDS.length ? "text-green-400" : "text-primary",                     kickerText: viewedIntelCards.size === INTEL_CARD_IDS.length ? "All reviewed" : "In progress",         kicker: viewedIntelCards.size === INTEL_CARD_IDS.length ? "text-green-400/70" : "text-primary/70" },
                    ].map(({ label, value, color, kicker, kickerText }) => (
                      <div key={label} className="ops-metric-card">
                        <span className={cn("ops-kicker", kicker)}>{kickerText}</span>
                        <p className={cn("ops-metric-value", color)}>{value}</p>
                        <p className="ops-metric-label">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Two-column: intel cards + sticky side panel */}
                  <div className="grid grid-cols-[1fr_296px] xl:grid-cols-[1fr_320px] gap-5 items-start">

                    {/* Left: Intel cards */}
                    <div className="space-y-3">
                      <div className="ops-section-header">
                        <div>
                          <p className="ops-kicker text-primary">Pre-Shift</p>
                          <h2 className="ops-section-title mt-0.5">Shift Intel</h2>
                        </div>
                        <span className="ops-section-meta">Open each card to review</span>
                      </div>
                      <IntelCard id="handoff" icon={MessageSquareText} label="Previous Handoff" count={briefing.handoffs.length} onViewed={markCardViewed}>
                        {briefing.handoffs.length === 0 ? <EmptyIntel text="No unresolved handoff notes." detail="No carry-over items from the previous shift." /> : briefing.handoffs.map(item => <IntelRow key={item.id} title={item.notes_for_next_manager || item.notes || "Handoff note"} meta={[item.department, item.urgency, item.logged_by].filter(Boolean).join(" — ")} />)}
                      </IntelCard>
                      <IntelCard id="issues" icon={AlertTriangle} label="Open Issues" count={briefing.issues.length} severity={briefing.issues.length > 0 ? "critical" : "neutral"} onViewed={markCardViewed}>
                        {briefing.issues.length === 0 ? <EmptyIntel text="No open issues — clear to go." /> : briefing.issues.map(item => <IntelRow key={item.id} title={item.title || item.description || "Open issue"} meta={[friendlyLogCategory(item.category), item.priority, item.area || item.station || item.location].filter(Boolean).join(" · ")} severity="critical" />)}
                      </IntelCard>
                      <IntelCard id="eightySix" icon={Flame} label="86'd Items" count={briefing.eightySix.length} severity={briefing.eightySix.length > 0 ? "critical" : "neutral"} onViewed={markCardViewed}>
                        {briefing.eightySix.length === 0 ? <EmptyIntel text="Nothing 86'd right now." detail="All menu items available." /> : briefing.eightySix.map(item => <IntelRow key={item.id} title={item.item_name} meta={item.category || item.notes} severity="critical" />)}
                      </IntelCard>
                      <IntelCard id="events" icon={CalendarClock} label="BEOs / Events" count={briefing.events.length} severity={briefing.events.length > 0 ? "warning" : "neutral"} onViewed={markCardViewed}>
                        {briefing.events.length === 0 ? <EmptyIntel text="No events or private dining today." /> : briefing.events.map(item => <IntelRow key={item.id} title={item.eventName} meta={[item.eventDate, item.startTime, item.room, item.guestCount ? `${item.guestCount} guests` : ""].filter(Boolean).join(" · ")} severity="warning" />)}
                      </IntelCard>
                      <IntelCard id="logs" icon={Store} label="Manager Logs & Waste" count={briefing.managerLogs.length + briefing.waste.length} onViewed={markCardViewed}>
                        {[...briefing.managerLogs, ...briefing.waste].length === 0 ? <EmptyIntel text="No manager notes or waste entries." detail="Nothing logged for this shift yet." /> : [...briefing.managerLogs, ...briefing.waste].slice(0, 6).map(item => <IntelRow key={`${item.id}-${recentDate(item)}`} title={titleFor(item, "Shift note")} meta={[friendlyLogCategory(item.category || item.reason), recentDate(item)].filter(Boolean).join(" · ")} />)}
                      </IntelCard>
                    </div>

                    {/* Right: Sticky action panel */}
                    <div className="sticky top-[120px] space-y-3">
                      <div className={cn("liquid-card p-4", acknowledged && "liquid-card-success")}>
                        <div className="flex items-start gap-3">
                          {acknowledged ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400 mt-0.5" /> : <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-foreground">
                              {acknowledged ? "Shift intel reviewed" : "Acknowledge shift intel"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                              {acknowledged
                                ? totals.critical > 0 ? `${totals.critical} item${totals.critical !== 1 ? 's' : ''} remain open — monitor during shift.` : "Shift intel reviewed — you're on."
                                : "Open all 5 intel cards, then acknowledge to move into Ops."}
                            </p>
                          </div>
                          {acknowledged && <CheckCircle2 className="h-4 w-4 text-green-400/70 shrink-0" />}
                        </div>
                        {!acknowledged && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className={cn("text-[10px] font-black uppercase tracking-wide", allCardsViewed ? "text-green-400" : "text-muted-foreground/60")}>
                                {viewedIntelCards.size}/{INTEL_CARD_IDS.length} sections reviewed
                              </p>
                              <div className="flex gap-1">
                                {INTEL_CARD_IDS.map(cid => (
                                  <div key={cid} className={cn("h-1 w-5 rounded-full transition-all duration-300", viewedIntelCards.has(cid) ? "bg-green-400/70" : "bg-border/40")} />
                                ))}
                              </div>
                            </div>
                            <button type="button" onClick={acknowledgeBriefing} disabled={!allCardsViewed}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white transition-all active:scale-[0.98] disabled:opacity-40"
                              style={allCardsViewed ? { background: "hsl(var(--primary))", border: "1px solid hsl(var(--primary))", color: "#fff" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                              <Shield className="h-4 w-4" />
                              {allCardsViewed ? "Acknowledge & Start Shift" : "Review all sections to continue"}
                            </button>
                          </div>
                        )}
                        {acknowledged && (
                          <button type="button" onClick={() => setActiveStage("run")}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/8 py-2.5 text-sm font-black text-primary transition-all active:scale-[0.98]">
                            <Activity className="h-4 w-4" /> Move to Ops
                          </button>
                        )}
                      </div>

                      {/* Shift snapshot */}
                      <div className="liquid-card">
                        <div className="px-4 py-3 border-b border-border/30">
                          <h2 className="text-sm font-black text-foreground">Shift Snapshot</h2>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="divide-y divide-border/20">
                          {[
                            { icon: Users,            label: "Staff on Shift",     value: briefing.staff.length,                              color: briefing.staff.length > 0 ? "text-foreground" : "text-muted-foreground/30" },
                            { icon: Flame,            label: "86'd Items",         value: briefing.eightySix.length,                          color: briefing.eightySix.length > 0 ? "text-red-400" : "text-muted-foreground/30" },
                            { icon: CalendarClock,    label: "Events / BEOs",      value: briefing.events.length,                             color: briefing.events.length > 0 ? "text-amber-400" : "text-muted-foreground/30" },
                            { icon: AlertTriangle,    label: "Open Issues",        value: briefing.issues.length,                             color: briefing.issues.length > 0 ? "text-red-400" : "text-muted-foreground/30" },
                            { icon: MessageSquareText, label: "Manager Follow-Ups", value: briefing.managerLogs.length + briefing.tasks.length, color: briefing.managerLogs.length + briefing.tasks.length > 0 ? "text-foreground" : "text-muted-foreground/30" },
                          ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="flex items-center gap-3 px-4 py-2.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-semibold text-foreground flex-1">{label}</span>
                              <span className={cn("text-sm font-black", color)}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── OPS ────────────────────────────────────────────────── */}
            {activeStage === "run" && (
              <>
                {/* ── MOBILE RUN ── */}
                <div className="lg:hidden">

                  {/* Shift Health Pulse Card */}
                  <div
                    className="liquid-card mb-3 p-5 overflow-hidden border-primary/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary mb-1">Shift Health</p>
                        <p className="text-[42px] font-black leading-none text-foreground tabular-nums">
                          {dutiesPct}<span className="text-primary text-2xl">%</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dutiesPct === 100 ? 'All duties complete' : dutiesPct > 50 ? 'On Track' : 'In Progress'}
                        </p>
                      </div>
                      <div
                        className="p-2.5 rounded-2xl border border-primary/25 bg-primary/10"
                      >
                        <Activity
                          className="h-5 w-5 text-primary"
                        />
                      </div>
                    </div>

                    {/* Animated heartbeat SVG */}
                    <div className="h-16 w-full">
                      <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                        {/* Faint static trace */}
                        <path
                          d="M0,45 L35,45 L45,12 L55,52 L65,45 L100,45 L112,8 L122,55 L132,45 L200,45"
                          fill="none"
                          stroke="rgba(255,107,0,0.18)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Animated drawing path */}
                        <path
                          d="M0,45 L35,45 L45,12 L55,52 L65,45 L100,45 L112,8 L122,55 L132,45 L200,45"
                          fill="none"
                          stroke="rgba(255,107,0,0.85)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            strokeDasharray: 1000,
                            strokeDashoffset: 1000,
                            animation: 'heartbeatDraw 3s linear infinite',
                          }}
                        />
                      </svg>
                    </div>

                    {/* Mini stats */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="liquid-card p-3 border border-border/50">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Duties Done</p>
                        <p className="text-lg font-black text-foreground">
                          {checkedDuties.length}<span className="text-muted-foreground/50 text-sm font-semibold">/{DUTIES.length}</span>
                        </p>
                      </div>
                      <div className="liquid-card p-3 border border-border/50">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Open Issues</p>
                        <p className={cn('text-lg font-black', totals.critical > 0 ? 'text-red-400' : 'text-muted-foreground/30')}>
                          {totals.critical}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Running tasks swipeable container */}
                  <div
                    ref={runScrollRef}
                    onScroll={handleRunScroll}
                    className="flex snap-x snap-mandatory overflow-x-auto"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {/* ─ Page 3: Running Tasks (duty checklist) ─ */}
                    <div className="w-full shrink-0 snap-center">
                      <div
                        className="liquid-card overflow-hidden"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pt-4 pb-3">
                          <div className="flex items-center gap-2.5">
                            <Target className="h-4 w-4 text-primary" />
                            <p className="text-sm font-black text-foreground">Shift Duties</p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className={cn("text-sm font-black tabular-nums", dutiesPct === 100 ? "text-green-400" : "text-foreground")}>
                              {checkedDuties.length}/{DUTIES.length}
                            </span>
                            {dutiesPct === 100 && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="px-4 pb-3">
                          <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
                            <motion.div
                              className="h-full rounded-full"
                              animate={{ width: `${dutiesPct}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              style={{
                                background: dutiesPct === 100
                                  ? "rgb(34, 197, 94)"
                                  : "hsl(var(--primary))",
                              }}
                            />
                          </div>
                        </div>

                        {/* Duty list */}
                        <div className="space-y-2 border-t border-border/20 px-3 pb-3 pt-3">
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

                        {/* Quick nav + admin note */}
                        <div className="border-t border-border/15 px-3 pb-3 pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Floor Map",  sub: "Station readiness", path: "/operational-map", icon: MapPin },
                              { label: "Approvals",  sub: "Pending reviews",   path: "/approvals",       icon: ClipboardCheck },
                            ].map(({ label, sub, path, icon: Icon }) => (
                              <button
                                key={path}
                                type="button"
                                onClick={() => navigate(path)}
                                className="flex items-center justify-between gap-2 rounded-2xl border border-border/40 px-3 py-2.5 text-left transition-all active:scale-[0.98]"
                                style={{ background: "hsl(var(--input))" }}
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <Icon className="h-3 w-3 text-primary" />
                                    <span className="text-xs font-black text-foreground">{label}</span>
                                  </div>
                                  <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
                                </div>
                                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                              </button>
                            ))}
                          </div>
                          <p className="text-center text-[10px] text-muted-foreground/40">
                            Tasks customizable by Admin / GM in Settings
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pagination dots — 3 pages */}
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {[0, 1, 2].map(i => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goToRunPage(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === runPage ? "w-5 bg-primary" : "w-1.5 bg-border/50 hover:bg-border"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* ── DESKTOP RUN ── */}
                <ManagerShiftDesktopRun
                  shiftContext={shiftContext}
                  candidateProfiles={candidateProfiles}
                  selectProfile={selectProfile}
                  resetContext={resetContext}
                  briefing={briefing}
                  preShiftForm={preShiftForm}
                  updatePreShiftField={updatePreShiftField}
                  preShiftSaved={preShiftSaved}
                  preShiftPublished={preShiftPublished}
                  savePreShift={savePreShift}
                  publishBriefing={publishBriefing}
                  refreshing={refreshing}
                  load={load}
                  DUTIES_CONFIG={DUTIES_CONFIG}
                  checkedDuties={checkedDuties}
                  toggleDuty={toggleDuty}
                  dutiesPct={dutiesPct}
                  xpFloats={xpFloats}
                  setXpFloats={setXpFloats}
                />
              </>
            )}

            {/* ── DEBRIEF ────────────────────────────────────────────── */}
            {activeStage === "close" && (() => {
               return (
               <>
                 <ManagerShiftMobileClose
                  debriefItems={debriefItems}
                  debriefReviews={debriefReviews}
                  updateDebriefReview={updateDebriefReview}
                  debriefCompleteCount={debriefCompleteCount}
                  handoffNotes={handoffNotes}
                  setHandoffNotes={setHandoffNotes}
                  submitting={submitting}
                  completeHandoff={completeHandoff}
                  closeFilterTab={closeFilterTab}
                  setCloseFilterTab={setCloseFilterTab}
                />

                <ManagerShiftDebriefDesktop
                  debriefItems={debriefItems}
                  debriefReviews={debriefReviews}
                  updateDebriefReview={updateDebriefReview}
                  debriefCompleteCount={debriefCompleteCount}
                  handoffNotes={handoffNotes}
                  setHandoffNotes={setHandoffNotes}
                  briefing={briefing}
                  submitting={submitting}
                  completeHandoff={completeHandoff}
                />
              </>
              );
            })()}

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