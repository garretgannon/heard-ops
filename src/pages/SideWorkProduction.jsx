import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Search, AlertTriangle, Clock, Zap, Building2, ArrowUp, ArrowLeft } from "lucide-react";
import SideWorkCard from "../components/SideWorkProduction/SideWorkCard";
import UpdateStatusModal from "../components/SideWorkProduction/UpdateStatusModal";
import { cn } from "@/lib/utils";
import { format, isPast, differenceInMinutes } from "date-fns";

const ROLES = ["All", "Server", "Busser", "Host", "Bartender", "Expo"];
const SORT_OPTIONS = [
  { id: "due_time", label: "Due Time" },
  { id: "role", label: "Role" },
  { id: "priority", label: "Priority" },
  { id: "assigned", label: "Assigned" },
  { id: "status", label: "Status" },
];

export default function SideWorkProduction() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("due_time");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [scrollToTop, setScrollToTop] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [tasks, emps] = await Promise.all([
        base44.entities.SideWorkAssignment.list("-created_date", 500).catch(() => []),
        base44.entities.User.list().catch(() => []),
      ]);
      setTasks(tasks);
      setEmployees(emps);
      setLoading(false);
    };
    load();
  }, []);

  const getTaskStatus = (task) => {
    if (task.status === "rejected") return "rejected";
    if (task.status === "approved") return "complete";
    if (task.completion_status === "missed") return "missed";
    
    const now = new Date();
    const dueTime = task.due_time ? new Date(`${new Date().toISOString().split('T')[0]}T${task.due_time}`) : null;
    
    if (task.status === "completed" || task.status === "pending_review") {
      return task.status === "pending_review" ? "needs_review" : "complete";
    }
    
    if (!dueTime) return "on_track";
    
    const minutesTilDue = differenceInMinutes(dueTime, now);
    
    if (isPast(dueTime) && task.status !== "completed") return "overdue";
    if (minutesTilDue <= 60 && minutesTilDue > 0) return "due_soon";
    if (minutesTilDue <= 120 && task.priority === "high") return "behind";
    
    return "on_track";
  };

  const getStatusColor = (status) => {
    const colors = {
      complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      on_track: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      due_soon: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      behind: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      overdue: "bg-red-500/10 text-red-400 border-red-500/20",
      needs_review: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      missed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    return colors[status] || colors.on_track;
  };

  const getStatusLabel = (status) => {
    const labels = {
      complete: "Complete",
      on_track: "On Track",
      due_soon: "Due Soon",
      behind: "Behind",
      overdue: "Overdue",
      needs_review: "Needs Review",
      missed: "Missed",
    };
    return labels[status] || "Unknown";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "text-red-400",
      medium: "text-yellow-400",
      low: "text-blue-400",
    };
    return colors[priority] || "text-muted-foreground";
  };

  const filtered = useMemo(() => {
    return tasks.filter(task => {
      if (filter !== "All" && task.role_assignment !== filter) return false;
      if (search && !task.task_name.toLowerCase().includes(search.toLowerCase())) return false;
      return task.status !== "rejected";
    });
  }, [tasks, filter, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "due_time") {
      copy.sort((a, b) => (a.due_time || "").localeCompare(b.due_time || ""));
    } else if (sort === "role") {
      copy.sort((a, b) => (a.role_assignment || "").localeCompare(b.role_assignment || ""));
    } else if (sort === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      copy.sort((a, b) => (order[a.priority] || 3) - (order[b.priority] || 3));
    } else if (sort === "status") {
      const statusOrder = { overdue: 0, behind: 1, due_soon: 2, on_track: 3, complete: 4 };
      copy.sort((a, b) => (statusOrder[getTaskStatus(a)] || 5) - (statusOrder[getTaskStatus(b)] || 5));
    }
    return copy;
  }, [filtered, sort]);

  const stats = useMemo(() => {
    const total = tasks.filter(t => t.status !== "rejected").length;
    const complete = tasks.filter(t => t.status === "completed" || t.status === "approved").length;
    const overdue = tasks.filter(t => getTaskStatus(t) === "overdue").length;
    const high = tasks.filter(t => t.priority === "high" && t.status !== "completed").length;

    return {
      completion: total > 0 ? Math.round((complete / total) * 100) : 0,
      dueSoon: tasks.filter(t => getTaskStatus(t) === "due_soon").length,
      overdue,
      high,
    };
  }, [tasks]);

  const needsAttention = useMemo(() => {
    return sorted.filter(task => {
      const st = getTaskStatus(task);
      return st === "overdue" || st === "behind" || st === "due_soon" || st === "needs_review" ||
             (task.requires_approval && task.status === "completed") || task.priority === "high";
    });
  }, [sorted]);

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTask) return;
    const updated = await base44.entities.SideWorkAssignment.update(selectedTask.id, { 
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      completed_by: user?.email,
    });
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
    setSelectedTask(null);
  };

  const handlePhotoUpload = async (taskId, photoUrl) => {
    const updated = await base44.entities.SideWorkAssignment.update(taskId, { photo_url: photoUrl });
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
  };

  const handleReject = async (taskId) => {
    const updated = await base44.entities.SideWorkAssignment.update(taskId, { status: "rejected" });
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pb-32 bg-background min-h-screen">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Side Work Production</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">FOH task tracker for active shift</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 grid grid-cols-4 gap-1.5">
        <div className="bg-card border border-border rounded-lg p-2">
          <p className="text-2xl font-bold text-primary">{stats.completion}%</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Complete</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <p className="text-2xl font-bold text-yellow-400">{stats.dueSoon}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Due Soon</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Overdue</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">High Pr</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="px-4 py-3 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={cn(
                "flex-shrink-0 h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                filter === role
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card border-border text-muted-foreground"
              )}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="w-full h-8 px-2 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* NEEDS ATTENTION */}
      {needsAttention.length > 0 && (
        <div className="px-4 py-3 bg-red-500/5 border-b border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-xs font-bold text-red-400 uppercase">Needs Attention ({needsAttention.length})</p>
          </div>
          <div className="space-y-1.5">
            {needsAttention.slice(0, 3).map(task => {
              const st = getTaskStatus(task);
              const emp = employees.find(e => e.email === task.assigned_to_email);
              return (
                <div key={task.id} className="bg-card border border-red-500/20 rounded-lg p-2 flex items-start gap-2">
                  <div className={cn("h-6 w-6 rounded flex items-center justify-center shrink-0 text-[10px] font-bold", getStatusColor(st))}>
                    {st === "overdue" ? "!" : st === "behind" ? "↓" : "⏱"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{task.task_name}</p>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                      <span>{task.role_assignment}</span>
                      {task.due_time && <span>• {task.due_time}</span>}
                    </div>
                  </div>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", getStatusColor(st))}>
                    {getStatusLabel(st)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TASKS */}
      <div className="px-4 py-3 space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">No tasks for this filter</div>
        ) : (
          sorted.map(task => (
            <SideWorkCard
              key={task.id}
              task={task}
              status={getTaskStatus(task)}
              statusColor={getStatusColor(getTaskStatus(task))}
              statusLabel={getStatusLabel(getTaskStatus(task))}
              priorityColor={getPriorityColor(task.priority)}
              assignedEmployee={employees.find(e => e.email === task.assigned_to_email)}
              onMarkComplete={() => {
                setSelectedTask(task);
              }}
              onPhotoUpload={(url) => handlePhotoUpload(task.id, url)}
              onReject={() => handleReject(task.id)}
            />
          ))
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {selectedTask && (
        <UpdateStatusModal
          task={selectedTask}
          onSave={handleUpdateStatus}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* SCROLL TO TOP BUTTON */}
      {scrollToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-4 h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform z-20"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export const hideBase44Index = true;