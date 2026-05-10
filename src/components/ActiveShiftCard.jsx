import { Clock, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";

export default function ActiveShiftCard({
  shift,
  completionPct = 0,
  overdueCount = 0,
  reviewCount = 0,
  dueCount = 0,
  criticalAlertCount = 0,
  onViewPlan,
  onEndShift,
}) {
  const elapsedTime = shift?.start_time
    ? (() => {
        const start = new Date(shift.start_time);
        const now = new Date();
        const ms = now - start;
        const hours = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${mins}m`;
      })()
    : "0h 0m";

  const shiftName = shift?.shift_type
    ? shift.shift_type.charAt(0).toUpperCase() + shift.shift_type.slice(1)
    : "Shift";

  return (
    <div className="bg-gradient-to-br from-card via-card to-card/80 border border-border/50 rounded-2xl p-4 space-y-4 shadow-lg">
      {/* Header: Status + Name + Time */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-foreground">{shiftName} Shift</p>
            <p className="text-[11px] text-secondary-text flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {elapsedTime} elapsed
            </p>
          </div>
        </div>
      </div>

      {/* Operational Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Completion % */}
        <div className="bg-muted/40 border border-border/30 rounded-xl p-2.5">
          <p className="text-[10px] text-secondary-text font-semibold uppercase tracking-wider">
            Complete
          </p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <p className="text-2xl font-extrabold text-primary">{completionPct}%</p>
          </div>
          {completionPct > 0 && (
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className={cn(
          "border border-border/30 rounded-xl p-2.5",
          overdueCount > 0
            ? "bg-red-500/10 border-red-500/20"
            : "bg-muted/40"
        )}>
          <p className="text-[10px] text-secondary-text font-semibold uppercase tracking-wider">
            Overdue
          </p>
          <p className={cn(
            "text-2xl font-extrabold mt-1.5",
            overdueCount > 0 ? "text-red-400" : "text-foreground"
          )}>
            {overdueCount}
          </p>
        </div>

        {/* Due Soon */}
        <div className={cn(
          "border border-border/30 rounded-xl p-2.5",
          dueCount > 0
            ? "bg-amber-500/10 border-amber-500/20"
            : "bg-muted/40"
        )}>
          <p className="text-[10px] text-secondary-text font-semibold uppercase tracking-wider">
            Due Soon
          </p>
          <p className={cn(
            "text-2xl font-extrabold mt-1.5",
            dueCount > 0 ? "text-amber-400" : "text-foreground"
          )}>
            {dueCount}
          </p>
        </div>

        {/* Review */}
        <div className={cn(
          "border border-border/30 rounded-xl p-2.5",
          reviewCount > 0
            ? "bg-blue-500/10 border-blue-500/20"
            : "bg-muted/40"
        )}>
          <p className="text-[10px] text-secondary-text font-semibold uppercase tracking-wider">
            Review
          </p>
          <p className={cn(
            "text-2xl font-extrabold mt-1.5",
            reviewCount > 0 ? "text-blue-400" : "text-foreground"
          )}>
            {reviewCount}
          </p>
        </div>
      </div>

      {/* Critical Alert Badge (if any) */}
      {criticalAlertCount > 0 && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-2.5 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-xs font-bold text-red-300">{criticalAlertCount} critical alert{criticalAlertCount !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => {
            haptics.medium();
            onViewPlan?.();
          }}
          className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:brightness-110 shadow-lg shadow-primary/30"
        >
          <ChevronRight className="h-4 w-4" />
          View Plan
        </button>
        <button
          onClick={() => {
            haptics.light();
            onEndShift?.();
          }}
          className="flex-1 h-10 rounded-lg border border-border bg-muted text-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-muted/80"
        >
          End
        </button>
      </div>
    </div>
  );
}