import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUnifiedState } from "@/lib/UnifiedStateContext";
import { useShiftMode } from "@/lib/ShiftModeContext";
import { AlertTriangle, Clock, CheckCircle2, Zap, FileText, AlertCircle, Thermometer, Wind, Snowflake, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import { useToast } from "@/hooks/useToast";
import CommandCenterHeader from "@/components/CommandCenterHeader";
import DailyEventsCard from "@/components/reservations/DailyEventsCard";
import ShiftProgress from "@/components/ShiftMode/ShiftProgress";
import StartShiftModal from "@/components/ShiftMode/StartShiftModal";
import SetupChecklist from "@/components/ShiftMode/SetupChecklist";
import CloseShiftModal from "@/components/ShiftMode/CloseShiftModal";
import QuickActionButtons from "@/components/QuickActionButtons";
import { QuickActionModals } from "@/components/QuickActionModals";

// Module-level cache — survives re-mounts and navigation
const cache = { data: null, ts: 0 };
const CACHE_TTL = 30_000; // 30s before background refresh

function ProgressCircle({ value, max = 100 }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (value / max) * circumference;
  const percentage = (value / max) * 100;
  const color = percentage >= 80 ? "#4CFF88" : percentage >= 60 ? "#FF9F1C" : "#FF4D4D";

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute w-full h-full" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="56" cy="56" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx="56"
          cy="56"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-smooth"
          style={{
            "--stroke-dasharray": circumference,
            "--final-offset": offset,
          }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-2xl font-bold text-foreground">{value}%</p>
        <p className="text-[10px] text-secondary-text font-semibold">Complete</p>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className={cn("h-5 w-5", color)} />
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-[9px] text-secondary-text font-semibold uppercase text-center leading-tight whitespace-nowrap">{label}</p>
    </div>
  );
}

function AttentionCard({ icon: Icon, iconColor, iconBg, title, meta, subtitle, status, statusColor, onTap }) {
  return (
    <button
      onClick={() => {
        haptics.medium();
        onTap?.();
      }}
      className="w-full text-left bg-card border-l-4 border-l-red-500 border border-border rounded-xl p-3 space-y-2.5 active:scale-95 transition-all duration-100"
    >
      <div className="flex items-start gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4 stroke-[1.5]", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-secondary-text">
            {meta && <span>{meta}</span>}
            {meta && subtitle && <span>·</span>}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-[9px] font-bold px-2 py-1 rounded-full border", statusColor)}>
          {status}
        </span>
        <div className="flex-1" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptics.medium();
            onTap?.();
          }}
          className="btn-primary text-xs h-7 px-2 flex items-center gap-1"
        >
          <Zap className="h-3 w-3" />
          Fix
        </button>
      </div>
    </button>
  );
}

