import { format } from "date-fns";
import { ChevronRight, User, Clock, Camera, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOG_TYPES, STATUS_META } from "./logConfig";

export default function LogCard({ log, onClick, compact = false }) {
  const cfg  = LOG_TYPES[log.type] || LOG_TYPES.issue;
  const Icon = cfg.icon;
  const statusMeta = STATUS_META[log.status] || STATUS_META.not_started;

  let timeStr = "";
  if (log.ts) { try { timeStr = format(new Date(log.ts), "MMM d, h:mm a"); } catch {} }

  return (
    <button
      onClick={() => onClick?.(log)}
      className={cn(
        "w-full text-left card-glass border border-border/60 border-l-4 rounded-xl transition-all active:scale-[0.98] hover:border-border group",
        cfg.border,
        compact ? "px-3 py-2.5" : "px-3.5 py-3"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
          <Icon className={cn("h-4 w-4", cfg.color)} />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-foreground leading-tight truncate">{log.title}</p>
            <span className={cn("status-pill shrink-0 whitespace-nowrap", statusMeta.cls)}>
              {statusMeta.label}
            </span>
          </div>

          {log.subtitle && (
            <p className="text-[11px] text-muted-foreground truncate">{log.subtitle}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
            <span className={cn("status-pill", cfg.badge)}>{cfg.label}</span>

            {(log.priority === "critical" || log.priority === "high") && (
              <span className={cn("text-[10px] font-bold uppercase",
                log.priority === "critical" ? "text-red-400" : "text-orange-400")}>
                {log.priority}
              </span>
            )}

            {log.station && (
              <span className="text-[10px] text-muted-foreground">{log.station}</span>
            )}
            {log.area && !log.station && (
              <span className="text-[10px] text-muted-foreground">{log.area}</span>
            )}
            {log.equipment && (
              <span className="text-[10px] text-muted-foreground">{log.equipment}</span>
            )}
            {log.person && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate max-w-[110px]">
                <User className="h-2.5 w-2.5 shrink-0" />{log.person}
              </span>
            )}
            {log.hasPhoto && <Camera className="h-3 w-3 text-muted-foreground" />}
            {log.requiresReview && <Star className="h-3 w-3 text-purple-400" />}

            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto shrink-0">
              <Clock className="h-2.5 w-2.5" />{timeStr}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-2 transition-colors" />
      </div>
    </button>
  );
}