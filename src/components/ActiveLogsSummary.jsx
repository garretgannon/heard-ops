import { AlertCircle, Clock, CheckCircle2, AlertTriangle, Eye } from "lucide-react";

export default function ActiveLogsSummary({ stats }) {
  return (
    <div className="px-4 py-3 space-y-2 bg-card border-b border-border">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 rounded-lg p-2.5">
          <p className="text-xs font-bold text-foreground">{stats.totalActive}</p>
          <p className="text-[9px] text-muted-foreground">Active Today</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2.5 border border-red-500/20">
          <p className="text-xs font-bold text-red-400">{stats.overdue}</p>
          <p className="text-[9px] text-red-300">Overdue</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg p-2.5 border border-amber-500/20">
          <p className="text-xs font-bold text-amber-400">{stats.needsReview}</p>
          <p className="text-[9px] text-amber-300">Review</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-2.5 border border-green-500/20">
          <p className="text-xs font-bold text-green-400">{stats.completed}</p>
          <p className="text-[9px] text-green-300">Completed</p>
        </div>
      </div>
    </div>
  );
}