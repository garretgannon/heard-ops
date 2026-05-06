import { Activity, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";

export default function ActiveShiftCard({ shift, completionPct, overdueCount, reviewCount, onViewPlan, onEndShift }) {
  const startTime = shift?.start_time ? new Date(shift.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
  const elapsedMinutes = shift?.start_time ? Math.floor((Date.now() - new Date(shift.start_time)) / 60000) : 0;
  const elapsedStr = elapsedMinutes < 60 
    ? `${elapsedMinutes}m` 
    : `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`;

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-3">
      {/* Top Row: Status + Name + Time */}
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">{shift?.name || "Shift"}</p>
            <p className="text-[9px] text-secondary-text">{startTime} · {elapsedStr}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/30 rounded-lg p-2">
          <p className="text-xs font-bold text-foreground">{completionPct}%</p>
          <p className="text-[8px] text-muted-foreground">Complete</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
          <p className="text-xs font-bold text-red-400">{overdueCount}</p>
          <p className="text-[8px] text-red-300">Overdue</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
          <p className="text-xs font-bold text-amber-400">{reviewCount}</p>
          <p className="text-[8px] text-amber-300">Review</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            haptics.light?.();
            onViewPlan?.();
          }}
          className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Eye className="h-3.5 w-3.5" />
          Plan
        </button>
        <button
          onClick={() => {
            haptics.light?.();
            onEndShift?.();
          }}
          className="flex-1 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold active:scale-95 transition-all hover:bg-red-500/20"
        >
          <X className="h-3.5 w-3.5 inline mr-1" />
          End
        </button>
      </div>
    </div>
  );
}