import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { CheckCircle2, Circle, Camera, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BusserHome() {
  const { user } = useCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [uploading, setUploading] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const load = async () => {
    const all = await base44.entities.SideWorkAssignment.filter({ date: todayStr });
    const mine = all.filter(a => {
      const roleMatch = a.role === (user?.role || "busser");
      const shiftMatch = a.shift_type === "opening";
      const assignedMatch = !a.assigned_to_email || a.assigned_to_email === user?.email;
      return roleMatch && shiftMatch && assignedMatch;
    });
    // Sort: pending/rejected first, then completed, approved last
    const order = { pending: 0, rejected: 1, completed: 2, approved: 3 };
    mine.sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0));
    setTasks(mine);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleComplete = async (task, file) => {
    setSaving(task.id);
    let photo_url = task.photo_url || "";
    if (file) {
      setUploading(task.id);
      const res = await base44.integrations.Core.UploadFile({ file });
      photo_url = res.file_url;
      setUploading(null);
    }
    await base44.entities.SideWorkAssignment.update(task.id, {
      status: task.requires_approval ? "completed" : "approved",
      photo_url,
      completed_at: new Date().toISOString(),
      completed_by: user?.display_name || user?.full_name || user?.email,
      rejection_notes: "",
    });
    setSaving(null);
    toast.success(task.requires_approval ? "Submitted for review" : "Done!");
    load();
  };

  const done = tasks.filter(t => t.status === "approved" || t.status === "completed").length;
  const total = tasks.length;
  const progress = total > 0 ? done / total : 0;

  const firstName = user?.display_name || user?.full_name?.split(" ")[0] || "there";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground/80 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-0 pb-16 space-y-8 pt-2">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-1"
      >
        <p className="text-sm text-muted-foreground font-medium">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {firstName}.
        </h1>
        <p className="text-muted-foreground">Opening side work</p>
      </motion.div>

      {/* Progress ring + summary */}
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-5 bg-card rounded-2xl border border-border/60 p-5"
        >
          {/* Thin progress circle */}
          <div className="relative h-16 w-16 flex-shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="23" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <motion.circle
                cx="28" cy="28" r="23" fill="none"
                stroke="hsl(var(--accent))" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 23}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 23 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 23 * (1 - progress) }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{Math.round(progress * 100)}%</span>
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold">{done} of {total} complete</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total - done > 0 ? `${total - done} task${total - done !== 1 ? "s" : ""} remaining` : "All done — great work!"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 space-y-2"
        >
          <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-4" />
          <p className="font-semibold text-lg">Nothing assigned yet</p>
          <p className="text-sm text-muted-foreground">Check back with your manager for today's opening tasks.</p>
        </motion.div>
      )}

      {/* Checklist */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border/60 overflow-hidden"
        >
          {tasks.map((task, i) => {
            const isApproved = task.status === "approved";
            const isCompleted = task.status === "completed";
            const isRejected = task.status === "rejected";
            const isDone = isApproved || isCompleted;
            const isBusy = saving === task.id || uploading === task.id;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 transition-colors",
                  i < tasks.length - 1 && "border-b border-border/50",
                  isDone && "opacity-60"
                )}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  {isBusy ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  ) : isApproved ? (
                    <CheckCircle2 className="h-6 w-6 text-accent" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-yellow-400" />
                  ) : (
                    task.requires_photo ? (
                      <label className="cursor-pointer">
                        <Circle className="h-6 w-6 text-muted-foreground/40 hover:text-primary transition-colors" />
                        <input
                          type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={e => e.target.files[0] && handleComplete(task, e.target.files[0])}
                        />
                      </label>
                    ) : (
                      <button onClick={() => handleComplete(task, null)}>
                        <Circle className="h-6 w-6 text-muted-foreground/40 hover:text-primary transition-colors" />
                      </button>
                    )
                  )}
                </div>

                {/* Task name + meta */}
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium", isDone && "line-through text-muted-foreground")}>
                    {task.task_name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {task.due_time && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{task.due_time}
                      </span>
                    )}
                    {task.requires_photo && !isDone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Camera className="h-3 w-3" />Photo required
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs text-yellow-400">Pending review</span>
                    )}
                    {isRejected && task.rejection_notes && (
                      <span className="text-xs text-red-400">Rejected — redo</span>
                    )}
                  </div>
                </div>

                {/* Photo proof thumbnail */}
                {task.photo_url && (
                  <img src={task.photo_url} alt="Proof" className="h-10 w-10 rounded-lg object-cover border border-border flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}