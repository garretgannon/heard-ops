import { AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ShiftProgress Component
 * Displays shift completion metrics and progress bar
 * 
 * Props:
 * - tasks: total prep items
 * - tasksCompleted: completed prep items
 * - logs: temperature/chemical logs count
 * - logsNeeded: expected number of logs
 * - issues: array of open issues
 * - issuesResolved: count of resolved issues
 * - overdue: count of overdue items
 */
export default function ShiftProgress({
  tasks = 0,
  tasksCompleted = 0,
  logs = 0,
  logsNeeded = 4,
  issues = [],
  issuesResolved = 0,
  overdue = 0,
}) {
  // Calculate component percentages
  const taskPct = tasks > 0 ? (tasksCompleted / tasks) * 100 : 0;
  const logPct = logsNeeded > 0 ? Math.min((logs / logsNeeded) * 100, 100) : 0;
  const issueCount = issues.length;
  const issueResolvePct = issueCount > 0 ? (issuesResolved / issueCount) * 100 : 100;

  // Base progress from tasks and logs
  let progress = (taskPct + logPct) / 2; // Average of task and log completion

  // Issue resolution boosts progress
  progress = (progress * 0.7) + (issueResolvePct * 0.3); // Weight: 70% tasks/logs, 30% issues

  // Penalty for overdue items
  const overduePenalty = Math.min(overdue * 5, 20); // Max 20% penalty
  progress = Math.max(0, progress - overduePenalty);

  // Clamp to 0-100
  progress = Math.round(Math.min(Math.max(progress, 0), 100));

  // Determine status color
  const getProgressColor = () => {
    if (progress >= 90) return "bg-emerald-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="rounded-lg bg-card border border-border p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Shift Progress</h3>
        <span className={cn("text-sm font-bold", 
          progress >= 90 ? "text-emerald-400" : 
          progress >= 75 ? "text-blue-400" : 
          progress >= 50 ? "text-amber-400" : 
          "text-red-400"
        )}>
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", getProgressColor())}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Tasks */}
        <div className="flex items-center gap-2 text-[11px]">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <div>
            <p className="font-bold text-foreground">
              {tasksCompleted}/{tasks}
            </p>
            <p className="text-muted-foreground">Tasks</p>
          </div>
        </div>

        {/* Logs */}
        <div className="flex items-center gap-2 text-[11px]">
          <FileText className="h-3.5 w-3.5 text-teal-400 shrink-0" />
          <div>
            <p className="font-bold text-foreground">
              {logs}/{logsNeeded}
            </p>
            <p className="text-muted-foreground">Logs</p>
          </div>
        </div>

        {/* Issues */}
        <div className="flex items-center gap-2 text-[11px]">
          <AlertCircle className="h-3.5 w-3.5 text-orange-400 shrink-0" />
          <div>
            <p className="font-bold text-foreground">
              {issuesResolved}/{issueCount}
            </p>
            <p className="text-muted-foreground">Issues</p>
          </div>
        </div>

        {/* Overdue Indicator */}
        {overdue > 0 && (
          <div className="flex items-center gap-2 text-[11px]">
            <Clock className="h-3.5 w-3.5 text-red-400 shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-red-400">{overdue}</p>
              <p className="text-muted-foreground">Overdue</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      {overdue > 0 && (
        <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
          ⚠️ {overdue} overdue item{overdue > 1 ? "s" : ""} impacting progress
        </div>
      )}
    </div>
  );
}