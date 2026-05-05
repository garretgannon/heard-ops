import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Flame, Sparkles, Sun, Moon, ChevronRight, CheckCircle2, AlertCircle, Camera, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";

const todayStr = new Date().toISOString().split("T")[0];

function MetricTile({ label, value, color, alert }) {
  return (
    <div className={cn("flex flex-col gap-0.5 bg-[#111827] border rounded-xl p-2.5 min-w-0", alert ? "border-red-500/30" : "border-[#1F2937]")}>
      <span className={cn("text-[22px] font-extrabold leading-none", color)}>{value}</span>
      <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5 leading-tight">{label}</span>
    </div>
  );
}

function CategoryCard({ icon: Icon, iconColor, iconBg, title, description, stat1, stat2, statusLabel, statusColor, onClick }) {
  return (
    <button onClick={onClick} className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-3.5 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform text-left">
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-white leading-tight">{title}</p>
        <p className="text-[11px] text-gray-600 mt-0.5">{description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {stat1 && <span className="text-[10px] font-bold text-gray-500 bg-[#1A2235] border border-[#232D3F] px-1.5 py-0.5 rounded-md">{stat1}</span>}
          {stat2 && <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border", stat2.color)}>{stat2.label}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {statusLabel && (
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusColor)}>
            {statusLabel}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-gray-700" />
      </div>
    </button>
  );
}

