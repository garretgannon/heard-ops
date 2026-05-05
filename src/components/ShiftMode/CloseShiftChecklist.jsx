import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, AlertCircle, Clock, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CloseShiftChecklist Component
 * Displays pre-close checks and blocks shift closing until resolved
 * 
 * Props:
 * - incompleteTasks: number of incomplete tasks
 * - missingLogs: number of missing temperature/chemical logs
 * - criticalIssues: array of open critical issues
 * - onReadyToClose: callback when all checks pass (returns true/false)
 * - isLoading: loading state
 * - onQuickFix: callback when user taps a check to fix it in modal
 * - quickFixMode: if true, show check items for inline fixing
 */
export default function CloseShiftChecklist({
  incompleteTasks = 0,
  missingLogs = 0,
  criticalIssues = [],
  onReadyToClose,
  isLoading = false,
  onQuickFix,
  quickFixMode = false,
}) {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(new Set());

  // Auto-update completion status
  useEffect(() => {
    const newCompleted = new Set();
    if (incompleteTasks === 0) newCompleted.add("tasks");
    if (missingLogs === 0) newCompleted.add("logs");
    if (criticalIssues.length === 0) newCompleted.add("issues");
    setCompleted(newCompleted);
  }, [incompleteTasks, missingLogs, criticalIssues]);

  const isAllClear = completed.size === 3;

  const handleCheckTap = (checkId) => {
    if (completed.has(checkId)) return;
    if (quickFixMode && onQuickFix) {
      onQuickFix(checkId);
    } else {
      const check = checks.find(c => c.id === checkId);
      if (check) navigate(check.navigateTo);
    }
  };

  const checks = [
    {
      id: "tasks",
      icon: AlertCircle,
      label: "Incomplete Tasks",
      count: incompleteTasks,
      countLabel: `${incompleteTasks} ${incompleteTasks === 1 ? "task" : "tasks"} remaining`,
      navigateTo: "/prep-lists",
      color: incompleteTasks > 0 ? "text-orange-400" : "text-emerald-400",
      bgColor: incompleteTasks > 0 ? "bg-orange-500/15" : "bg-emerald-500/15",
    },
    {
      id: "logs",
      icon: FileText,
      label: "Missing Logs",
      count: missingLogs,
      countLabel: `${missingLogs} ${missingLogs === 1 ? "log" : "logs"} needed`,
      navigateTo: "/temp-logs",
      color: missingLogs > 0 ? "text-orange-400" : "text-emerald-400",
      bgColor: missingLogs > 0 ? "bg-orange-500/15" : "bg-emerald-500/15",
    },
    {
      id: "issues",
      icon: Clock,
      label: "Critical Issues",
      count: criticalIssues.length,
      countLabel: `${criticalIssues.length} ${criticalIssues.length === 1 ? "issue" : "issues"} open`,
      navigateTo: "/issues",
      color: criticalIssues.length > 0 ? "text-red-400" : "text-emerald-400",
      bgColor: criticalIssues.length > 0 ? "bg-red-500/15" : "bg-emerald-500/15",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">Finish Your Shift</h1>
        <p className="text-xs text-muted-foreground mt-1">Complete remaining checks to close</p>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {checks.map((check) => {
          const Icon = check.icon;
          const isComplete = completed.has(check.id);
          return (
            <button
              key={check.id}
              onClick={() => handleCheckTap(check.id)}
              disabled={isComplete}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all active:scale-95",
                isComplete
                  ? "bg-emerald-500/10 border-emerald-500/20 opacity-60"
                  : `${check.bgColor} border-transparent`
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0", check.color === "text-red-400" ? "border-red-400" : check.color === "text-orange-400" ? "border-orange-400" : "border-gray-600")}>
                  <Icon className={cn("h-2.5 w-2.5", check.color)} />
                </div>
              )}
              
              <div className="flex-1 text-left min-w-0">
                <p className={cn("text-sm font-semibold", isComplete ? "line-through text-muted-foreground" : "text-foreground")}>
                  {check.label}
                </p>
                <p className={cn("text-xs mt-0.5", isComplete ? "text-muted-foreground" : check.color)}>
                  {check.countLabel}
                </p>
              </div>

              {!isComplete && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Status Message */}
      {isAllClear && (
        <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1.5 text-center">
          ✓ All clear! Ready to close shift
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={() => onReadyToClose && onReadyToClose()}
        disabled={!isAllClear || isLoading}
        className={cn(
          "w-full h-11 rounded-lg font-bold text-sm transition-all active:scale-95",
          isAllClear
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Closing...
          </div>
        ) : (
          "Continue to Handoff"
        )}
      </button>
    </div>
  );
}