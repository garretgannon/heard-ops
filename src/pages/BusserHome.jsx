import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Circle, Loader2, Clock, Wrench, FileText, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BusserHome() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [sideWork, setSideWork] = useState([]);
  const [bathroomChecks, setBathroomChecks] = useState([]);
  const [preShift, setPreShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;

      const [sideWorkData, bathroomData, preShiftData] = await Promise.all([
        base44.entities.SideWorkAssignment.filter({
          assigned_to_email: user.email,
          date: todayStr,
        }),
        base44.entities.BathroomCheckLog.filter({
          assigned_to_email: user.email,
          date: todayStr,
        }),
        base44.entities.PreShift.filter({ date: todayStr }),
      ]);

      const order = { pending: 0, rejected: 1, completed: 2, approved: 3 };
      sideWorkData.sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0));

      setSideWork(sideWorkData);
      setBathroomChecks(bathroomData);
      setPreShift(preShiftData?.[0] || null);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleCompleteTask = async (task) => {
    setSaving(task.id);
    await base44.entities.SideWorkAssignment.update(task.id, {
      status: task.requires_approval ? "completed" : "approved",
      completed_at: new Date().toISOString(),
      completed_by: user?.full_name || user?.email,
    });
    setSaving(null);
    toast.success("Task completed!");
    const updated = await base44.entities.SideWorkAssignment.filter({
      assigned_to_email: user.email,
      date: todayStr,
    });
    const order = { pending: 0, rejected: 1, completed: 2, approved: 3 };
    updated.sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0));
    setSideWork(updated);
  };

  const handleCompleteBathroom = async (check) => {
    setSaving(check.id);
    await base44.entities.BathroomCheckLog.update(check.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user?.full_name || user?.email,
    });
    setSaving(null);
    toast.success("Bathroom check logged!");
    const updated = await base44.entities.BathroomCheckLog.filter({
      assigned_to_email: user.email,
      date: todayStr,
    });
    setBathroomChecks(updated);
  };

  const pendingTasks = sideWork.filter(t => !["approved", "completed"].includes(t.status));
  const completedTasks = sideWork.filter(t => ["approved", "completed"].includes(t.status));
  const pendingBathroom = bathroomChecks.filter(b => b.status !== "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground/80 rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg mx-auto pb-20 space-y-4"
    >
      {/* Greeting */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-medium">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-3xl font-bold">{greeting()}, {firstName}.</h1>
      </div>

      {/* Pre-Shift Notes */}
      {preShift && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm">
          <p className="font-semibold mb-1">📋 Today's Notes</p>
          <p className="text-sm text-foreground">{preShift.notes || preShift.issues || "No notes"}</p>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => navigate("/bathroom-checks")}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-1 text-sm font-semibold"
        >
          <AlertCircle className="h-6 w-6" />
          <span>Bathroom</span>
        </Button>
        <Button
          onClick={() => navigate("/maintenance")}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-1 text-sm font-semibold"
        >
          <Wrench className="h-6 w-6" />
          <span>Report Issue</span>
        </Button>
      </div>

      {/* Bathroom Checks */}
      {bathroomChecks.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">Bathroom Checks ({pendingBathroom.length})</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
            {bathroomChecks.map(check => (
              <div
                key={check.id}
                className={cn(
                  "p-3 flex items-center justify-between",
                  check.status === "completed" && "opacity-50"
                )}
              >
                <div>
                  <p className="font-medium text-sm">{check.location || "Bathroom"}</p>
                  {check.due_time && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> {check.due_time}
                  </p>}
                </div>
                {check.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={saving === check.id}
                    onClick={() => handleCompleteBathroom(check)}
                  >
                    {saving === check.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Done"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side Work - Pending */}
      {pendingTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">My Tasks ({pendingTasks.length})</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
            {pendingTasks.map(task => (
              <div
                key={task.id}
                className="p-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{task.task_name}</p>
                  {task.due_time && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {task.due_time}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="text-xs flex-shrink-0"
                  disabled={saving === task.id}
                  onClick={() => handleCompleteTask(task)}
                >
                  {saving === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Done"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side Work - Completed (Collapsible) */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1"
          >
            {showCompleted ? "▼" : "▶"} Completed ({completedTasks.length})
          </button>
          {showCompleted && (
            <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border opacity-60">
              {completedTasks.map(task => (
                <div key={task.id} className="p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                  <p className="text-sm line-through text-muted-foreground">{task.task_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {pendingTasks.length === 0 && pendingBathroom.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-2"
        >
          <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-3" />
          <p className="font-semibold">All set!</p>
          <p className="text-sm text-muted-foreground">All tasks completed for now.</p>
        </motion.div>
      )}
    </motion.div>
  );
}