import { cn } from "@/lib/utils";
import { Flame, Minus, ChevronDown } from "lucide-react";

const config = {
  high:   { label: "High",   classes: "bg-red-500/15 text-red-400 border-red-500/30",    icon: Flame },
  medium: { label: "Medium", classes: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Minus },
  low:    { label: "Low",    classes: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: ChevronDown },
};

export default function PriorityBadge({ priority = "medium", onClick, className }) {
  const c = config[priority] || config.medium;
  const Icon = c.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all",
        c.classes,
        onClick && "hover:opacity-80 cursor-pointer",
        !onClick && "cursor-default",
        className
      )}
      title={onClick ? "Click to change priority" : undefined}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </button>
  );
}