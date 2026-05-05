import { useState, useEffect, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ShiftModeContext } from "@/lib/ShiftModeContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Bell, AlertTriangle, Clock, CheckCircle2, ChevronRight, Zap, User, MapPin, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CardInteractionWrapper } from "@/components/CardInteractionModal";
import CaughtUpEmptyState from "@/components/CaughtUpEmptyState";
import { haptics } from "@/utils/haptics";

function ProgressCircle({ value, max = 100 }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (value / max) * circumference;
  const percentage = (value / max) * 100;
  const color = percentage >= 80 ? "#4CFF88" : percentage >= 60 ? "#FF9F1C" : "#FF4D4D";
  const isFirstLoad = value > 0;

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
          className={isFirstLoad ? "animate-stroke-load stroke-smooth" : "stroke-smooth"}
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
      <p className="text-[9px] text-secondary-text font-semibold uppercase">{label}</p>
    </div>
  );
}

function AttentionCard({ icon: Icon, iconColor, iconBg, title, meta, subtitle, status, statusColor, onView, onFix }) {
  return (
    <CardInteractionWrapper onOpen={() => { haptics.strong(); onView?.(); }}>
    <div className="card-with-border border-l-red-500 p-3 space-y-2.5">
      <div className="flex items-start gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4 stroke-[1.5]", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-secondary-text">
            {meta && <span>{meta}</span>}
            {subtitle && <span>·</span>}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-[9px] font-bold px-2 py-1 rounded-full border", statusColor)}>
          {status}
        </span>
        <div className="flex-1" />
        <button onClick={() => { haptics.light(); onView?.(); }} className="btn-secondary text-xs h-7 px-2">
          View
        </button>
        {onFix && (
          <button onClick={() => { haptics.medium(); onFix?.(); }} className="btn-primary text-xs h-7 px-2 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Fix
          </button>
        )}
      </div>
    </div>
    </CardInteractionWrapper>
  );
}

function DueSoonCard({ title, meta, subtitle, progress, onView, onAction }) {
  return (
    <CardInteractionWrapper onOpen={() => { haptics.light(); onView?.(); }}>
    <div className="card-with-border border-l-amber-500 p-3 space-y-2.5">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
          <Clock className="h-4 w-4 stroke-[1.5] text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-secondary-text">
            {meta && <span>{meta}</span>}
            {subtitle && <span>·</span>}
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
              className="h-full bg-amber-500 rounded-full progress-smooth animate-progress-load"
              style={{
                width: `${progress}%`,
                "--progress-width": `${progress}%`,
              }}
            />
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => { haptics.light(); onView?.(); }} className="btn-secondary text-xs h-7 px-2 flex-1">
          View
        </button>
        {onAction && (
          <button onClick={() => { haptics.medium(); onAction?.(); }} className="btn-secondary text-xs h-7 px-2 flex-1">
            Act
          </button>
        )}
      </div>
    </div>
    </CardInteractionWrapper>
  );
}

function CompletedCard({ title, completedBy, completedAt }) {
  return (
    <CardInteractionWrapper>
    <div className="card-with-border border-l-green-500 p-2.5 flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 stroke-[1.5] text-green-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{title}</p>
        <p className="text-[9px] text-secondary-text mt-0.5">
          {completedBy && <span>{completedBy}</span>}
          {completedBy && completedAt && <span> · </span>}
          {completedAt && <span>{completedAt}</span>}
        </p>
      </div>
    </div>
    </CardInteractionWrapper>
  );
}