export default function Standards() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ tasksDue: 0, overdue: 0, completionPct: 0, photoVerifiedPct: 0 });
  const [cats, setCats] = useState({ cleaning: {}, sideWork: {}, opening: {}, closing: {} });

  useEffect(() => {
    (async () => {
      const [sideWork, prepItems, prepLists] = await Promise.all([
        base44.entities.SideWorkAssignment.filter({ date: todayStr }),
        base44.entities.PrepItem.list("-updated_date", 300),
        base44.entities.PrepList.filter({ date: todayStr }),
      ]);

      const todayPrepIds = new Set(prepLists.map(pl => pl.id));
      const todayPrep = prepItems.filter(i => todayPrepIds.has(i.prep_list_id));

      // All tasks combined
      const allTasks = [...sideWork, ...todayPrep];
      const tasksDue = allTasks.filter(t => !["completed","approved"].includes(t.status)).length;
      const overdue = allTasks.filter(t => t.status === "overdue").length;
      const completed = allTasks.filter(t => ["completed","approved"].includes(t.status)).length;
      const completionPct = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
      const withPhoto = allTasks.filter(t => t.photo_url || t.master_photo_url);
      const verified = withPhoto.filter(t => t.photo_url).length;
      const photoVerifiedPct = withPhoto.length > 0 ? Math.round((verified / withPhoto.length) * 100) : 100;

      // Cleaning — side work with cleaning-related keywords
      const cleaning = sideWork.filter(t => /clean|mop|sweep|sanitiz|wipe|scrub/i.test(t.task_name || ""));
      const cleanDone = cleaning.filter(t => ["completed","approved"].includes(t.status)).length;
      const cleanOverdue = cleaning.filter(t => t.status === "overdue").length;
      const cleanPct = cleaning.length > 0 ? Math.round((cleanDone / cleaning.length) * 100) : 0;

      // Side Work — all FOH/BOH duties
      const swDone = sideWork.filter(t => ["completed","approved"].includes(t.status)).length;
      const swPct = sideWork.length > 0 ? Math.round((swDone / sideWork.length) * 100) : 0;

      // Opening — morning shift side work
      const opening = sideWork.filter(t => t.shift_type === "opening" || /open/i.test(t.shift_type || ""));
      const openDone = opening.filter(t => ["completed","approved"].includes(t.status)).length;
      const openStatus = opening.length === 0 ? "not_started" : openDone === opening.length ? "complete" : openDone > 0 ? "in_progress" : "not_started";

      // Closing — closing shift side work
      const closing = sideWork.filter(t => t.shift_type === "closing" || /clos/i.test(t.shift_type || ""));
      const closeDone = closing.filter(t => ["completed","approved"].includes(t.status)).length;
      const closeStatus = closing.length === 0 ? "not_started" : closeDone === closing.length ? "complete" : closeDone > 0 ? "in_progress" : "not_started";

      setMetrics({ tasksDue, overdue, completionPct, photoVerifiedPct });
      setCats({ cleaning: { pct: cleanPct, overdue: cleanOverdue }, sideWork: { pct: swPct, total: sideWork.length, done: swDone }, opening: { status: openStatus, total: opening.length }, closing: { status: closeStatus, total: closing.length } });
      setLoading(false);
    })();
  }, []);

  const statusStyle = (s) => ({
    complete:    { label: "Complete",     color: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25" },
    in_progress: { label: "In Progress",  color: "bg-amber-500/12 text-amber-400 border-amber-500/25" },
    not_started: { label: "Not Started",  color: "bg-gray-500/12 text-gray-500 border-gray-500/20" },
  }[s] || { label: "Not Started", color: "bg-gray-500/12 text-gray-500 border-gray-500/20" });

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const oss = statusStyle(cats.opening.status);
  const css = statusStyle(cats.closing.status);

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-2.5 pb-24">

      {/* Header */}
      <div className="pt-1">
        <h1 className="text-[20px] font-extrabold text-white tracking-tight">Standards</h1>
        <p className="text-[12px] text-gray-600 mt-0.5">Daily execution & accountability</p>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricTile label="Due Today"  value={metrics.tasksDue}          color={metrics.tasksDue > 0 ? "text-amber-400" : "text-white"} />
        <MetricTile label="Overdue"    value={metrics.overdue}           color={metrics.overdue > 0 ? "text-red-400" : "text-white"} alert={metrics.overdue > 0} />
        <MetricTile label="Complete"   value={`${metrics.completionPct}%`} color={metrics.completionPct >= 80 ? "text-emerald-400" : "text-amber-400"} />
        <MetricTile label="Photo Verif" value={`${metrics.photoVerifiedPct}%`} color={metrics.photoVerifiedPct >= 90 ? "text-emerald-400" : "text-amber-400"} />
      </div>

      {/* Section label */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-1">Categories</p>

      {/* Category cards */}
      <div className="flex flex-col gap-2">

        {/* Cleaning */}
        <CategoryCard
          icon={Sparkles}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          title="Cleaning"
          description="Daily, weekly, deep clean tasks"
          stat1={`${cats.cleaning.pct}% complete`}
          stat2={cats.cleaning.overdue > 0 ? { label: `${cats.cleaning.overdue} overdue`, color: "bg-red-500/10 text-red-400 border-red-500/20" } : null}
          onClick={() => navigate("/side-work")}
        />

        {/* Side Work */}
        <CategoryCard
          icon={Flame}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/10"
          title="Side Work"
          description="FOH & BOH duties"
          stat1={`${cats.sideWork.done || 0}/${cats.sideWork.total || 0} done`}
          stat2={{ label: `${cats.sideWork.pct || 0}% complete`, color: cats.sideWork.pct >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20" }}
          onClick={() => navigate("/side-work")}
        />

        {/* Opening */}
        <CategoryCard
          icon={Sun}
          iconColor="text-yellow-400"
          iconBg="bg-yellow-500/10"
          title="Opening"
          description="Opening checklists"
          stat1={cats.opening.total > 0 ? `${cats.opening.total} tasks` : "No tasks today"}
          statusLabel={oss.label}
          statusColor={oss.color}
          onClick={() => navigate("/side-work")}
        />

        {/* Closing */}
        <CategoryCard
          icon={Moon}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
          title="Closing"
          description="Closing checklists"
          stat1={cats.closing.total > 0 ? `${cats.closing.total} tasks` : "No tasks today"}
          statusLabel={css.label}
          statusColor={css.color}
          onClick={() => navigate("/side-work")}
        />
      </div>

      {/* Quick tip when overdue */}
      {metrics.overdue > 0 && (
        <div className="flex items-center gap-2.5 bg-red-500/6 border border-red-500/20 rounded-xl px-3 py-2.5 mt-1">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-[11px] text-red-300 leading-snug">
            <span className="font-bold">{metrics.overdue} task{metrics.overdue > 1 ? "s" : ""} overdue.</span> Review Side Work for details.
          </p>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;