function DueSoonCard({ icon: Icon, iconColor, iconBg, title, meta, subtitle, progress, onTap }) {
  return (
    <button
      onClick={() => {
        haptics.light();
        onTap?.();
      }}
      className="w-full text-left bg-card border-l-4 border-l-amber-500 border border-border rounded-xl p-3 space-y-2.5 active:scale-95 transition-all duration-100"
    >
      <div className="flex items-start gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4 stroke-[1.5]", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-secondary-text">
            {meta && <span>{meta}</span>}
            {meta && subtitle && <span>·</span>}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        </div>
      </div>
      {progress !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className="text-secondary-text">Progress</span>
            <span className="text-foreground">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}

function CompletedCard({ title, completedBy, completedAt }) {
  return (
    <button className="w-full text-left bg-card border-l-4 border-l-green-500 border border-border rounded-lg p-2.5 flex items-center gap-2 active:scale-95 transition-all duration-100">
      <CheckCircle2 className="h-4 w-4 stroke-[1.5] text-green-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{title}</p>
        <p className="text-[9px] text-secondary-text mt-0.5">
          {completedBy && <span>{completedBy}</span>}
          {completedBy && completedAt && <span> · </span>}
          {completedAt && <span>{completedAt}</span>}
        </p>
      </div>
    </button>
  );
}

function ShiftNotesCard({ note, manager, onTap }) {
  return (
    <button
      onClick={() => {
        haptics.light();
        onTap?.();
      }}
      className="w-full text-left bg-card border-l-4 border-l-blue-500 border border-border rounded-xl p-3 space-y-2.5 active:scale-95 transition-all duration-100"
    >
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 stroke-[1.5] text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm italic text-foreground leading-relaxed">"{note}"</p>
          {manager && <p className="text-[10px] text-secondary-text mt-2">— {manager}</p>}
        </div>
      </div>
      <div className="btn-secondary text-xs w-full h-8 mt-1 flex items-center justify-center rounded-lg border border-border cursor-pointer hover:bg-muted">
        View Handoff
      </div>
    </button>
  );
}

function SectionLabel({ label, icon: Icon, count }) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-2.5 first:mt-0">
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      <h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text">{label}</h2>
      {count !== undefined && (
        <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-muted text-foreground">
          {count}
        </span>
      )}
    </div>
  );
}

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lastCompletedAction, recordAction, setActiveTab } = useUnifiedState();
  const { currentShift, markSetupComplete } = useShiftMode();
  const { isAdmin } = useCurrentUser();
  const [data, setData] = useState(cache.data);
  const [loading, setLoading] = useState(!cache.data);
  const isMounted = useRef(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    isMounted.current = true;
    const set = (updater) => { if (isMounted.current) setData(updater); };

    // If fresh cache exists, skip loading state entirely
    const cacheAge = Date.now() - cache.ts;
    if (cache.data && cacheAge < CACHE_TTL) {
      setLoading(false);
    }

    // Fast primary load — core task data only
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

        const next = {
          ...(cache.data || {}),
          overdue,
          dueSoon,
          completed,
          completionPct,
          needsReview: issues.filter(i => i.status === "open").length,
        };
        cache.data = next;
        cache.ts = Date.now();
        set(() => next);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    // Deferred secondary load — supplementary data
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
              cooling: { total: coolingLogs.length, failed: coolingLogs.filter(l => ['failed','corrective_action_required'].includes(l.status)).length },
              refrig: { total: refrigLogs.length, outOfRange: refrigLogs.filter(l => l.isOutOfRange).length },
              hot: { total: hotLogs.length, outOfRange: hotLogs.filter(l => l.isOutOfRange).length },
            },
          };
          cache.data = next;
          return next;
        });
      } catch (e) {
        console.error(e);
      }
    };

    loadPrimary().then(() => loadSecondary());

    const unsubscribers = [
      base44.entities.PrepItem.subscribe((event) => {
        if (["create", "update", "delete"].includes(event.type)) loadPrimary();
      }),
      base44.entities.SideWorkAssignment.subscribe((event) => {
        if (["create", "update", "delete"].includes(event.type)) loadPrimary();
      }),
      base44.entities.Issue.subscribe((event) => {
        if (["create", "update", "delete"].includes(event.type)) loadPrimary();
      }),
    ];

    return () => {
      isMounted.current = false;
      unsubscribers.forEach(u => u?.());
    };
  }, [todayStr]);

  useEffect(() => {
    if (lastCompletedAction && lastCompletedAction.type !== 'init') {
      setActiveTab('/');
    }
  }, [lastCompletedAction]);

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleModalSuccess = () => {
    setTimeout(() => {
      const load = async () => {
        const [prepItems, sideWork, issues] = await Promise.all([
          base44.entities.PrepItem.list("-updated_date", 100).catch(() => []),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }).catch(() => []),
          base44.entities.Issue.filter({ status: "open" }).catch(() => []),
        ]);
        const overdue = [...prepItems.filter(i => i.status === "overdue"), ...sideWork.filter(t => t.status === "overdue")];
        const completionPct = prepItems.length > 0 ? Math.round((prepItems.filter(i => ["completed", "approved"].includes(i.status)).length / prepItems.length) * 100) : 0;
        setData(prev => ({
          ...prev,
          overdue: overdue.slice(0, 5),
          completionPct,
        }));
      };
      load();
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-10 text-secondary-text text-sm">Failed to load</div>;
  }

  return (
    <div className="pb-32">
      {/* Command Center Header */}
      <CommandCenterHeader
        onNotifications={() => navigate("/logs")}
        onViewDay={() => navigate("/calendar")}
      />

      {/* Shift Mode Controls + Quick Actions */}
      <div className="px-4 pt-3 pb-2 space-y-2.5 border-b border-border">
        {isAdmin && (
          <div>
            {!currentShift ? (
              <button
                onClick={() => setShowStartModal(true)}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-glow active:scale-95 transition-all"
              >
                <Zap className="h-4 w-4" />
                Start Shift
              </button>
            ) : currentShift.status === 'setup' ? (
              <button
                disabled
                className="w-full h-11 rounded-xl bg-primary/50 text-primary-foreground font-bold cursor-not-allowed"
              >
                Completing Setup...
              </button>
            ) : currentShift.status === 'running' ? (
              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full h-11 rounded-xl bg-red-500/90 text-white font-bold active:scale-95 transition-all"
              >
                End Shift
              </button>
            ) : null}
          </div>
        )}
        <QuickActionButtons onActionClick={setActiveModal} />
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Shift Progress */}
        {currentShift && currentShift.status === 'running' && <ShiftProgress shift={currentShift} />}

        {/* Shift Progress Card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Shift Progress</p>
          <div className="flex items-center gap-6">
            <ProgressCircle value={data.completionPct} max={100} />
            <div className="flex-1 grid grid-cols-3 gap-3">
              <StatItem icon={AlertTriangle} label="Overdue" value={data.overdue.length} color="text-red-400" />
              <StatItem icon={Clock} label="Due Soon" value={data.dueSoon.length} color="text-amber-400" />
              <StatItem icon={AlertCircle} label="Review" value={data.needsReview} color="text-blue-400" />
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        {data.overdue.length > 0 && (
          <div className="space-y-2.5">
            <SectionLabel label="Needs Attention" icon={AlertTriangle} count={data.overdue.length} />
            {data.overdue.slice(0, 5).map(item => (
              <AttentionCard
                key={item.id}
                icon={AlertTriangle}
                iconColor="text-red-400"
                iconBg="bg-red-500/15"
                title={item.title}
                meta={item.station}
                subtitle={item.assignee}
                status="OVERDUE"
                statusColor="bg-red-500/15 text-red-400 border-red-500/30"
                onTap={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")}
              />
            ))}
          </div>
        )}

        {/* Due Soon */}
        {data.dueSoon.length > 0 && (
          <div className="space-y-2.5">
            <SectionLabel label="Due Soon" icon={Clock} count={data.dueSoon.length} />
            {data.dueSoon.slice(0, 5).map(item => (
              <DueSoonCard
                key={item.id}
                icon={Clock}
                iconColor="text-amber-400"
                iconBg="bg-amber-500/15"
                title={item.title}
                meta={item.station}
                subtitle={item.assignee}
                progress={item.progress}
                onTap={() => {
                  setActiveTab(item.type === "prep" ? "/today" : "/today");
                  navigate(item.type === "prep" ? "/prep-lists" : "/side-work");
                }}
              />
            ))}
          </div>
        )}

        {/* Recently Completed */}
        {data.completed.length > 0 && (
          <div className="space-y-2">
            <SectionLabel label="Recently Completed" icon={CheckCircle2} count={data.completed.length} />
            {data.completed.map((item, i) => (
              <CompletedCard
                key={i}
                title={item.title}
                completedBy={item.completedBy}
                completedAt={item.completedAt}
              />
            ))}
          </div>
        )}

        {/* Daily Events */}
        <DailyEventsCard />

        {/* Food Safety */}
        {data.tempSafety && (
          <div className="space-y-2">
            <SectionLabel label="Food Safety" icon={Thermometer} />
            <button onClick={() => navigate('/temp-logs')} className="w-full bg-card border border-border rounded-xl p-3 active:scale-95 transition-all text-left">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { Icon: Wind, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Cooling', count: data.tempSafety.cooling.total, issues: data.tempSafety.cooling.failed, issueLabel: 'failed' },
                  { Icon: Snowflake, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Fridge/Freezer', count: data.tempSafety.refrig.total, issues: data.tempSafety.refrig.outOfRange, issueLabel: 'OOR' },
                  { Icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Hot Holding', count: data.tempSafety.hot.total, issues: data.tempSafety.hot.outOfRange, issueLabel: 'OOR' },
                ].map(({ Icon, color, bg, label, count, issues, issueLabel }) => (
                  <div key={label} className="text-center">
                    <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground leading-tight">{label}</p>
                    <p className="text-sm font-extrabold text-foreground">{count} logged</p>
                    {issues > 0 && <p className="text-[9px] font-bold text-red-400">{issues} {issueLabel}</p>}
                  </div>
                ))}
              </div>
            </button>
          </div>
        )}

        {/* Shift Notes */}
        {data.latestHandoff && (
          <div className="space-y-2.5">
            <SectionLabel label="Shift Notes" icon={FileText} />
            <ShiftNotesCard
              note={data.latestHandoff.key_notes || "No shift notes available."}
              manager={data.latestHandoff.from_manager_name}
              onTap={() => navigate("/shift-handoff")}
            />
          </div>
        )}
      </div>

      {/* Shift Mode Modals */}
      <StartShiftModal isOpen={showStartModal} onClose={() => setShowStartModal(false)} locationId="demo-location" locationName="Main" />
      {currentShift && currentShift.status === 'setup' && (
        <SetupChecklist shift={currentShift} onContinue={() => markSetupComplete(currentShift.id)} />
      )}
      <CloseShiftModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} shift={currentShift} />

      {/* Quick Action Modals */}
      <QuickActionModals activeModal={activeModal} onCloseModal={handleCloseModal} onSuccess={handleModalSuccess} />
    </div>
  );
}

export const hideBase44Index = true;