import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ListCard({
  icon: Icon,
  title,
  details = [],
  badge,
  badgeColor = "bg-primary/10 text-primary",
  onTap,
  onAction,
  actionIcon: ActionIcon,
  actionLabel,
  isSelected,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card border border-border rounded-xl p-3 flex items-start gap-3 transition-all active:scale-[0.98]",
        isSelected && "border-primary/50 bg-primary/5"
      )}
    >
      {Icon && (
        <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground">{title}</p>
        {details.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            {details.map((detail, idx) => (
              <span key={idx} className="text-[10px] text-muted-foreground">
                {detail}
              </span>
            ))}
          </div>
        )}
      </div>

      {badge && (
        <div className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0", badgeColor)}>
          {badge}
        </div>
      )}

      {onAction && ActionIcon ? (
        <button
          onClick={onAction}
          className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0 active:scale-90"
        >
          <ActionIcon className="h-3.5 w-3.5 text-foreground" />
        </button>
      ) : onTap ? (
        <button onClick={onTap} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}
    </motion.div>
  );
}