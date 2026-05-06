import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { haptics } from "@/utils/haptics";

export default function OperationsLibraryRow({ icon: Icon, title, subtitle, count, color = "blue", onClick }) {
  const accentColor = {
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    purple: "border-l-purple-500",
    green: "border-l-green-500",
    teal: "border-l-teal-500",
  }[color] || "border-l-slate-500";

  const iconBg = {
    blue: "bg-blue-500/10",
    amber: "bg-amber-500/10",
    purple: "bg-purple-500/10",
    green: "bg-green-500/10",
    teal: "bg-teal-500/10",
  }[color] || "bg-muted";

  const iconColor = {
    blue: "text-blue-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
    green: "text-green-400",
    teal: "text-teal-400",
  }[color] || "text-secondary-text";

  return (
    <button
      onClick={() => {
        haptics.light?.();
        onClick?.();
      }}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 bg-card border-b border-r border-border transition-all active:scale-95 hover:bg-muted",
        accentColor
      )}
    >
      {/* Icon */}
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>

      {/* Title + Subtitle */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Count + Chevron */}
      <div className="flex items-center gap-2 shrink-0">
        {count !== undefined && (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-muted text-foreground">{count}</span>
        )}
        <ChevronRight className="h-4 w-4 text-secondary-text" />
      </div>
    </button>
  );
}