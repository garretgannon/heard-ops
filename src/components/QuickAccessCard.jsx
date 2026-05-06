import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { haptics } from "@/utils/haptics";

export default function QuickAccessCard({ icon: Icon, title, count, color = "blue", onClick, indicator }) {
  const colorClass = {
    blue: "bg-blue-500/10 border-blue-500/20",
    amber: "bg-amber-500/10 border-amber-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
    green: "bg-green-500/10 border-green-500/20",
    teal: "bg-teal-500/10 border-teal-500/20",
  }[color] || "bg-muted/30 border-border";

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
        "flex-shrink-0 w-24 flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border transition-all active:scale-95",
        colorClass
      )}
    >
      {indicator && (
        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
      <Icon className={cn("h-5 w-5", iconColor)} />
      <p className="text-[10px] font-bold text-foreground text-center leading-tight line-clamp-1">{title}</p>
      {count !== undefined && <p className="text-[9px] text-secondary-text font-semibold">{count}</p>}
    </button>
  );
}