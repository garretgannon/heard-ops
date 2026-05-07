import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUnifiedState } from "@/lib/UnifiedStateContext";
import { useShiftMode } from "@/lib/ShiftModeContext";
import {
  AlertTriangle, Clock, CheckCircle2, Zap, FileText, Thermometer,
  Wind, Snowflake, Flame, Bell, CalendarDays, Play, X, TrendingUp,
  ClipboardList, Activity, ChevronRight, AlertCircle, ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import { useToast } from "@/hooks/useToast";
import DailyEventsCard from "@/components/reservations/DailyEventsCard";
import ActiveShiftCard from "@/components/ActiveShiftCard";
import RoleAwareQuickActions from "@/components/RoleAwareQuickActions";
import RoleAwareQuickActionModals from "@/components/RoleAwareQuickActionModals";
import StartShiftModal from "@/components/ShiftMode/StartShiftModal";
import SetupChecklist from "@/components/ShiftMode/SetupChecklist";
import CloseShiftModal from "@/components/ShiftMode/CloseShiftModal";
import ShiftLaunchModal from "@/components/ShiftLaunch/ShiftLaunchModal";
import RoleBasedLauncher from "@/components/ShiftLaunch/RoleBasedLauncher";

const cache = { data: null, ts: 0 };
const CACHE_TTL = 30_000;

// ── Sub-components ──────────────────────────────────────────────

function SectionLabel({ label, icon: Icon, count, action, onAction }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-primary shrink-0" />}
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-1">{label}</h2>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-foreground">{count}</span>
      )}
      {action && (
        <button onClick={onAction} className="text-[10px] font-bold text-primary hover:underline">{action}</button>
      )}
    </div>
  );
}

function AttentionCard({ icon: Icon, iconColor, iconBg, title, meta, status, statusColor, onTap }) {
  return (
    <button
      onClick={() => { haptics.medium(); onTap?.(); }}
      className="w-full text-left bg-card border-l-4 border-l-red-500 border border-border/60 rounded-lg px-3 py-2.5 flex items-center gap-2.5 active:scale-[0.98] transition-all duration-100 hover:border-border"
    >
      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-3.5 w-3.5 stroke-[1.5]", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{title}</p>
        {meta && <p className="text-[10px] text-muted-foreground truncate">{meta}</p>}
      </div>
      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0", statusColor)}>{status}</span>
    </button>
  );
}

