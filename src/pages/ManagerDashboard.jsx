import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { AlertTriangle, CheckCircle2, ListTodo, Eye, Clock, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ShiftHandoffCard from "../components/ShiftHandoffCard";

export default function ManagerDashboard() {
  const { user, isAdmin } = useCurrentUser();
  const [prepItems, setPrepItems] = useState([]);
  const [sideWorkTasks, setSideWorkTasks] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoDialog, setPhotoDialog] = useState(null);
  const [latestHandoff, setLatestHandoff] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!isAdmin) return;
    
    const load = async () => {
      const [pls, pi, sw, us, handoffs] = await Promise.all([
        base44.entities.PrepList.filter({ date: todayStr }),
        base44.entities.PrepItem.list("-created_date", 500),
        base44.entities.SideWorkAssignment.filter({ date: todayStr }),
        base44.entities.User.list(),
        base44.entities.ShiftHandoff.filter({ date: todayStr }, "-created_date", 1),
      ]);
      
      setPrepLists(pls);
      setPrepItems(pi.filter(item => pls.some(pl => pl.id === item.prep_list_id)));
      setSideWorkTasks(sw);
      setUsers(us);
      if (handoffs.length > 0) setLatestHandoff(handoffs[0]);
      setLoading(false);
    };
    
    load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Manager access only</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Combine tasks with timing
  const allPrepTasks = prepItems.map(item => {
    const prepList = prepLists.find(pl => pl.id === item.prep_list_id);
    return {
      id: item.id,
      name: item.name,
      status: item.status,
      completed_by: item.completed_by,
      completed_at: item.completed_at,
      completion_status: item.completion_status,
      photo_url: item.photo_url,
      due_time: prepList?.due_time,
      shift_end_time: prepList?.shift_end_time,
      type: "prep",
      prep_list_id: item.prep_list_id,
    };
  });

  const allSideWorkTasks = sideWorkTasks.map(task => ({
    id: task.id,
    name: task.task_name || "Side Work Task",
    status: task.status === "approved" ? "completed" : task.status,
    assigned_to_name: task.assigned_to_name,
    assigned_to_email: task.assigned_to_email,
    completed_at: task.completed_at,
    completion_status: task.completion_status,
    photo_url: task.photo_url,
    due_time: task.due_time,
    shift_end_time: task.shift_end_time,
    type: "sidework",
  }));

  const allTasks = [...allPrepTasks, ...allSideWorkTasks];

  const completed = allTasks.filter(t => t.status === "completed").length;
  const missed = allTasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
  const total = allTasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Performance by employee
  const performanceMap = {};
  allTasks.forEach(task => {
    const name = task.completed_by || task.assigned_to_name || "Unassigned";
    if (!performanceMap[name]) {
      performanceMap[name] = { completed: 0, total: 0 };
    }
    performanceMap[name].total++;
    if (task.status === "completed") {
      performanceMap[name].completed++;
    }
  });

  const performance = Object.entries(performanceMap)
    .map(([name, stats]) => ({
      name,
      completed: stats.completed,
      total: stats.total,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // Issues (missed or incomplete)
  const issues = allTasks
    .filter(t => t.status !== "completed")
    .map(task => ({
      ...task,
      employee: task.completed_by || task.assigned_to_name || "Unassigned",
    }))
    .sort((a, b) => {
      const statusOrder = { pending: 0, in_progress: 1 };
      return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
    });

  // Completed tasks with timing breakdown
  const completedTasks = allTasks.filter(t => t.status === "completed");
  const onTimeTasks = completedTasks.filter(t => t.completion_status === "on_time").length;
  const lateTasks = completedTasks.filter(t => t.completion_status === "late").length;
  const missedTasks = allTasks.filter(t => t.completion_status === "missed").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">{todayStr}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="h-5 w-5 text-blue-500" />
            <span className="text-xs text-muted-foreground font-medium">TOTAL TASKS</span>
          </div>
          <p className="text-3xl font-bold">{total}</p>
        </div>

        {/* Completed */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-xs text-muted-foreground font-medium">COMPLETED</span>
          </div>
          <p className="text-3xl font-bold">{completed}</p>
          <p className="text-xs text-muted-foreground mt-1">{completionRate}%</p>
        </div>

        {/* Late */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-xs text-muted-foreground font-medium">LATE</span>
          </div>
          <p className="text-3xl font-bold">{lateTasks}</p>
        </div>

        {/* Missed */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-xs text-muted-foreground font-medium">MISSED</span>
          </div>
          <p className="text-3xl font-bold">{missedTasks}</p>
        </div>
      </div>

      {/* Completion Rate Bar */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Overall Progress</span>
          <span className="text-sm font-bold text-primary">{completionRate}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Latest Shift Handoff */}
      {latestHandoff && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Latest Shift Handoff</h2>
          <ShiftHandoffCard handoff={latestHandoff} />
        </div>
      )}

      {/* Employee Performance */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Team Performance</h2>
        <div className="space-y-2">
          {performance.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">No task data yet</p>
            </div>
          ) : (
            performance.map(emp => (
              <div
                key={emp.name}
                className="bg-card rounded-xl border border-border p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.completed}/{emp.total} tasks
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <span className="font-bold text-sm">{emp.rate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Completed Tasks Timing */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Completed Tasks - Timing ({completedTasks.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-3">
              <p className="text-xs text-muted-foreground font-medium">On Time</p>
              <p className="text-2xl font-bold text-green-600">{onTimeTasks}</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-3">
              <p className="text-xs text-muted-foreground font-medium">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{lateTasks}</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg border border-blue-500/30 p-3">
              <p className="text-xs text-muted-foreground font-medium">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{completedTasks.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {completedTasks.slice(0, 10).map(task => {
              const completedTime = task.completed_at ? new Date(task.completed_at).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}) : "Unknown";
              const statusColor = 
                task.completion_status === "late" ? "bg-yellow-500/10 border-yellow-500/30" :
                task.completion_status === "missed" ? "bg-red-500/10 border-red-500/30" :
                "bg-green-500/10 border-green-500/30";
              const statusLabel = 
                task.completion_status === "late" ? "Late" :
                task.completion_status === "missed" ? "Missed" :
                "On Time";
              const statusTextColor = 
                task.completion_status === "late" ? "text-yellow-600" :
                task.completion_status === "missed" ? "text-red-600" :
                "text-green-600";
              
              return (
                <div key={task.id} className={`rounded-lg border p-3 ${statusColor}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.name}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>{task.completed_by || task.assigned_to_name || "Unassigned"}</span>
                        <span>·</span>
                        <span>Completed: {completedTime}</span>
                        {task.due_time && <span>· Due: {task.due_time}</span>}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusTextColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Issues List */}
      {issues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Incomplete Tasks ({issues.length})</h2>
          </div>
          <div className="space-y-2">
            {issues.map(task => (
              <div
                key={task.id}
                className={`rounded-xl border p-3 transition-all ${
                  task.status === "pending"
                    ? "bg-red-500/5 border-red-500/30"
                    : "bg-yellow-500/5 border-yellow-500/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      <span>{task.employee}</span>
                      <span>·</span>
                      <span className={task.status === "pending" ? "text-red-600 font-medium" : "text-yellow-600 font-medium"}>
                        {task.status === "pending" ? "Not Started" : "In Progress"}
                      </span>
                      {task.due_time && <span>· Due: {task.due_time}</span>}
                    </div>
                  </div>
                  {task.photo_url && (
                    <button
                      onClick={() => setPhotoDialog(task.photo_url)}
                      className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {issues.length === 0 && (
        <div className="bg-green-500/5 rounded-2xl border border-green-500/30 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-sm text-green-700">All tasks completed!</p>
        </div>
      )}

      {/* Photo Preview Dialog */}
      <Dialog open={!!photoDialog} onOpenChange={open => !open && setPhotoDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Photo</DialogTitle>
          </DialogHeader>
          {photoDialog && (
            <img src={photoDialog} alt="Task completion" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}