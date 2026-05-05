import { cn } from "@/lib/utils";

/**
 * Standard metric tile used across all dashboard pages.
 * - Centered value + label
 * - Optional icon (h-3.5 w-3.5)
 * - Optional sub-label
 * - alert prop highlights border red
 */
export default function MetricTile({ label, value, color, alert, icon: Icon, sub }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center gap-0 bg-[#111827] border rounded-xl p-2.5 min-w-0",
      alert ? "border-red-500/30" : "border-[#1F2937]"
    )}>
      {Icon && (
        <Icon className={cn("h-3.5 w-3.5 mb-0.5", alert ? "text-red-400" : color || "text-gray-500")} />
      )}
      <span className={cn("text-[20px] font-extrabold leading-none", color || "text-white")}>{value}</span>
      <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide mt-0.5 leading-tight">{label}</span>
      {sub && <span className={cn("text-[9px] mt-0.5 leading-tight", color || "text-gray-600")}>{sub}</span>}
    </div>
  );
}