function DueSoonCard({ title, meta, progress, onTap }) {
  return (
    <button
      onClick={() => { haptics.light(); onTap?.(); }}
      className="w-full text-left bg-card border-l-4 border-l-amber-500 border border-border/60 rounded-lg px-3 py-2.5 active:scale-[0.98] transition-all hover:border-border"
    >
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md bg-amber-500/15 flex items-center justify-center shrink-0">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{title}</p>
          {meta && <p className="text-[10px] text-muted-foreground truncate">{meta}</p>}
        </div>
        {progress !== undefined && (
          <span className="text-[10px] font-bold text-amber-400 shrink-0">{progress}%</span>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </button>
  );
}

function CompletedCard({ title, completedBy, completedAt }) {
  return (
    <div className="bg-card border border-border/40 rounded-lg px-3 py-2 flex items-center gap-2">
      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{title}</p>
        {(completedBy || completedAt) && (
          <p className="text-[9px] text-muted-foreground">
            {completedBy}{completedBy && completedAt && " · "}{completedAt}
          </p>
        )}
      </div>
    </div>
  );
}

function ShiftNotesCard({ note, manager, onTap }) {
  return (
    <button
      onClick={() => { haptics.light(); onTap?.(); }}
      className="w-full text-left bg-card border border-border/60 rounded-xl p-3.5 active:scale-[0.98] transition-all hover:border-border group"
    >
      <div className="flex items-start gap-2 mb-3">
        <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shift Notes</p>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto group-hover:text-foreground transition-colors" />
      </div>
      <p className="text-sm italic text-foreground leading-relaxed line-clamp-3">"{note}"</p>
      {manager && <p className="text-[10px] text-muted-foreground mt-2">— {manager}</p>}
      <div className="mt-3 text-[10px] font-bold text-blue-400 border-t border-border/40 pt-2.5">
        View Full Handoff →
      </div>
    </button>
  );
}

function FoodSafetyCard({ tempSafety, onTap }) {
  const hasIssues =
    tempSafety.cooling.failed > 0 ||
    tempSafety.refrig.outOfRange > 0 ||
    tempSafety.hot.outOfRange > 0;

  const rows = [
    { Icon: Wind, color: "text-blue-400", bg: "bg-blue-500/10", label: "Cooling", count: tempSafety.cooling.total, issues: tempSafety.cooling.failed, issueLabel: "failed" },
    { Icon: Snowflake, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Fridge / Freezer", count: tempSafety.refrig.total, issues: tempSafety.refrig.outOfRange, issueLabel: "OOR" },
    { Icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10", label: "Hot Holding", count: tempSafety.hot.total, issues: tempSafety.hot.outOfRange, issueLabel: "OOR" },
  ];

  return (
    <button
      onClick={() => { haptics.light(); onTap?.(); }}
      className={cn(
        "w-full text-left bg-card border rounded-xl p-3.5 active:scale-[0.98] transition-all hover:border-border",
        hasIssues ? "border-red-500/40" : "border-border/60"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Thermometer className={cn("h-3.5 w-3.5 shrink-0", hasIssues ? "text-red-400" : "text-primary")} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-1">Food Safety</p>
        {hasIssues && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
            Issues
          </span>
        )}
      </div>
      <div className="space-y-2">
        {rows.map(({ Icon, color, bg, label, count, issues, issueLabel }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("h-3 w-3", color)} />
            </div>
            <p className="text-xs text-muted-foreground flex-1">{label}</p>
            <p className="text-xs font-bold text-foreground">{count} logged</p>
            {issues > 0 && (
              <span className="text-[9px] font-bold text-red-400 ml-1">{issues} {issueLabel}</span>
            )}
          </div>
        ))}
      </div>
    </button>
  );
}

// Desktop-only compact shift control card
function DesktopShiftControlCard({
  currentShift, completionPct, overdueCount, dueCount, reviewCount,
  onViewPlan, onEndShift, onStartShift, onReopen,
}) {
  const shiftLabel = currentShift?.shift_type
    ? currentShift.shift_type.charAt(0).toUpperCase() + currentShift.shift_type.slice(1) + " Shift"
    : "Current Shift";

  const elapsed = (() => {
    if (!currentShift?.created_date) return null;
    const ms = Date.now() - new Date(currentShift.created_date).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  })();

  if (!currentShift) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shift Status</p>
        </div>
        <p className="text-sm text-muted-foreground">No active shift</p>
        <button
          onClick={onStartShift}
          className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Zap className="h-4 w-4" />
          Start Shift
        </button>
      </div>
    );
  }

  if (currentShift.status === "setup") {
    return (
      <div className="bg-card border border-amber-500/30 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-400">Completing Setup…</p>
      </div>
    );
  }

  if (currentShift.status === "closed" || currentShift.status === "completed") {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
        <p className="text-xs text-muted-foreground">Shift ended</p>
        <div className="flex gap-2">
          <button onClick={onReopen} className="flex-1 h-8 rounded-lg border border-border bg-muted text-foreground font-bold text-xs active:scale-95">Reopen</button>
          <button onClick={onViewPlan} className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs active:scale-95">View Plan</button>
        </div>
      </div>
    );
  }

  // running
  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <p className="text-xs font-bold text-green-400 uppercase tracking-wide">Active</p>
          </div>
          <p className="text-sm font-bold text-foreground">{shiftLabel}</p>
          {elapsed && <p className="text-[11px] text-muted-foreground mt-0.5">{elapsed} elapsed</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold text-primary">{completionPct}%</p>
          <p className="text-[10px] text-muted-foreground">complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${completionPct}%` }}
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "text-red-400" : "text-muted-foreground" },
          { label: "Due Soon", value: dueCount, color: dueCount > 0 ? "text-amber-400" : "text-muted-foreground" },
          { label: "Open Issues", value: reviewCount, color: reviewCount > 0 ? "text-purple-400" : "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center bg-muted/50 rounded-lg py-2">
            <p className={cn("text-base font-extrabold", color)}>{value}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="space-y-2">
        <button
          onClick={onViewPlan}
          className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <ListTodo className="h-4 w-4" />
          View Plan
        </button>
        <button
          onClick={onEndShift}
          className="w-full h-8 rounded-lg border border-border bg-transparent text-muted-foreground font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          End Shift
        </button>
      </div>
    </div>
  );
}

// Desktop page header
function DesktopPageHeader({ currentShift, onNotifications, onViewPlan }) {
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const shiftLabel = currentShift?.status === "running"
    ? (currentShift.shift_type
        ? currentShift.shift_type.charAt(0).toUpperCase() + currentShift.shift_type.slice(1) + " Shift"
        : "Shift Active")
    : null;

  return (
    <div className="hidden lg:flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-extrabold text-foreground">Today</h1>
          {shiftLabel && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
              {shiftLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onViewPlan}
          className="h-8 px-3 rounded-lg border border-border bg-card text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted transition-all active:scale-95"
        >
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          Today's Plan
        </button>
        <button
          onClick={onNotifications}
          className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-all active:scale-95"
        >
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lastCompletedAction, recordAction, setActiveTab } = useUnifiedState();
  const { currentShift, markSetupComplete, reopenShift } = useShiftMode();
  const { isAdmin } = useCurrentUser();
  const [data, setData] = useState(cache.data);
  const [loading, setLoading] = useState(!cache.data);
  const isMounted = useRef(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [shiftLaunched, setShiftLaunched] = useState(false);
  const [pullRefresh, setPullRefresh] = useState(0);
  const scrollRef = useRef(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    if (scrollTop <= 0) setPullRefresh(Math.min(100, Math.abs(scrollTop) * 0.5));
  };
  const handleTouchEnd = () => {
    if (pullRefresh > 50) {
      haptics.medium();
      setData(prev => prev ? { ...prev } : null);
    }
    setPullRefresh(0);
  };

  useEffect(() => {
    isMounted.current = true;
    if (isAdmin && currentShift?.status === "running" && !shiftLaunched) setShiftLaunched(true);
    const set = (updater) => { if (isMounted.current) setData(updater); };

    if (cache.data && Date.now() - cache.ts < CACHE_TTL) setLoading(false);

    const loadPrimary = async () => {
      try {
        const [prepItems, sideWork, issues] = await Promise.all([
          base44.entities.PrepItem.list("-updated_date", 100).catch(() => []),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }).catch(() => []),
          base44.entities.Issue.filter({ status: "open" }).catch(() => []),
        ]);

        const overdue = [
          ...prepItems.filter(i => i.status === "overdue").map(i => ({ type: "prep", id: i.id, title: i.name, station: i.station_name, assignee: i.completed_by })),
          ...sideWork.filter(t => t.status === "overdue").map(t => ({ type: "sidework", id: t.id, title: t.task_name, station: t.role, assignee: t.assigned_to_name })),
        ];

        const dueSoon = [
          ...prepItems.filter(i => i.status === "in_progress" && i.due_time).map(i => ({ type: "prep", id: i.id, title: i.name, station: i.station_name, assignee: i.completed_by, progress: i.quantity ? Math.round(((i.completed_qty || 0) / i.quantity) * 100) : 0 })),
          ...sideWork.filter(t => ["pending", "in_progress"].includes(t.status)).map(t => ({ type: "sidework", id: t.id, title: t.task_name, station: t.role, assignee: t.assigned_to_name, progress: 50 })),
        ];

        const completed = [
          ...prepItems.filter(i => i.status === "approved").slice(-3).map(i => ({ title: i.name, completedBy: i.approved_by, completedAt: i.approved_at ? new Date(i.approved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null })),
          ...sideWork.filter(t => t.status === "approved").slice(-3).map(t => ({ title: t.task_name, completedBy: t.approved_by, completedAt: t.approved_at ? new Date(t.approved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null })),
        ].slice(0, 3);

        const totalTasks = prepItems.length + sideWork.length;
        const completedTasks = prepItems.filter(i => ["completed", "approved"].includes(i.status)).length + sideWork.filter(t => ["completed", "approved"].includes(t.status)).length;
        const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const next = { ...(cache.data || {}), overdue, dueSoon, completed, completionPct, needsReview: issues.filter(i => i.status === "open").length };
        cache.data = next; cache.ts = Date.now();
        set(() => next);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    const loadSecondary = async () => {
      try {
        const [handoffs, coolingLogs, refrigLogs, hotLogs] = await Promise.all([
          base44.entities.ShiftHandoff.list("-created_date", 1).catch(() => []),
          base44.entities.CoolingLog.filter({ date: todayStr }).catch(() => []),
          base44.entities.RefrigeratorFreezerLog.filter({ date: todayStr }).catch(() => []),
          base44.entities.HotHoldingLog.filter({ date: todayStr }).catch(() => []),
        ]);
        set(prev => {
          if (!prev) return prev;
          const next = {
            ...prev,
            latestHandoff: handoffs?.[0],
            tempSafety: {
              cooling: { total: coolingLogs.length, failed: coolingLogs.filter(l => ["failed", "corrective_action_required"].includes(l.status)).length },
              refrig: { total: refrigLogs.length, outOfRange: refrigLogs.filter(l => l.isOutOfRange).length },
              hot: { total: hotLogs.length, outOfRange: hotLogs.filter(l => l.isOutOfRange).length },
            },
          };
          cache.data = next;
          return next;
        });
      } catch (e) { console.error(e); }
    };

    loadPrimary().then(() => loadSecondary());

    const unsubs = [
      base44.entities.PrepItem.subscribe((event) => { if (["create","update","delete"].includes(event.type)) loadPrimary(); }),
      base44.entities.SideWorkAssignment.subscribe((event) => { if (["create","update","delete"].includes(event.type)) loadPrimary(); }),
      base44.entities.Issue.subscribe((event) => { if (["create","update","delete"].includes(event.type)) loadPrimary(); }),
    ];
    return () => { isMounted.current = false; unsubs.forEach(u => u?.()); };
  }, [todayStr]);

  useEffect(() => {
    if (lastCompletedAction && lastCompletedAction.type !== "init") setActiveTab("/");
  }, [lastCompletedAction]);

  const handleCloseModal = () => setActiveModal(null);
  const handleModalSuccess = () => {
    setTimeout(async () => {
      const [prepItems, sideWork, issues] = await Promise.all([
        base44.entities.PrepItem.list("-updated_date", 100).catch(() => []),
        base44.entities.SideWorkAssignment.filter({ date: todayStr }).catch(() => []),
        base44.entities.Issue.filter({ status: "open" }).catch(() => []),
      ]);
      const completionPct = prepItems.length > 0
        ? Math.round((prepItems.filter(i => ["completed","approved"].includes(i.status)).length / prepItems.length) * 100)
        : 0;
      setData(prev => ({ ...prev, overdue: prepItems.filter(i=>i.status==="overdue").slice(0,5), completionPct }));
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-10 text-muted-foreground text-sm">Failed to load</div>;

  if (showLaunchModal && !isAdmin) {
    return (
      <div className="pb-32">
        <RoleBasedLauncher
          isOpen={showLaunchModal}
          onClose={() => setShowLaunchModal(false)}
          onComplete={async () => { haptics.medium?.(); setShiftLaunched(true); setShowLaunchModal(false); }}
        />
      </div>
    );
  }

  const isDashboardLocked = currentShift?.status === "running" && !shiftLaunched;
  const urgencyCount = (data.overdue?.length || 0) + (data.needsReview || 0);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onTouchEnd={handleTouchEnd}
      className={cn("pb-32 lg:overflow-auto", isDashboardLocked && "opacity-50 pointer-events-none")}
      style={{ maxHeight: "calc(100vh - 52px)", overscrollBehavior: "contain" }}
    >
      {/* Pull-to-refresh indicator */}
      {pullRefresh > 0 && (
        <div className="sticky top-0 z-30 flex items-center justify-center h-10 bg-primary/10">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent transition-transform"
            style={{ transform: `rotate(${pullRefresh * 3.6}deg)` }} />
        </div>
      )}

      {/* ── Desktop Page Header ── */}
      <DesktopPageHeader
        currentShift={currentShift}
        onNotifications={() => navigate("/logs")}
        onViewPlan={() => navigate("/shift-handoff")}
      />

      {/* ── Mobile Header (original CommandCenter header for mobile) ── */}
      <div className="lg:hidden">
        {/* Mobile shift controls */}
        <div className="px-4 py-3 space-y-2 border-b border-border">
          {isDashboardLocked && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
              <p className="text-xs font-bold text-amber-400">Complete Shift Launch to enable operations</p>
            </div>
          )}
          {isAdmin && (
            <div className="space-y-2">
              {!currentShift ? (
                <button onClick={() => setShowStartModal(true)}
                  className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Zap className="h-4 w-4" /> Start Shift
                </button>
              ) : currentShift.status === "setup" ? (
                <button disabled className="w-full h-9 rounded-lg bg-primary/50 text-primary-foreground font-bold text-sm cursor-not-allowed">
                  Completing Setup...
                </button>
              ) : currentShift.status === "running" ? (
                <ActiveShiftCard
                  shift={currentShift}
                  completionPct={data?.completionPct || 0}
                  overdueCount={data?.overdue?.length || 0}
                  dueCount={data?.dueSoon?.length || 0}
                  reviewCount={data?.needsReview || 0}
                  criticalAlertCount={0}
                  onViewPlan={() => navigate("/shift-handoff")}
                  onEndShift={() => setShowCloseModal(true)}
                />
              ) : (currentShift.status === "closed" || currentShift.status === "completed") ? (
                <div className="flex gap-2">
                  <button onClick={async () => { haptics.medium(); await reopenShift(currentShift.id); window.location.reload(); }}
                    className="flex-1 h-9 rounded-lg border border-border bg-muted text-foreground font-bold text-sm active:scale-95 transition-all">
                    Reopen
                  </button>
                  <button onClick={() => navigate("/more")}
                    className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all">
                    Edit
                  </button>
                </div>
              ) : null}
              {currentShift?.status === "running" && shiftLaunched && (
                <RoleAwareQuickActions onActionClick={setActiveModal} />
              )}
            </div>
          )}
        </div>

        {/* Mobile content — stacked single column */}
        <div className="px-4 py-4 space-y-5">
          {data.overdue.length > 0 && (
            <div>
              <SectionLabel label="Needs Attention" icon={AlertTriangle} count={data.overdue.length} />
              <div className="space-y-2">
                {data.overdue.slice(0, 3).map(item => (
                  <AttentionCard key={item.id} icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-500/15"
                    title={item.title} meta={item.station} status="OVERDUE"
                    statusColor="bg-red-500/15 text-red-400 border-red-500/30"
                    onTap={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")} />
                ))}
              </div>
            </div>
          )}
          {data.dueSoon.length > 0 && (
            <div>
              <SectionLabel label="Due Soon" icon={Clock} count={data.dueSoon.length} />
              <div className="space-y-2">
                {data.dueSoon.slice(0, 3).map(item => (
                  <DueSoonCard key={item.id} title={item.title} meta={item.station} progress={item.progress}
                    onTap={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")} />
                ))}
              </div>
            </div>
          )}
          <DailyEventsCard />
          {data.latestHandoff && (
            <ShiftNotesCard
              note={data.latestHandoff.key_notes || "No shift notes available."}
              manager={data.latestHandoff.from_manager_name}
              onTap={() => navigate("/shift-handoff")}
            />
          )}
          {data.tempSafety && (
            <FoodSafetyCard tempSafety={data.tempSafety} onTap={() => navigate("/temp-logs")} />
          )}
          {data.completed.length > 0 && (
            <div>
              <SectionLabel label="Recently Completed" icon={CheckCircle2} count={data.completed.length} />
              <div className="space-y-1.5">
                {data.completed.slice(0, 2).map((item, i) => (
                  <CompletedCard key={i} title={item.title} completedBy={item.completedBy} completedAt={item.completedAt} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop 3-Column Layout ── */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr_300px] lg:gap-5 lg:px-6 lg:py-5 lg:items-start">

        {/* LEFT: Shift Control */}
        <div className="space-y-4">
          {isAdmin && (
            <DesktopShiftControlCard
              currentShift={currentShift}
              completionPct={data?.completionPct || 0}
              overdueCount={data?.overdue?.length || 0}
              dueCount={data?.dueSoon?.length || 0}
              reviewCount={data?.needsReview || 0}
              onViewPlan={() => navigate("/shift-handoff")}
              onEndShift={() => setShowCloseModal(true)}
              onStartShift={() => setShowStartModal(true)}
              onReopen={async () => { haptics.medium(); await reopenShift(currentShift?.id); window.location.reload(); }}
            />
          )}

          {/* Recently Completed on desktop (left col, below shift card) */}
          {data.completed.length > 0 && (
            <div>
              <SectionLabel label="Recently Completed" icon={CheckCircle2} count={data.completed.length} />
              <div className="space-y-1.5">
                {data.completed.slice(0, 3).map((item, i) => (
                  <CompletedCard key={i} title={item.title} completedBy={item.completedBy} completedAt={item.completedAt} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Needs Attention + Quick Actions + Due Soon + Events */}
        <div className="space-y-5 min-w-0">
          {/* Needs Attention — highest priority */}
          {(data.overdue.length > 0 || data.needsReview > 0) && (
            <div>
              <SectionLabel
                label="Needs Attention"
                icon={AlertTriangle}
                count={urgencyCount}
                action={data.overdue.length > 3 ? `View all ${data.overdue.length}` : undefined}
                onAction={() => navigate("/tasks")}
              />
              <div className="space-y-2">
                {data.overdue.slice(0, 4).map(item => (
                  <AttentionCard key={item.id} icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-500/15"
                    title={item.title} meta={item.station} status="OVERDUE"
                    statusColor="bg-red-500/15 text-red-400 border-red-500/30"
                    onTap={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")} />
                ))}
                {data.needsReview > 0 && (
                  <button onClick={() => { haptics.light(); navigate("/issues"); }}
                    className="w-full text-left bg-card border-l-4 border-l-purple-500 border border-border/60 rounded-lg px-3 py-2.5 flex items-center gap-2.5 active:scale-[0.98] transition-all hover:border-border">
                    <div className="h-7 w-7 rounded-md bg-purple-500/15 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{data.needsReview} open issue{data.needsReview > 1 ? "s" : ""}</p>
                      <p className="text-[10px] text-muted-foreground">Require attention</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-purple-500/15 text-purple-400 border-purple-500/30 shrink-0">REVIEW</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Today Actions — quick action row, only shown when shift is running */}
          {isAdmin && currentShift?.status === "running" && shiftLaunched && (
            <div>
              <SectionLabel label="Today Actions" icon={Zap} />
              <RoleAwareQuickActions onActionClick={setActiveModal} />
            </div>
          )}

          {/* Due Soon */}
          {data.dueSoon.length > 0 && (
            <div>
              <SectionLabel
                label="Due Soon"
                icon={Clock}
                count={data.dueSoon.length}
                action={data.dueSoon.length > 3 ? "View all" : undefined}
                onAction={() => navigate("/tasks")}
              />
              <div className="space-y-2">
                {data.dueSoon.slice(0, 4).map(item => (
                  <DueSoonCard key={item.id} title={item.title} meta={item.station} progress={item.progress}
                    onTap={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")} />
                ))}
              </div>
            </div>
          )}

          {/* Daily Events */}
          <div>
            <SectionLabel label="Today's Events" icon={CalendarDays} />
            <DailyEventsCard />
          </div>

          {/* Empty state when nothing urgent */}
          {data.overdue.length === 0 && data.dueSoon.length === 0 && (
            <div className="bg-card border border-border/40 rounded-xl p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No urgent items right now.</p>
            </div>
          )}
        </div>

        {/* RIGHT: Supporting Info */}
        <div className="space-y-4">
          {/* Shift Notes */}
          {data.latestHandoff && (
            <ShiftNotesCard
              note={data.latestHandoff.key_notes || "No shift notes available."}
              manager={data.latestHandoff.from_manager_name}
              onTap={() => navigate("/shift-handoff")}
            />
          )}

          {/* Food Safety */}
          {data.tempSafety && (
            <FoodSafetyCard tempSafety={data.tempSafety} onTap={() => navigate("/temp-logs")} />
          )}

          {/* Quick nav to more tools */}
          <div className="bg-card border border-border/40 rounded-xl p-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">Quick Links</p>
            {[
              { label: "Prep Lists", path: "/prep-lists", Icon: ClipboardList },
              { label: "Side Work", path: "/side-work", Icon: ListTodo },
              { label: "Temp Logs", path: "/temp-logs", Icon: Thermometer },
              { label: "Issues", path: "/issues", Icon: AlertCircle },
            ].map(({ label, path, Icon: NavIcon }) => (
              <button key={path} onClick={() => { haptics.light(); navigate(path); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95">
                <NavIcon className="h-3.5 w-3.5 shrink-0" />
                {label}
                <ChevronRight className="h-3 w-3 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ShiftLaunchModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onComplete={async () => { haptics.medium?.(); setShiftLaunched(true); setShowLaunchModal(false); }}
      />
      <StartShiftModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        locationId="demo-location"
        locationName="Main"
        onStartClick={() => { setShowStartModal(false); setShowLaunchModal(true); }}
      />
      {currentShift && currentShift.status === "setup" && (
        <SetupChecklist shift={currentShift} onContinue={() => markSetupComplete(currentShift.id)} />
      )}
      <CloseShiftModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} shift={currentShift} />
      <RoleAwareQuickActionModals activeModal={activeModal} onCloseModal={handleCloseModal} onSuccess={handleModalSuccess} />
    </div>
  );
}

export const hideBase44Index = true;