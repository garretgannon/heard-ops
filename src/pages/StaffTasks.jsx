import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Thermometer, AlertTriangle, Users, ChevronRight,
  CheckCircle2, Clock, Flame, FileText, AlertCircle, Upload, MessageSquare, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ── Atoms ─────────────────────────────────────────────── */
function MetricTile({ icon: Icon, label, value, alert }) {
  return (
    <div className={cn("flex flex-col gap-0 bg-[#111827] border rounded-xl p-2 min-w-0", alert ? "border-red-500/35" : "border-[#1F2937]")}>
      <Icon className={cn("h-3 w-3 mb-0.5", alert ? "text-red-400" : "text-gray-600")} />
      <span className={cn("text-[20px] font-extrabold leading-none", alert ? "text-red-400" : "text-white")}>{value}</span>
      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

function AlertRow({ icon: Icon, iconColor, iconBg, title, meta, badge, badgeColor, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform text-left">
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-3.5 w-3.5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-white leading-tight truncate">{title}</p>
        {meta && <p className="text-[10px] text-gray-600 mt-0.5 truncate">{meta}</p>}
      </div>
      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", badgeColor)}>{badge}</span>
      <ChevronRight className="h-3 w-3 text-gray-700 shrink-0" />
    </button>
  );
}

function PriorityRow({ rank, icon: Icon, title, meta, status, onAction, actionLabel }) {
  const sc = {
    overdue:     "bg-red-500/10 border-red-500/20 text-red-400",
    pending:     "bg-amber-500/10 border-amber-500/20 text-amber-400",
    in_progress: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    ok:          "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  }[status] || "bg-gray-500/10 border-gray-500/20 text-gray-400";
  return (
    <div className="flex items-center gap-2.5 bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5">
      <span className="text-[11px] font-extrabold text-[#F5A623]/40 w-3 shrink-0">{rank}</span>
      <div className="h-7 w-7 rounded-lg bg-[#1C2432] flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-[#F5A623]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-white leading-tight truncate">{title}</p>
        {meta && <p className="text-[10px] text-gray-600 truncate">{meta}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", sc)}>{status}</span>
        {onAction && (
          <button onClick={onAction} className="text-[9px] font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20 px-1.5 py-0.5 rounded-lg active:scale-95 transition-transform">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function QA({ icon: Icon, label, iconColor, bg, onClick }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1.5 bg-[#111827] border border-[#1F2937] rounded-xl py-2.5 px-1 active:scale-95 transition-transform min-w-0">
      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", bg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <span className="text-[10px] text-gray-500 font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export default function StaffTasks() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBlockedDialog, setShowBlockedDialog] = useState(null);
  const [blockedComment, setBlockedComment] = useState("");
  const [completingTask, setCompletingTask] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState({});
  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    const [prepItems, sideWork, tempLogs, tempLocations, issues, staffShifts] = await Promise.all([
      base44.entities.PrepItem.list("-created_date", 500),
      base44.entities.SideWorkAssignment.filter({ date: todayStr }),
      base44.entities.TempLogEntry.filter({ date: todayStr }),
      base44.entities.TempLogLocation.list(),
      base44.entities.Issue.filter({ status: "open" }).catch(() => []),
      base44.entities.StaffShift.filter({ date: todayStr, status: "published" }).catch(() => []),
    ]);

    // My tasks
    const myPrep = prepItems.filter(i => {
      if (i.assigned_to_individual === user?.email) return true;
      if (i.role_assignment === user?.role && !i.assigned_to_individual) return true;
      if (i.allow_all_roles && !i.role_assignment && !i.assigned_to_individual) return true;
      return false;
    });
    const mySideWork = sideWork.filter(t => {
      if (t.assigned_to_individual && t.assigned_to_email === user?.email) return true;
      if (t.role_assignment === user?.role && !t.assigned_to_individual) return true;
      if (!t.role_assignment && !t.assigned_to_individual) return true;
      return false;
    });

    const allMyTasks = [
      ...myPrep.map(i => ({ id: i.id, type: "prep", name: i.name, status: i.status, priority: i.priority || "medium", due_time: null, requires_photo: !!i.master_photo_url, photo_url: i.photo_url, notes: i.completion_notes, assigned: i.assigned_to_individual })),
      ...mySideWork.map(t => ({ id: t.id, type: "sidework", name: t.task_name, status: t.status, priority: t.priority || "medium", due_time: t.due_time, requires_photo: t.requires_photo, photo_url: t.photo_url, notes: t.completion_notes, assigned: t.assigned_to_email })),
    ];

    // Metrics
    const tasksDue = allMyTasks.filter(t => !["completed","approved"].includes(t.status)).length;
    const tempAlerts = tempLogs.filter(t => t.is_above_range || t.is_below_range).length;
    const openIssues = issues.length;
    const onShift = staffShifts.length;

    // Needs Attention
    const alerts = [];
    tempLogs.filter(t => t.is_above_range || t.is_below_range).forEach(t =>
      alerts.push({ icon: Thermometer, iconColor: "text-red-400", iconBg: "bg-red-500/12", title: `Temp Alert — ${t.location_name || "Station"}: ${t.value ?? t.temperature}°F`, meta: t.is_above_range ? "Above safe range" : "Below safe range", badge: "Critical", badgeColor: "bg-red-500/12 text-red-400 border-red-500/25", path: "/temp-logs", severity: 1 })
    );
    const overduePrep = allMyTasks.filter(t => t.status === "overdue" && t.type === "prep");
    if (overduePrep.length) alerts.push({ icon: ClipboardList, iconColor: "text-orange-400", iconBg: "bg-orange-500/12", title: `${overduePrep.length} Prep Item${overduePrep.length > 1 ? "s" : ""} Overdue`, meta: overduePrep.slice(0, 2).map(t => t.name).join(", "), badge: "Overdue", badgeColor: "bg-orange-500/12 text-orange-400 border-orange-500/25", path: "/prep-lists", severity: 2 });
    const missedClean = mySideWork.filter(t => t.status === "overdue");
    if (missedClean.length) alerts.push({ icon: Flame, iconColor: "text-orange-400", iconBg: "bg-orange-500/12", title: `${missedClean.length} Cleaning Task${missedClean.length > 1 ? "s" : ""} Missed`, meta: missedClean.slice(0, 2).map(t => t.task_name).join(", "), badge: "Overdue", badgeColor: "bg-orange-500/12 text-orange-400 border-orange-500/25", path: "/side-work", severity: 2 });
    issues.slice(0, 3).forEach(i => alerts.push({ icon: ShieldAlert, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/12", title: i.title, meta: `Issue · ${i.category || "Other"}`, badge: "Open", badgeColor: "bg-yellow-500/12 text-yellow-400 border-yellow-500/25", path: "/issues", severity: 3 }));
    alerts.sort((a, b) => a.severity - b.severity);

    // Priorities (top 3 non-completed tasks)
    const priorities = allMyTasks
      .filter(t => !["completed","approved"].includes(t.status))
      .sort((a, b) => {
        const pa = a.priority === "high" ? 0 : a.priority === "medium" ? 1 : 2;
        const pb = b.priority === "high" ? 0 : b.priority === "medium" ? 1 : 2;
        return pa - pb;
      })
      .slice(0, 3);

    // Activity feed (recent completed)
    const recent = allMyTasks.filter(t => ["completed","approved"].includes(t.status)).slice(0, 5);

    setData({ allMyTasks, tasksDue, tempAlerts, openIssues, onShift, alerts, priorities, recent, totalTasks: allMyTasks.length, completedTasks: allMyTasks.filter(t => ["completed","approved"].includes(t.status)).length });
    setLoading(false);
  };

  useEffect(() => { if (user?.email) load(); }, [user?.email]);

  const handleCompleteTask = async (task) => {
    setCompletingTask(prev => ({ ...prev, [task.id]: true }));
    const updateData = { status: "completed", completed_at: new Date().toISOString(), completed_by: user?.email };
    if (task.type === "prep") await base44.entities.PrepItem.update(task.id, updateData);
    else await base44.entities.SideWorkAssignment.update(task.id, updateData);
    toast.success("Task complete ✓");
    setCompletingTask(prev => ({ ...prev, [task.id]: false }));
    load();
  };

  const handleBlockedTask = async (taskId) => {
    if (!blockedComment.trim()) { toast.error("Add a comment first"); return; }
    const task = data?.allMyTasks.find(t => t.id === taskId);
    if (task?.type === "prep") await base44.entities.PrepItem.update(taskId, { notes: blockedComment });
    else await base44.entities.SideWorkAssignment.update(taskId, { completion_notes: blockedComment });
    toast.success("Issue reported");
    setShowBlockedDialog(null);
    setBlockedComment("");
    load();
  };

  const handleUploadPhoto = async (taskId, file) => {
    if (!file) return;
    setUploadingPhoto(prev => ({ ...prev, [taskId]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const task = data?.allMyTasks.find(t => t.id === taskId);
    if (task?.type === "prep") await base44.entities.PrepItem.update(taskId, { photo_url: file_url });
    else await base44.entities.SideWorkAssignment.update(taskId, { photo_url: file_url });
    toast.success("Photo uploaded");
    setUploadingPhoto(prev => ({ ...prev, [taskId]: false }));
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-2.5 pb-24">

      {/* Greeting */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">{getGreeting()}, {firstName}</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">Here's what's wrong right now.</p>
        </div>
        {data && (
          <div className="text-right">
            <p className="text-[20px] font-extrabold text-white leading-none">{data.completedTasks}/{data.totalTasks}</p>
            <p className="text-[10px] text-gray-600">tasks done</p>
          </div>
        )}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricTile icon={ClipboardList} label="Due"      value={data.tasksDue}   alert={data.tasksDue > 0} />
        <MetricTile icon={Thermometer}   label="Alerts"   value={data.tempAlerts} alert={data.tempAlerts > 0} />
        <MetricTile icon={AlertTriangle} label="Issues"   value={data.openIssues} alert={data.openIssues > 0} />
        <MetricTile icon={Users}         label="On Shift" value={data.onShift} />
      </div>

      {/* Needs Attention */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">⚡ Needs Attention</p>
        {data.alerts.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {data.alerts.map((a, i) => (
              <AlertRow key={i} {...a} onClick={() => navigate(a.path)} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-[#111827] border border-emerald-500/20 rounded-xl px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-emerald-400">All Clear</p>
              <p className="text-[10px] text-gray-600">No critical issues right now</p>
            </div>
          </div>
        )}
      </div>

      {/* Priorities */}
      {data.priorities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Top Priorities</p>
          <div className="flex flex-col gap-1.5">
            {data.priorities.map((task, i) => (
              <PriorityRow
                key={task.id}
                rank={i + 1}
                icon={task.type === "prep" ? ClipboardList : Flame}
                title={task.name}
                meta={task.due_time ? `Due ${task.due_time}` : task.assigned || ""}
                status={task.status === "overdue" ? "overdue" : task.status === "in_progress" ? "in_progress" : "pending"}
                actionLabel={completingTask[task.id] ? "..." : "✓ Done"}
                onAction={() => handleCompleteTask(task)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Quick Actions</p>
        <div className="flex gap-1.5">
          <QA icon={Thermometer}   label="Log Temp"   iconColor="text-[#F5A623]" bg="bg-[#F5A623]/10"  onClick={() => navigate("/temp-logs")} />
          <QA icon={ClipboardList} label="Start Prep" iconColor="text-blue-400"  bg="bg-blue-500/10"   onClick={() => navigate("/prep-lists")} />
          <QA icon={AlertTriangle} label="Report"     iconColor="text-red-400"   bg="bg-red-500/10"    onClick={() => setShowBlockedDialog("new")} />
          <QA icon={FileText}      label="Add Note"   iconColor="text-purple-400"bg="bg-purple-500/10" onClick={() => navigate("/manager-log")} />
        </div>
      </div>



      {/* Activity Feed */}
      {data.recent.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Recent Activity</p>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl divide-y divide-[#1F2937]">
            {data.recent.map(task => (
              <div key={task.id} className="flex items-center gap-2.5 px-3 py-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                </div>
                <p className="flex-1 text-[11px] text-gray-400 leading-snug truncate">{task.name}</p>
                <span className="text-[9px] text-gray-700 shrink-0">{task.type === "prep" ? "Prep" : "Side Work"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issue dialog */}
      <Dialog open={!!showBlockedDialog} onOpenChange={() => setShowBlockedDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Report Issue</DialogTitle></DialogHeader>
          <div className="py-3">
            <label className="text-sm font-semibold">What's the issue?</label>
            <Textarea value={blockedComment} onChange={e => setBlockedComment(e.target.value)}
              placeholder="e.g., Missing supplies, equipment broken..." className="mt-2 min-h-16" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockedDialog(null)}>Cancel</Button>
            <Button onClick={() => showBlockedDialog === "new" ? (toast.success("Issue noted"), setShowBlockedDialog(null)) : handleBlockedTask(showBlockedDialog)}>
              <AlertCircle className="h-4 w-4 mr-2" /> Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;