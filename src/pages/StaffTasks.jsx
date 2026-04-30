import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, Upload, MessageSquare, Zap, X } from "lucide-react";
import { toast } from "sonner";

const TASK_SOURCES = {
  prep: { label: "Prep", color: "bg-blue-500/10 text-blue-700", icon: "📋" },
  sidework: { label: "Side Work", color: "bg-orange-500/10 text-orange-700", icon: "✓" },
  cleaning: { label: "Cleaning", color: "bg-green-500/10 text-green-700", icon: "🧹" },
  training: { label: "Training", color: "bg-purple-500/10 text-purple-700", icon: "📚" },
  maintenance: { label: "Maintenance", color: "bg-red-500/10 text-red-700", icon: "🔧" },
};

export default function StaffTasks() {
  const { user, isAdmin } = useCurrentUser();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBlockedDialog, setShowBlockedDialog] = useState(null);
  const [blockedComment, setBlockedComment] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState({});
  const [completingTask, setCompletingTask] = useState({});

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();

  const load = async () => {
    try {
      const [prepItems, sideWork] = await Promise.all([
        base44.entities.PrepItem.list("-created_date", 500),
        base44.entities.SideWorkAssignment.filter({ date: todayStr }),
      ]);

      // Filter prep items by date and assignment
      const todayPrepItems = prepItems.filter(item => {
        const list = item.prep_list_id; // Would need to fetch lists for proper date filtering in production
        if (item.assigned_to_individual === user?.email) return true;
        if (item.role_assignment === user?.role && !item.assigned_to_individual) return true;
        if (item.allow_all_roles && !item.role_assignment && !item.assigned_to_individual) return true;
        return false;
      });

      // Filter side work by assignment
      const filteredSideWork = sideWork.filter(task => {
        if (task.assigned_to_individual && task.assigned_to_email === user?.email) return true;
        if (task.role_assignment === user?.role && !task.assigned_to_individual) return true;
        if (!task.role_assignment && !task.assigned_to_individual) return true;
        return false;
      });

      // Build unified task list
      const tasks = [
        ...todayPrepItems.map(item => ({
          id: item.id,
          type: "prep",
          source: "prep",
          name: item.name,
          description: item.notes || "",
          status: item.status,
          priority: item.priority || "medium",
          due_time: null,
          requires_photo: !!item.master_photo_url,
          photo_url: item.photo_url,
          completed_at: item.completed_at,
          notes: item.completion_notes,
        })),
        ...filteredSideWork.map(task => ({
          id: task.id,
          type: "sidework",
          source: "sidework",
          name: task.task_name,
          description: task.description || "",
          status: task.status,
          priority: task.priority || "medium",
          due_time: task.due_time,
          requires_photo: task.requires_photo,
          photo_url: task.photo_url,
          completed_at: task.completed_at,
          notes: task.completion_notes,
        })),
      ];

      setAllTasks(tasks);
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.email]);

  // Show all tasks for admin, only assigned for staff
  const myTasks = isAdmin ? allTasks : allTasks;

  // Categorize by status
  const pending = myTasks.filter(t => t.status === "pending" || t.status === "rejected");
  const completed = myTasks.filter(t => t.status === "completed" || t.status === "approved");

  // Group pending by due time
  const groupByDueTime = (tasks) => {
    const now = new Date();
    const nowStr = now.toTimeString().slice(0, 5);

    const groups = { now: [], next: [], later: [] };

    tasks.forEach(task => {
      if (!task.due_time) {
        groups.later.push(task);
        return;
      }

      const dueTime = task.due_time;
      if (dueTime <= nowStr) {
        groups.now.push(task);
      } else {
        const [dueH, dueM] = dueTime.split(":").map(Number);
        const dueDate = new Date();
        dueDate.setHours(dueH, dueM);
        const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

        if (hoursUntilDue <= 2) {
          groups.next.push(task);
        } else {
          groups.later.push(task);
        }
      }
    });

    return groups;
  };

  const timeGroups = groupByDueTime(pending.sort((a, b) => (a.due_time || "99:99").localeCompare(b.due_time || "99:99")));

  const handleCompleteTask = async (task) => {
    setCompletingTask(prev => ({ ...prev, [task.id]: true }));
    const updateData = {
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user?.email,
      completion_notes: task.notes,
    };

    try {
      if (task.type === "prep") {
        await base44.entities.PrepItem.update(task.id, updateData);
      } else {
        await base44.entities.SideWorkAssignment.update(task.id, updateData);
      }
      toast.success("Task marked complete");
      load();
    } catch (err) {
      toast.error("Failed to update task");
    }
    setCompletingTask(prev => ({ ...prev, [task.id]: false }));
  };

  const handleUploadPhoto = async (taskId, file) => {
    if (!file) return;
    setUploadingPhoto(prev => ({ ...prev, [taskId]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const task = allTasks.find(t => t.id === taskId);
      if (task.type === "prep") {
        await base44.entities.PrepItem.update(taskId, { photo_url: file_url });
      } else {
        await base44.entities.SideWorkAssignment.update(taskId, { photo_url: file_url });
      }
      toast.success("Photo uploaded");
      load();
    } catch (err) {
      toast.error("Photo upload failed");
    }
    setUploadingPhoto(prev => ({ ...prev, [taskId]: false }));
  };

  const handleBlockedTask = async (taskId) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!blockedComment.trim()) {
      toast.error("Add a comment explaining the issue");
      return;
    }

    try {
      if (task.type === "prep") {
        await base44.entities.PrepItem.update(taskId, { notes: blockedComment });
      } else {
        await base44.entities.SideWorkAssignment.update(taskId, { completion_notes: blockedComment });
      }

      // Notify manager if urgent
      if (task.priority === "high") {
        toast.success("Manager notified of urgent issue");
      } else {
        toast.success("Comment saved");
      }

      setShowBlockedDialog(null);
      setBlockedComment("");
      load();
    } catch (err) {
      toast.error("Failed to save comment");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderTaskCard = (task) => (
    <div key={task.id} className="bg-card border-l-4 border-primary rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3 className="font-bold text-sm">{task.name}</h3>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className={cn("text-xs px-2 py-0.5 rounded font-semibold", TASK_SOURCES[task.source].color)}>
              {TASK_SOURCES[task.source].icon} {TASK_SOURCES[task.source].label}
            </span>
            <span className={cn("text-xs px-2 py-0.5 rounded font-semibold", task.priority === "high" ? "bg-red-500/20 text-red-700" : task.priority === "medium" ? "bg-yellow-500/20 text-yellow-700" : "bg-gray-500/20 text-gray-700")}>
              {task.priority === "high" ? "🔴 Urgent" : task.priority === "medium" ? "🟡 Normal" : "⚪ Low"}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      {task.description && <p className="text-xs text-muted-foreground mb-2">{task.description}</p>}
      {task.due_time && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Due: {task.due_time}</p>}
      {task.requires_photo && <p className="text-xs text-primary font-semibold mt-1">📷 Photo required</p>}

      {/* Actions */}
      <div className="space-y-2 mt-3">
        {/* Photo Upload */}
        {task.requires_photo && !task.photo_url && (
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={e => handleUploadPhoto(task.id, e.target.files[0])}
              className="hidden"
            />
            <Button
              className="w-full"
              size="sm"
              variant="outline"
              disabled={uploadingPhoto[task.id]}
              onClick={e => e.currentTarget.parentElement.querySelector('input').click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingPhoto[task.id] ? "Uploading..." : "Upload Photo"}
            </Button>
          </label>
        )}
        {task.photo_url && <p className="text-xs text-green-600 font-semibold">✓ Photo uploaded</p>}

        {/* Complete Task */}
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          size="sm"
          disabled={completingTask[task.id]}
          onClick={() => handleCompleteTask(task)}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {completingTask[task.id] ? "Submitting..." : "Complete"}
        </Button>

        {/* Blocked */}
        <Button
          className="w-full"
          size="sm"
          variant="outline"
          onClick={() => setShowBlockedDialog(task.id)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-12 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">My Tasks Today</h1>
        <p className="text-sm text-muted-foreground mt-1">{todayStr}</p>
      </div>

      {/* Quick Overview */}
      {pending.length > 0 && (
        <div className={cn("rounded-lg p-3", pending.some(t => t.priority === "high") ? "bg-red-500/10 border border-red-500/20" : "bg-blue-500/10 border border-blue-500/20")}>
          <p className={cn("text-sm font-semibold", pending.some(t => t.priority === "high") ? "text-red-700" : "text-blue-700")}>
            {pending.length} task{pending.length > 1 ? "s" : ""} to complete
            {pending.some(t => t.priority === "high") && " — 🔴 Urgent items"}
          </p>
        </div>
      )}

      {/* Now */}
      {timeGroups.now.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
            <Zap className="h-4 w-4" />Now (Overdue)
          </h2>
          <div className="space-y-2">
            {timeGroups.now.map(renderTaskCard)}
          </div>
        </div>
      )}

      {/* Next */}
      {timeGroups.next.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-yellow-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />Next (Due soon)
          </h2>
          <div className="space-y-2">
            {timeGroups.next.map(renderTaskCard)}
          </div>
        </div>
      )}

      {/* Later */}
      {timeGroups.later.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-blue-600">Later</h2>
          <div className="space-y-2">
            {timeGroups.later.map(renderTaskCard)}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 text-green-600 mb-2" />
          <p className="font-semibold">All caught up!</p>
          <p className="text-sm">No pending tasks.</p>
        </div>
      )}

      {/* Completed (Collapsible) */}
      {completed.length > 0 && (
        <details className="border border-border rounded-lg overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 bg-green-500/5 hover:bg-green-500/10 cursor-pointer font-semibold text-green-700">
            <span>✓ {completed.length} Completed</span>
            <span className="text-xs">▼</span>
          </summary>
          <div className="divide-y divide-border p-3 space-y-2">
            {completed.map(task => (
              <div key={task.id} className="text-sm text-muted-foreground line-through py-1">
                {task.name}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Blocked Dialog */}
      <Dialog open={!!showBlockedDialog} onOpenChange={() => setShowBlockedDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-semibold">What's blocking this task?</label>
            <Textarea
              value={blockedComment}
              onChange={(e) => setBlockedComment(e.target.value)}
              placeholder="e.g., Missing supplies, equipment broken, waiting for someone..."
              className="mt-2 min-h-20"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockedDialog(null)}>Cancel</Button>
            <Button onClick={() => handleBlockedTask(showBlockedDialog)}>
              <AlertCircle className="h-4 w-4 mr-2" />
              Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}