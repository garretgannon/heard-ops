import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { AlertTriangle, CheckCircle2, ListTodo, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ManagerDashboard() {
  const { user, isAdmin } = useCurrentUser();
  const [prepItems, setPrepItems] = useState([]);
  const [sideWorkTasks, setSideWorkTasks] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoDialog, setPhotoDialog] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!isAdmin) return;
    
    const load = async () => {
      const [pls, pi, sw, us] = await Promise.all([
        base44.entities.PrepList.filter({ date: todayStr }),
        base44.entities.PrepItem.list("-created_date", 500),
        base44.entities.SideWorkAssignment.filter({ date: todayStr }),
        base44.entities.User.list(),
      ]);
      
      setPrepLists(pls);
      setPrepItems(pi.filter(item => pls.some(pl => pl.id === item.prep_list_id)));
      setSideWorkTasks(sw);
      setUsers(us);
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

  // Combine tasks
  const allPrepTasks = prepItems.map(item => ({
    id: item.id,
    name: item.name,
    status: item.status,
    completed_by: item.completed_by,
    photo_url: item.photo_url,
    type: "prep",
    prep_list_id: item.prep_list_id,
  }));

  const allSideWorkTasks = sideWorkTasks.map(task => ({
    id: task.id,
    name: task.task_name || "Side Work Task",
    status: task.status === "approved" ? "completed" : task.status,
    assigned_to_name: task.assigned_to_name,
    assigned_to_email: task.assigned_to_email,
    photo_url: task.photo_url,
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

        {/* Missed */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-xs text-muted-foreground font-medium">INCOMPLETE</span>
          </div>
          <p className="text-3xl font-bold">{missed}</p>
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