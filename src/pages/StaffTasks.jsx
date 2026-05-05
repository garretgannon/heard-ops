import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardList, Flame, Plus } from "lucide-react";
import { haptics } from "@/utils/haptics";
import SwipeableTaskCard from "@/components/SwipeableTaskCard";
import CaughtUpEmptyState from "@/components/CaughtUpEmptyState";
import SectionCompleteMessage from "@/components/SectionCompleteMessage";
import StandardPageShell from "@/components/StandardPageShell";
import { useToast } from "@/hooks/useToast";

/* ── Group Header ──────────────────────────────────────────────── */
function GroupHeader({ station, count }) {
  return (
    <div className="flex items-center justify-between mt-3 mb-2 first:mt-0 px-0.5">
      <h3 className="text-xs font-bold text-foreground">{station}</h3>
      <span className="text-[10px] text-secondary-text font-semibold bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function StaffTasks() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBlockedDialog, setShowBlockedDialog] = useState(null);
  const [blockedComment, setBlockedComment] = useState("");
  const [completingTask, setCompletingTask] = useState({});
  const [removingTask, setRemovingTask] = useState({});
  const [filter, setFilter] = useState("all");
  const [completedSection, setCompletedSection] = useState(null);
  const [allTasksComplete, setAllTasksComplete] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    const [prepItems, sideWork] = await Promise.all([
      base44.entities.PrepItem.list("-created_date", 500),
      base44.entities.SideWorkAssignment.filter({ date: todayStr }),
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
      ...myPrep.map(i => ({
        id: i.id,
        type: "prep",
        name: i.name,
        status: i.status,
        priority: i.priority || "medium",
        due_time: null,
        requires_photo: !!i.master_photo_url,
        photo_url: i.photo_url,
        notes: i.completion_notes,
        assigned: i.assigned_to_individual,
        station: i.station_name || "Prep",
        progress: i.quantity ? `${i.completed_qty || 0}/${i.quantity}` : null,
      })),
      ...mySideWork.map(t => ({
        id: t.id,
        type: "sidework",
        name: t.task_name,
        status: t.status,
        priority: t.priority || "medium",
        due_time: t.due_time,
        requires_photo: t.requires_photo,
        photo_url: t.photo_url,
        notes: t.completion_notes,
        assigned: t.assigned_to_name,
        station: t.role || "Side Work",
        progress: null,
      })),
    ];

    // Group tasks by station
    const tasksByStation = {};
    allMyTasks
      .filter(t => !["completed", "approved"].includes(t.status))
      .filter(t => filter === "all" || (filter === "prep" && t.type === "prep") || (filter === "sidework" && t.type === "sidework"))
      .forEach(t => {
        if (!tasksByStation[t.station]) tasksByStation[t.station] = [];
        tasksByStation[t.station].push(t);
      });

    setData({
      allMyTasks,
      tasksByStation,
      tasksDue: allMyTasks.filter(t => !["completed", "approved"].includes(t.status)).length,
      completedTasks: allMyTasks.filter(t => ["completed", "approved"].includes(t.status)).length,
      totalTasks: allMyTasks.length,
    });
    setLoading(false);
  };

  useEffect(() => { if (user?.email) load(); }, [user?.email, filter]);

  const handleCompleteTask = async (task) => {
    haptics.medium();
    setCompletingTask(prev => ({ ...prev, [task.id]: true }));
    await new Promise(r => setTimeout(r, 150));
    setRemovingTask(prev => ({ ...prev, [task.id]: true }));
    await new Promise(r => setTimeout(r, 250));
    const updateData = { status: "completed", completed_at: new Date().toISOString(), completed_by: user?.email };
    if (task.type === "prep") await base44.entities.PrepItem.update(task.id, updateData);
    else await base44.entities.SideWorkAssignment.update(task.id, updateData);
    toast("Task Completed");
    setCompletingTask(prev => ({ ...prev, [task.id]: false }));
    setRemovingTask(prev => ({ ...prev, [task.id]: false }));
    await load();
  };

  const handleSectionComplete = (station) => {
    haptics.light();
    setCompletedSection(station);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <StandardPageShell title="Tasks">
      {completedSection && (
        <SectionCompleteMessage
          station={completedSection}
          onDismiss={() => setCompletedSection(null)}
        />
      )}

      {/* Progress */}
      {data && (
        <div className="text-center text-xs text-secondary-text mb-2">
          {data.completedTasks}/{data.totalTasks} done
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "all", label: "All" },
          { id: "prep", label: "Prep" },
          { id: "sidework", label: "Side Work" },
          { id: "cleaning", label: "Cleaning" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => { haptics.light(); setFilter(f.id); }}
            className={cn(
              "flex-shrink-0 h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
              filter === f.id
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-card border-border text-secondary-text hover:bg-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tasks Grouped by Station */}
      {data && Object.keys(data.tasksByStation).length > 0 ? (
        <div>
          {Object.entries(data.tasksByStation).map(([station, tasks]) => {
            const isStationComplete = tasks.length > 0 && tasks.every(t => removingTask[t.id]);
            if (isStationComplete && !completedSection) {
              handleSectionComplete(station);
            }
            return (
              <div key={station}>
                <GroupHeader station={station} count={tasks.length} />
                <div className="space-y-1">
                  {tasks.map(task => (
                    <SwipeableTaskCard
                      key={task.id}
                      task={task}
                      icon={task.type === "prep" ? ClipboardList : Flame}
                      onComplete={() => handleCompleteTask(task)}
                      completing={completingTask[task.id]}
                      isRemoving={removingTask[task.id]}
                      onSnooze={() => toast("Snooze coming soon")}
                      onReassign={() => toast("Reassign coming soon")}
                      onView={() => toast("View coming soon")}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {!allTasksComplete && setAllTasksComplete(true)}
          <CaughtUpEmptyState showAnimation />
        </div>
      )}
    </StandardPageShell>
  );
}

export const hideBase44Index = true;