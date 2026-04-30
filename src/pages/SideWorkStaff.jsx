import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useCurrentUser } from "../hooks/useCurrentUser";
import SideWorkTaskCard from "../components/sidework/SideWorkTaskCard";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const ROLES = [
  { value: "server", label: "Server" },
  { value: "bartender", label: "Bartender" },
  { value: "host", label: "Host" },
  { value: "busser", label: "Busser" },
  { value: "food_runner", label: "Food Runner" },
];

const SHIFTS = [
  { value: "opening", label: "Opening" },
  { value: "mid", label: "Mid-Shift" },
  { value: "closing", label: "Closing" },
];

export default function SideWorkStaff() {
  const { user } = useCurrentUser();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");

  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    const data = await base44.entities.SideWorkAssignment.filter({ date: todayStr });
    setAssignments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // My assignments: role-based or individually assigned
  const myAssignments = assignments.filter(a => {
    // Show if assigned to user individually
    if (a.assigned_to_individual && a.assigned_to_email === user?.email) {
      const roleMatch = roleFilter === "all" || a.role === roleFilter;
      const shiftMatch = shiftFilter === "all" || a.shift_type === shiftFilter;
      return roleMatch && shiftMatch;
    }
    // Show if assigned to user's role
    if (a.role_assignment === user?.role && !a.assigned_to_individual) {
      const roleMatch = roleFilter === "all" || a.role === roleFilter;
      const shiftMatch = shiftFilter === "all" || a.shift_type === shiftFilter;
      return roleMatch && shiftMatch;
    }
    // Show if no role assignment (available to all)
    if (!a.role_assignment && !a.assigned_to_individual) {
      const roleMatch = roleFilter === "all" || a.role === roleFilter;
      const shiftMatch = shiftFilter === "all" || a.shift_type === shiftFilter;
      return roleMatch && shiftMatch;
    }
    return false;
  });

  const pending = myAssignments.filter(a => a.status === "pending" || a.status === "rejected");
  const inReview = myAssignments.filter(a => a.status === "completed");
  const done = myAssignments.filter(a => a.status === "approved");

  const total = myAssignments.length;
  const completedCount = done.length + inReview.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Side Work</h1>
        <p className="text-muted-foreground mt-1">Today — {todayStr}</p>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Shift Progress</span>
            <span className="text-muted-foreground">{completedCount}/{total} tasks</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-400" />{pending.length} to do</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-yellow-400" />{inReview.length} in review</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" />{done.length} approved</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          <button onClick={() => setRoleFilter("all")} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", roleFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>All Roles</button>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setRoleFilter(r.value)} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", roleFilter === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{r.label}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          <button onClick={() => setShiftFilter("all")} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", shiftFilter === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>All</button>
          {SHIFTS.map(s => (
            <button key={s.value} onClick={() => setShiftFilter(s.value)} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", shiftFilter === s.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>{s.label}</button>
          ))}
        </div>
      </div>

      {myAssignments.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          No side work tasks assigned for today.
        </div>
      )}

      {/* To Do */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" /> To Do ({pending.length})
          </h2>
          {pending.map(a => (
            <SideWorkTaskCard key={a.id} assignment={a} currentUser={user} isManager={false} onRefresh={load} />
          ))}
        </div>
      )}

      {/* In Review */}
      {inReview.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-400" /> Pending Approval ({inReview.length})
          </h2>
          {inReview.map(a => (
            <SideWorkTaskCard key={a.id} assignment={a} currentUser={user} isManager={false} onRefresh={load} />
          ))}
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Approved ({done.length})
          </h2>
          {done.map(a => (
            <SideWorkTaskCard key={a.id} assignment={a} currentUser={user} isManager={false} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}