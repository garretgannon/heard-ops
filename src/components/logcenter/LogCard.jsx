import { format } from "date-fns";
import { ChevronRight, MapPin, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOG_TYPE_CONFIG, STATUS_META, PRIORITY_COLORS } from "./logConfig";

export default function LogCard({ log, onClick, compact = false }) {
  const cfg = LOG_TYPE_CONFIG[log.type] || LOG_TYPE_CONFIG.issue;
  const Icon = cfg.icon;
  const statusMeta = STATUS_META[log.status] || STATUS_META.not_started;
  const priorityCls = PRIORITY_COLORS[log.priority] || "";

  let timeStr = "";
  if (log.ts) {
    try { timeStr = format(new Date(log.ts), "MMM d, h:mm a"); } catch {}
  }

  return (
    <button
      onClick={() => onClick?.(log)}
      className={cn(
        "w-full text-left bg-card border border-border/60 border-l-4 rounded-xl transition-all active:scale-[0.98] hover:border-border group",
        cfg.border,
        compact ? "px-3 py-2.5" : "px-3.5 py-3"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
          <Icon className={cn("h-4 w-4", cfg.text)} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Row 1: title + status */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-foreground leading-tight truncate">{log.title}</p>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 leading-none", statusMeta.cls)}>
              {statusMeta.label}
            </span>
          </div>

          {/* Row 2: subtitle */}
          {log.subtitle && (
            <p className="text-[11px] text-muted-foreground truncate">{log.subtitle}</p>
          )}

          {/* Row 3: chips */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none", cfg.badge)}>
              {cfg.label}
            </span>

            {(log.priority === "critical" || log.priority === "high") && (
              <span className={cn("text-[10px] font-bold uppercase", priorityCls)}>
                {log.priority}
              </span>
            )}

            {log.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />{log.location}
              </span>
            )}

            {log.person && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate max-w-[120px]">
                <User className="h-2.5 w-2.5 shrink-0" />{log.person}
              </span>
            )}

            {log.department && (
              <span className="text-[10px] text-muted-foreground">{log.department}</span>
            )}

            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
              <Clock className="h-2.5 w-2.5" />{timeStr}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-2 transition-colors" />
      </div>
    </button>
  );
}