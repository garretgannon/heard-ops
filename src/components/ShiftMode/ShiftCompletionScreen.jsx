import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShiftCompletionScreen({
  tasksCompletedPct = 100,
  logsCompletedPct = 100,
  issuesLeftOpen = 0,
  coverageRating = 5,
  shiftScore = 95,
  onDone,
}) {
  // Calculate score: tasks (40%) + logs (40%) + issues (20%)
  const calculatedScore = Math.round(
    tasksCompletedPct * 0.4 + logsCompletedPct * 0.4 + (issuesLeftOpen === 0 ? 100 : Math.max(0, 100 - issuesLeftOpen * 20))
  );

  const finalScore = shiftScore || calculatedScore;

  let message = "Room to improve";
  let messageColor = "text-amber-400";

  if (finalScore >= 95) {
    message = "Perfect Close 🔥";
    messageColor = "text-emerald-400";
  } else if (finalScore >= 80) {
    message = "Strong Shift 💪";
    messageColor = "text-blue-400";
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
      {/* Success Checkmark */}
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
        <CheckCircle2 className="h-24 w-24 text-emerald-400 relative" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">Shift Complete</h1>

      {/* Performance Score */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 rounded-2xl p-6 w-full">
        <p className="text-5xl font-bold text-primary">{finalScore}</p>
        <p className="text-xs text-muted-foreground font-semibold uppercase mt-1">Score</p>
      </div>

      {/* Message */}
      <p className={cn("text-lg font-bold", messageColor)}>{message}</p>

      {/* Performance Breakdown */}
      <div className="w-full grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-sm font-bold text-blue-400">{tasksCompletedPct}%</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-1">Tasks</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-sm font-bold text-emerald-400">{logsCompletedPct}%</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-1">Logs</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-sm font-bold text-amber-400">{issuesLeftOpen}</p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-1">Issues Open</p>
        </div>
      </div>

      {/* Coverage Rating */}
      {coverageRating > 0 && (
        <div className="w-full bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Coverage</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold",
                    i < coverageRating
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-border/50 text-muted-foreground border border-border"
                  )}
                >
                  ★
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Done Button */}
      <button
        onClick={onDone}
        className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-95 mt-4"
      >
        Done
      </button>
    </div>
  );
}