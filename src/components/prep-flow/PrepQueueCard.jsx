import { motion } from "framer-motion";
import { Clock, ChevronRight, CheckCircle2, AlertCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  high:   { color: "text-red-400",   bg: "bg-red-500/10",   icon: <Flame className="h-3 w-3" /> },
  medium: { color: "text-primary",   bg: "bg-primary/10",   icon: null },
  low:    { color: "text-slate-400", bg: "bg-slate-500/10", icon: null },
};

export default function PrepQueueCard({ item, onStart, index = 0 }) {
  const isComplete = item.status === "completed";
  const isOverdue  = item.status === "overdue";
  const pCfg = PRIORITY_CONFIG[item.priority || "medium"];

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => !isComplete && onStart?.(item)}
      disabled={isComplete}
      className={cn(
        "w-full text-left rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 active:scale-[0.98]",
        isComplete
          ? "bg-white/3 opacity-50 cursor-default"
          : "bg-[#111820] hover:bg-[#151e28]",
      )}
    >
      {/* Status dot */}
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
        isComplete ? "bg-green-500/15" : isOverdue ? "bg-red-500/15" : pCfg.bg
      )}>
        {isComplete
          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
          : isOverdue
          ? <AlertCircle className="h-5 w-5 text-red-400" />
          : pCfg.icon
          ? <span className={pCfg.color}>{pCfg.icon}</span>
          : <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-[15px] leading-tight truncate", isComplete && "line-through text-white/40")}>
          {item.name}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {item.quantity && (
            <span className="text-xs text-white/40 font-mono">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>
          )}
          {item.station_name && (
            <span className="text-xs text-white/30">{item.station_name}</span>
          )}
          {item.due_time && (
            <span className={cn("flex items-center gap-1 text-xs font-semibold", isOverdue ? "text-red-400" : "text-white/40")}>
              <Clock className="h-3 w-3" />{item.due_time}
            </span>
          )}
        </div>
      </div>

      {!isComplete && <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />}
    </motion.button>
  );
}