function ShiftNotesCard({ note, manager, onView }) {
  return (
    <CardInteractionWrapper onOpen={() => { haptics.light(); onView?.(); }}>
    <div className="card-with-border border-l-blue-500 p-3 space-y-2.5">
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 stroke-[1.5] text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm italic text-foreground leading-relaxed">"{note}"</p>
          {manager && <p className="text-[10px] text-secondary-text mt-2">— {manager}</p>}
        </div>
      </div>
      {onView && (
        <button onClick={onView} className="btn-secondary text-xs w-full h-8">
          View Handoff
        </button>
      )}
    </div>
    </CardInteractionWrapper>
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdatedText, setShowUpdatedText] = useState(false);
  const pullThreshold = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      setPullY(touch.clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0 && pullY > 0) {
      const touch = e.touches[0];
      const diff = Math.max(0, touch.clientY - pullY);
      const resistance = diff * 0.5;
      setPullY(touch.clientY);
      const headerEl = document.querySelector('[data-pull-header]');
      if (headerEl) {
        headerEl.style.transform = `scaleY(${1 + resistance / 100})`;
      }
    }
  };

  const handleTouchEnd = async (e) => {
    const headerEl = document.querySelector('[data-pull-header]');
    if (headerEl) {
      headerEl.style.transform = 'scaleY(1)';
    }
    setPullY(0);

    if (pullY > pullThreshold) {
      setRefreshing(true);
      haptics.medium();
      await new Promise(r => setTimeout(r, 400));
      setShowUpdatedText(true);
      await new Promise(r => setTimeout(r, 2000));
      setRefreshing(false);
      setShowUpdatedText(false);
    }
  };

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullY]);

  useEffect(() => {
    const load = async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      try {
        const [prepItems, tempLogs, sideWork, issues, incidents, handoffs] = await Promise.all([
          base44.entities.PrepItem.list("-updated_date", 100).catch(() => []),
          base44.entities.TempLogEntry.filter({ logged_date: todayStr }).catch(() => []),
          base44.entities.SideWorkAssignment.filter({ date: todayStr }).catch(() => []),
          base44.entities.Issue.filter({ status: "open" }).catch(() => []),
          base44.entities.IncidentReport.list().catch(() => []),
          base44.entities.ShiftHandoff.list("-created_date", 1).catch(() => []),
        ]);

        // Compile alerts
        const overdue = [
          ...prepItems.filter(i => i.status === "overdue").map(i => ({
            type: "prep",
            id: i.id,
            title: i.name,
            station: i.station_name,
            assignee: i.completed_by,
            status: "OVERDUE",
            statusColor: "bg-red-500/15 text-red-400 border-red-500/30",
          })),
          ...sideWork.filter(t => t.status === "overdue").map(t => ({
            type: "sidework",
            id: t.id,
            title: t.task_name,
            station: t.role,
            assignee: t.assigned_to_name,
            status: "OVERDUE",
            statusColor: "bg-red-500/15 text-red-400 border-red-500/30",
          })),
        ];

        const dueSoon = [
          ...prepItems.filter(i => i.status === "in_progress" && i.due_time).map(i => ({
            type: "prep",
            id: i.id,
            title: i.name,
            station: i.station_name,
            assignee: i.completed_by,
            progress: i.quantity ? Math.round(((i.completed_qty || 0) / i.quantity) * 100) : 0,
          })),
          ...sideWork.filter(t => ["pending", "in_progress"].includes(t.status)).map(t => ({
            type: "sidework",
            id: t.id,
            title: t.task_name,
            station: t.role,
            assignee: t.assigned_to_name,
            progress: 50,
          })),
        ];

        const completed = [
          ...prepItems.filter(i => i.status === "approved").slice(-3).map(i => ({
            title: i.name,
            completedBy: i.approved_by,
            completedAt: i.approved_at ? new Date(i.approved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
          })),
          ...sideWork.filter(t => t.status === "approved").slice(-3).map(t => ({
            title: t.task_name,
            completedBy: t.approved_by,
            completedAt: t.approved_at ? new Date(t.approved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
          })),
        ].slice(0, 3);

        const totalTasks = prepItems.length + sideWork.length;
        const completedTasks = prepItems.filter(i => ["completed", "approved"].includes(i.status)).length + sideWork.filter(t => ["completed", "approved"].includes(t.status)).length;
        const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setData({
          overdue,
          dueSoon,
          completed,
          completionPct,
          tempLogs: tempLogs.length,
          needsReview: issues.filter(i => i.status === "open").length,
          latestHandoff: handoffs[0],
          date: new Date(),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
    <div className="pb-32 w-full">
      {/* Header with Pull-to-Refresh */}
      <div
        data-pull-header
        className={cn(
          "flex items-start justify-between mb-4 transition-transform origin-top",
          refreshing && "animate-flash"
        )}
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Today</h1>
          <p className="text-xs text-secondary-text mt-1">
            {showUpdatedText ? "Updated just now" : format(data.date, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <button className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 stroke-[1.5] text-secondary-text" />
        </button>
      </div>

      {/* Progress Stats Card */}
      <div className="card-with-border border-l-4 border-l-primary p-4 mb-4 flex items-center gap-6">
        <ProgressCircle value={data.completionPct} max={100} />
        <div className="flex-1 grid grid-cols-3 gap-3">
          <StatItem icon={AlertTriangle} label="Overdue" value={data.overdue.length} color="text-red-400" />
          <StatItem icon={Clock} label="Due Soon" value={data.dueSoon.length} color="text-amber-400" />
          <StatItem icon={FileText} label="Review" value={data.needsReview} color="text-blue-400" />
        </div>
      </div>

      {/* Needs Attention */}
      {data.overdue.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-2 mt-4 mb-2.5 first:mt-0">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Needs Attention</h2>
            <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-muted text-foreground">
              {data.overdue.length}
            </span>
            <div className="animate-accent-line h-3 bg-red-500 rounded-full" />
          </div>
          <div className="space-y-2">
            {data.overdue.slice(0, 3).map(item => (
              <div key={item.id} className="animate-pulse-subtle">
                <AttentionCard
                  icon={AlertTriangle}
                  iconColor="text-red-400"
                  iconBg="bg-red-500/15"
                  title={item.title}
                  meta={item.station}
                  subtitle={item.assignee}
                  status={item.status}
                  statusColor={item.statusColor}
                  onView={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")}
                  onFix={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Soon */}
      {data.dueSoon.length > 0 && (
        <div>
          <SectionLabel label="Due Soon" icon={Clock} count={data.dueSoon.length} />
          <div className="space-y-2">
            {data.dueSoon.slice(0, 3).map(item => (
              <DueSoonCard
                key={item.id}
                title={item.title}
                meta={item.station}
                subtitle={item.assignee}
                progress={item.progress}
                onView={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")}
                onAction={() => navigate(item.type === "prep" ? "/prep-lists" : "/side-work")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {data.completed.length > 0 && (
        <div>
          <SectionLabel label="Recently Completed" icon={CheckCircle2} count={data.completed.length} />
          <div className="space-y-1">
            {data.completed.map((item, i) => (
              <CompletedCard
                key={i}
                title={item.title}
                completedBy={item.completedBy}
                completedAt={item.completedAt}
              />
            ))}
          </div>
        </div>
      )}

      {/* Shift Notes */}
      {data.latestHandoff && (
        <div>
          <SectionLabel label="Shift Notes" icon={FileText} />
          <ShiftNotesCard
            note={data.latestHandoff.notes_for_next_manager || "No handoff notes."}
            manager={data.latestHandoff.manager_on_duty}
            onView={() => navigate("/shift-handoff")}
          />
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;