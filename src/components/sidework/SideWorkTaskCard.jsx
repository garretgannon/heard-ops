import { useState } from "react";
import { haptics } from "@/utils/haptics";
import SwipeableCard from "../SwipeableCard";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, Camera, Clock, AlertCircle, ThumbsUp, ThumbsDown, Loader2, XCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const priorityStyles = {
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-green-400 bg-green-400/10 border-green-400/20",
};

export default function SideWorkTaskCard({ assignment, currentUser, isManager, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoModal, setPhotoModal] = useState(null);

  const isDone = ["completed", "approved"].includes(assignment.status);
  const isPending = assignment.status === "pending" || assignment.status === "rejected";
  const isCompleted = assignment.status === "completed";
  const isApproved = assignment.status === "approved";
  const isRejected = assignment.status === "rejected";

  const handleComplete = async (file) => {
    if (assignment.requires_photo && !file) return;
    setSaving(true);
    let photo_url = assignment.photo_url || "";
    if (file) {
      setUploading(true);
      const res = await base44.integrations.Core.UploadFile({ file });
      photo_url = res.file_url;
      setUploading(false);
    }
    haptics.success();
    await base44.entities.SideWorkAssignment.update(assignment.id, {
      status: assignment.requires_approval ? "completed" : "approved",
      photo_url,
      completed_at: new Date().toISOString(),
      completed_by: currentUser?.display_name || currentUser?.full_name || currentUser?.email,
      rejection_notes: "",
    });
    setSaving(false);
    toast.success(assignment.requires_approval ? "Task submitted for approval" : "Task completed!");
    onRefresh();
  };

  const handlePhotoAndComplete = (e) => {
    const file = e.target.files[0];
    if (file) handleComplete(file);
  };

  const handleApprove = async () => {
    haptics.medium();
    setSaving(true);
    await base44.entities.SideWorkAssignment.update(assignment.id, {
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: currentUser?.full_name || currentUser?.email,
    });
    setSaving(false);
    toast.success("Task approved!");
    onRefresh();
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) { haptics.warning(); toast.error("Please add rejection notes"); return; }
    haptics.medium();
    setSaving(true);
    await base44.entities.SideWorkAssignment.update(assignment.id, {
      status: "rejected",
      rejection_notes: rejectNotes,
      completed_at: "",
      completed_by: "",
      photo_url: "",
    });
    setSaving(false);
    setRejecting(false);
    setRejectNotes("");
    toast.success("Task rejected and returned to staff");
    onRefresh();
  };

  return (
    <SwipeableCard
      onSwipeRight={!isManager && isPending ? () => handleComplete(null) : undefined}
      onSwipeLeft={!isManager && isPending ? () => {} : undefined}
      disabled={isDone && !isRejected}
    >
    <div className={cn(
      "bg-card rounded-xl border p-4 space-y-3 transition-all",
      isApproved ? "border-green-500/30 bg-green-500/5" : isRejected ? "border-red-500/30 bg-red-500/5" : "border-border"
    )}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 flex-shrink-0">
          {isApproved ? <CheckCircle2 className="h-5 w-5 text-green-400" />
            : isCompleted ? <Clock className="h-5 w-5 text-yellow-400" />
            : isRejected ? <XCircle className="h-5 w-5 text-red-400" />
            : <Circle className="h-5 w-5 text-muted-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("font-medium text-sm", isDone && !isRejected && "line-through text-muted-foreground")}>
              {assignment.task_name}
            </span>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", priorityStyles[assignment.priority] || priorityStyles.medium)}>
              {assignment.priority?.toUpperCase()}
            </span>
            {assignment.due_time && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />{assignment.due_time}
              </span>
            )}
            {assignment.requires_photo && <Camera className="h-3.5 w-3.5 text-muted-foreground" title="Photo required" />}
          </div>

          {assignment.description && (
            <p className="text-xs text-muted-foreground mt-1">{assignment.description}</p>
          )}

          {assignment.assigned_to_name && (
            <p className="text-xs text-muted-foreground mt-1">→ {assignment.assigned_to_name}</p>
          )}

          {isCompleted && !isManager && (
            <p className="text-xs text-yellow-400 mt-1">⏳ Pending manager approval</p>
          )}
          {isApproved && (
            <p className="text-xs text-green-400 mt-1">
              ✓ Approved {assignment.approved_by ? `by ${assignment.approved_by}` : ""} {assignment.approved_at ? `at ${new Date(assignment.approved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
          )}
          {isRejected && assignment.rejection_notes && (
            <p className="text-xs text-red-400 mt-1 italic">Rejected: "{assignment.rejection_notes}"</p>
          )}
          {assignment.completed_at && !isApproved && (
            <p className="text-xs text-muted-foreground mt-1">
              Completed at {new Date(assignment.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {assignment.completed_by ? ` by ${assignment.completed_by}` : ""}
            </p>
          )}
        </div>

        {/* Photo thumbnail */}
        {assignment.photo_url && (
          <button onClick={() => setPhotoModal(assignment.photo_url)} className="flex-shrink-0">
            <img src={assignment.photo_url} alt="Proof" className="h-12 w-12 rounded-lg object-cover border border-border hover:border-primary transition-colors" />
          </button>
        )}
      </div>

      {/* Staff actions */}
      {!isManager && isPending && (
        <div className="flex gap-2 pt-1">
          {assignment.requires_photo ? (
            <label className={cn("flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors bg-primary text-primary-foreground hover:bg-primary/90", (uploading || saving) && "opacity-60 pointer-events-none")}>
              {uploading || saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              {uploading ? "Uploading..." : "Take Photo & Complete"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoAndComplete} />
            </label>
          ) : (
            <Button size="sm" className="h-8 text-xs" onClick={() => handleComplete(null)} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              Mark Complete
            </Button>
          )}
        </div>
      )}

      {/* Manager approval actions */}
      {isManager && isCompleted && (
        <div className="flex gap-2 pt-1">
          {rejecting ? (
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleReject} disabled={saving}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject"}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRejecting(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={saving}>
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />Approve
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={() => setRejecting(true)}>
                <ThumbsDown className="h-3.5 w-3.5 mr-1" />Reject
              </Button>
            </>
          )}
        </div>
      )}

      {/* Photo fullscreen */}
      {photoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPhotoModal(null)}>
          <img src={photoModal} alt="Proof" className="max-w-full max-h-[85vh] rounded-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
    </SwipeableCard>
  );
}