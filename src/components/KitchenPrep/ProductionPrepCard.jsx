import { useState } from 'react';
import { Plus, Upload, X, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import TaskVisual from "@/components/TaskVisual";

export default function ProductionPrepCard({
  item,
  status,
  statusColor,
  statusBgColor,
  statusLabel,
  assignedEmployee,
  onUpdateQty,
  onPhotoUpload,
  onCantComplete,
  onViewDetails,
  onApprove,
  onReject,
}) {
  const [showRejectNotes, setShowRejectNotes] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  
  const completion = item.quantity ? Math.round(((item.completed_qty || 0) / item.quantity) * 100) : 0;
  const isComplete = completion === 100;
  const needsApproval = item.requires_approval && item.status === "completed";
  const needsPhoto = item.requires_photo && !item.photo_url && item.status !== "completed";

  return (
    <div className={cn(
      "bg-card border rounded-lg overflow-hidden",
      status === "overdue" ? "border-red-500/30" :
      status === "behind" ? "border-orange-500/30" :
      status === "due_soon" ? "border-yellow-500/30" :
      status === "needs_review" ? "border-purple-500/30" :
      status === "cant_complete" ? "border-gray-500/30" :
      "border-border"
    )}>
      {/* Visual header — AI image or real photo */}
      <div className="relative h-24 overflow-hidden">
        {item.photo_url ? (
          <img src={item.photo_url} alt="completion" className="w-full h-full object-cover" />
        ) : (
          <TaskVisual
            type="prep"
            name={item.name}
            category={item.station_name}
            compact
            className="h-full w-full"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <p className="text-sm font-black text-white truncate leading-tight">{item.name}</p>
          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap bg-black/50 backdrop-blur-sm", statusColor)}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
      {/* Station + due time row */}
      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
        <span className="font-semibold">{item.station_name}</span>
        {item.due_time && <span>• {item.due_time}</span>}
      </div>

      {/* Progress Bar + Quantity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-semibold">
            {item.completed_qty || 0} / {item.quantity} {item.unit}
          </span>
          <span className="text-foreground font-bold">{completion}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-200 rounded-full",
              status === "complete" ? "bg-emerald-500" :
              status === "needs_review" ? "bg-purple-500" :
              status === "overdue" ? "bg-red-500" :
              status === "behind" ? "bg-orange-500" :
              status === "due_soon" ? "bg-yellow-500" :
              "bg-blue-500"
            )}
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Assigned Employee */}
      {assignedEmployee && (
        <div className="text-[10px] text-muted-foreground">
          <span className="font-semibold">Assigned:</span> {assignedEmployee.full_name}
        </div>
      )}

      {/* Photo Required Badge */}
      {needsPhoto && (
        <div className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded text-amber-400 font-semibold">
          <AlertCircle className="h-3 w-3" /> Photo required for completion
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {status === "needs_review" ? (
          <>
            <button
              onClick={() => onApprove()}
              className="h-8 flex items-center justify-center gap-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 active:scale-95 transition-transform"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={() => setShowRejectNotes(true)}
              className="h-8 flex items-center justify-center gap-1 text-xs font-bold rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 active:scale-95 transition-transform"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onUpdateQty()}
              className="h-8 flex items-center justify-center gap-1 text-xs font-bold rounded-lg bg-primary/15 text-primary border border-primary/30 active:scale-95 transition-transform"
            >
              <Plus className="h-3.5 w-3.5" /> Update
            </button>
            <button
              onClick={() => onPhotoUpload()}
              className="h-8 flex items-center justify-center gap-1 text-xs font-bold rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 active:scale-95 transition-transform"
            >
              <Upload className="h-3.5 w-3.5" /> Photo
            </button>
          </>
        )}
      </div>

      {/* Bottom Row: Can't Complete + View Details */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border">
        {status !== "cant_complete" && status !== "needs_review" && (
          <button
            onClick={() => onCantComplete()}
            className="flex-1 h-7 text-[10px] font-bold rounded border border-gray-500/30 text-gray-400 hover:bg-gray-500/5 active:scale-95 transition-all"
          >
            Can't Complete
          </button>
        )}
        <button
          onClick={() => onViewDetails()}
          className="flex-1 h-7 flex items-center justify-center gap-1 text-[10px] font-bold rounded border border-muted text-muted-foreground hover:bg-muted/30 active:scale-95 transition-all"
        >
          Details <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      </div>

      {/* Reject Notes Modal */}
      {showRejectNotes && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectNotes(false)} />
          <div className="relative w-full bg-card border-t border-border rounded-t-2xl p-4 space-y-3 z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">Rejection Notes</h3>
              <button onClick={() => setShowRejectNotes(false)} className="text-2xl text-muted-foreground leading-none">×</button>
            </div>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Why is this rejected?"
              className="w-full h-24 p-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRejectNotes(false)}
                className="flex-1 h-9 text-xs font-bold rounded-lg border border-border text-foreground active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReject(rejectNotes);
                  setShowRejectNotes(false);
                  setRejectNotes("");
                }}
                className="flex-1 h-9 text-xs font-bold rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 active:scale-95 transition-transform"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}