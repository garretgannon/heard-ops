import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Circle, AlertCircle, BookOpen, ClipboardList,
  MessageSquare, Flag, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function StaffHome() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [preShift, setPreShift] = useState(null);
  const [sideWork, setSideWork] = useState([]);
  const [training, setTraining] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;

      const [tasksData, preShiftData, sideWorkData] = await Promise.all([
        base44.entities.SideWorkAssignment.filter({
          assigned_to_email: user.email,
          date: todayStr,
          status: { $ne: "completed" }
        }),
        base44.entities.PreShift.filter({ date: todayStr }),
        base44.entities.SideWorkAssignment.filter({
          assigned_to_email: user.email,
          date: todayStr
        })
      ]);

      setTasks(tasksData.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      }));

      setPreShift(preShiftData?.[0] || null);
      setSideWork(sideWorkData);
      setLoading(false);
    };
    load();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const pendingTasks = tasks.filter(t => t.status !== "completed").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold">
          {greeting()}, {user?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{todayStr}</p>
      </div>

      {/* Pre-Shift Notes */}
      {preShift && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Today's Briefing</h2>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line">{preShift.notes || preShift.issues || "No notes yet"}</p>
        </motion.div>
      )}

      {/* My Tasks Today */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              My Tasks ({pendingTasks} left)
            </h2>
            {pendingTasks === 0 && <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">All done!</span>}
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-secondary/50 transition ${
                  task.status === "completed" ? "bg-accent/5" : ""
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {task.task_name}
                  </p>
                  {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                  {task.due_time && (
                    <p className="text-xs text-muted-foreground mt-1">Due: {task.due_time}</p>
                  )}
                </div>
                {task.priority && (
                  <span className={`text-xs px-2 py-1 rounded flex-shrink-0 font-semibold ${
                    task.priority === "high" ? "bg-destructive/20 text-destructive" :
                    task.priority === "medium" ? "bg-yellow-500/20 text-yellow-600" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {task.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate("/today")}>
            View All Tasks <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* Side Work */}
      {sideWork.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Side Work ({sideWork.filter(s => s.status !== "completed").length})
          </h2>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground mb-2">{sideWork.length} items assigned</p>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/side-work")}>
              View Side Work <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 gap-3"
      >
        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-1 text-xs"
          onClick={() => navigate("/bar-book")}
        >
          <BookOpen className="h-5 w-5" />
          <span>Bar Book</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-1 text-xs"
          onClick={() => navigate("/pre-shift")}
        >
          <MessageSquare className="h-5 w-5" />
          <span>Briefing</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-1 text-xs col-span-2"
          onClick={() => navigate("/home")}
        >
          <Flag className="h-5 w-5" />
          <span>Report a Problem</span>
        </Button>
      </motion.div>

      {/* Empty State */}
      {tasks.length === 0 && !preShift && sideWork.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-lg p-8 text-center space-y-2"
        >
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-medium">All clear for today!</p>
          <p className="text-sm text-muted-foreground">No tasks or briefings yet.</p>
        </motion.div>
      )}
    </motion.div>
  );
}