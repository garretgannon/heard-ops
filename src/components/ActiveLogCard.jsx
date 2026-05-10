import { Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  not_started: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", label: "Not Started" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "In Progress" },
  needs_review: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Needs Review" },
  flagged: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", label: "Flagged" },
  overdue: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", label: "Overdue" },
  completed: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", label: "Completed" },
};

export default function ActiveLogCard({ log, onAction }) {
  const config = statusConfig[log.status] || statusConfig.not_started;
  const Icon = log.priority === "critical" ? AlertTriangle : log.priority === "high" ? AlertCircle : Clock;

  return (
    <button
      onClick={() => onAction?.(log)}
      className={cn(
        "w-full text-left bg-card border rounded-lg p-3 transition-all active:scale-95",
        config.border,
        "hover:bg-muted"
      )}
    >
      <div className="space-y-2">
        {/* Top Row: Type + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{log.type}</p>
            <p className="text-[9px] text-muted-foreground truncate">{log.department} • {log.location}</p>
          </div>
          <span className={cn("text-[9px] font-bold px-2 py-1 rounded-full border whitespace-nowrap", config.bg, config.text, config.border)}>
            {config.label}
          </span>
        </div>

        {/* Middle Row: Person + Role */}
        {(log.person || log.role) && (
          <div className="text-[9px] text-secondary-text">
            {log.person && <span>{log.person}</span>}
            {log.person && log.role && <span> • </span>}
            {log.role && <span className="text-muted-foreground">{log.role}</span>}
          </div>
        )}

        {/* Bottom Row: Time + Priority */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{log.lastUpdated ? formatDistanceToNow(new Date(log.lastUpdated), { addSuffix: true }) : "—"}</span>
          </div>
          {log.dueTime && (
            <div className="flex items-center gap-1 text-[9px] text-amber-400">
              <Icon className="h-3 w-3" />
              <span>{log.dueTime}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}