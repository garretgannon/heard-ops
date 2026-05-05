import { cn } from "@/lib/utils";

export default function MetricTile({ icon: Icon, label, value, color, alert }) {
  return (
    <div className={cn(
      "card-with-border border-l-slate-600 p-2.5 flex flex-col items-center justify-center gap-1.5 min-h-[72px]",
      alert && "border-l-red-500"
    )}>
      {Icon && <Icon className={cn("h-4 w-4", color || (alert ? "text-red-400" : "text-secondary-text"))} />}
      <p className={cn("text-lg font-bold", color || (alert ? "text-red-400" : "text-foreground"))}>{value}</p>
      <p className="text-[9px] text-secondary-text font-semibold uppercase text-center leading-tight">{label}</p>
    </div>
  );
}