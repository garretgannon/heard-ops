import { ChevronRight, Camera, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SideWorkCard({
  task,
  status,
  statusColor,
  statusLabel,
  priorityColor,
  assignedEmployee,
  onMarkComplete,
  onPhotoUpload,
  onReject,
}) {
  const priorityLabel = {
    high: "High",
    medium: "Med",
    low: "Low",
  }[task.priority] || "Med";

  return (
    <div className={cn("bg-card border border-border rounded-xl p-3 space-y-2")}>
      {/* HEADER ROW */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{task.task_name}</p>
          <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
            <span className="font-semibold">{task.role_assignment}</span>
            {task.due_time && (
              <>
                <span>•</span>
                <span>{task.due_time}</span>
              </>
            )}
          </div>
        </div>
        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0", statusColor)}>
          {statusLabel}
        </span>
      </div>

      {/* PRIORITY & ASSIGNMENT */}
      <div className="bg-muted/50 rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase">Priority</p>
            <p className={cn("text-sm font-bold mt-0.5", priorityColor)}>
              {priorityLabel}
            </p>
          </div>
          {assignedEmployee && (
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase">Assigned</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{assignedEmployee.full_name?.split(" ")[0]}</p>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS ROW */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        {task.requires_photo && (
          <div className={cn("rounded p-1.5 flex items-center justify-center", task.photo_url ? "bg-emerald-500/10" : "bg-red-500/10")}>
            <Camera className={cn("h-3.5 w-3.5", task.photo_url ? "text-emerald-400" : "text-red-400")} />
          </div>
        )}
        {task.requires_approval && task.status === "completed" && (
          <div className="bg-purple-500/10 rounded p-1.5 flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5 text-purple-400" />
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={onMarkComplete}
          className="h-8 text-xs font-bold rounded-lg bg-primary/10 text-primary border border-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-1"
        >
          <Check className="h-3 w-3" /> Done
        </button>
        {task.requires_photo && (
          <button
            onClick={() => onPhotoUpload(task.id, "")}
            className="h-8 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 active:scale-95 transition-transform flex items-center justify-center gap-1"
          >
            <Camera className="h-3 w-3" /> Photo
          </button>
        )}
        <button
          onClick={onReject}
          className="h-8 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 active:scale-95 transition-transform"
        >
          Skip
        </button>
      </div>
    </div>
  );
}