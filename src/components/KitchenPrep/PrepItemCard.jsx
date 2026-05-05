import { ChevronRight, Camera, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PrepItemCard({
  item,
  status,
  statusColor,
  statusLabel,
  assignedEmployee,
  onUpdateQty,
  onPhotoUpload,
  onReject,
}) {
  const completion = item.quantity ? (item.completed_qty || 0) / item.quantity : 0;
  const completionPercent = Math.round(completion * 100);

  return (
    <div className={cn("bg-card border border-border rounded-xl p-3 space-y-2")}>
      {/* HEADER ROW */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
          <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
            <span className="font-semibold">{item.station_name}</span>
            {item.due_time && (
              <>
                <span>•</span>
                <span>{item.due_time}</span>
              </>
            )}
          </div>
        </div>
        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0", statusColor)}>
          {statusLabel}
        </span>
      </div>

      {/* QUANTITY SECTION */}
      <div className="bg-muted/50 rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase">Qty</p>
            <p className="text-sm font-bold text-foreground mt-0.5">
              {item.completed_qty || 0}<span className="text-muted-foreground">/{item.quantity}</span>
              <span className="text-[10px] text-muted-foreground ml-1">{item.unit}</span>
            </p>
          </div>
          <button
            onClick={onUpdateQty}
            className="h-7 px-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg active:scale-95 transition-transform flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Update
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", statusColor.split(" ")[0])}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right font-semibold">{completionPercent}%</p>
      </div>

      {/* DETAILS ROW */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        {assignedEmployee && (
          <div className="bg-muted/50 rounded p-1.5">
            <p className="text-muted-foreground font-semibold">Assigned</p>
            <p className="text-foreground font-bold mt-0.5">{assignedEmployee.full_name?.split(" ")[0]}</p>
          </div>
        )}
        {item.requires_photo && (
          <div className={cn("rounded p-1.5 flex items-center justify-center", item.photo_url ? "bg-emerald-500/10" : "bg-red-500/10")}>
            <Camera className={cn("h-3.5 w-3.5", item.photo_url ? "text-emerald-400" : "text-red-400")} />
          </div>
        )}
        {item.requires_approval && item.status === "completed" && (
          <div className="bg-purple-500/10 rounded p-1.5 flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5 text-purple-400" />
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={onUpdateQty}
          className="h-8 text-xs font-bold rounded-lg bg-primary/10 text-primary border border-primary/30 active:scale-95 transition-transform"
        >
          Update
        </button>
        {item.requires_photo && (
          <button
            onClick={() => onPhotoUpload(item.id, "")}
            className="h-8 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 active:scale-95 transition-transform flex items-center justify-center gap-1"
          >
            <Camera className="h-3 w-3" /> Photo
          </button>
        )}
        <button
          onClick={onReject}
          className="h-8 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 active:scale-95 transition-transform"
        >
          Can't Complete
        </button>
      </div>
    </div>
  );
}