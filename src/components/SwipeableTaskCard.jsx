import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Clock, User, Eye } from "lucide-react";
import { haptics } from "@/utils/haptics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SwipeableTaskCard({
  task,
  icon: Icon,
  onComplete,
  completing,
  isRemoving,
  onSnooze,
  onReassign,
  onView,
}) {
  const [dragX, setDragX] = useState(0);
  const [dragDirection, setDragDirection] = useState(null);
  const [thresholdCrossed, setThresholdCrossed] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const threshold = 60;
  const maxDrag = 120;

  const isOverdue = task.status === "overdue";
  const isDueSoon = task.status === "in_progress" && task.due_time;
  const statusLabel = isOverdue ? "OVERDUE" : isDueSoon ? "DUE SOON" : "";
  const statusColor = isOverdue
    ? "bg-red-500/15 text-red-400 border-red-500/30"
    : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  const handleDrag = (e, info) => {
    const newX = Math.max(Math.min(info.offset.x, maxDrag), -maxDrag);
    setDragX(newX);

    const direction = newX > 0 ? "right" : newX < 0 ? "left" : null;
    setDragDirection(direction);

    const absX = Math.abs(newX);
    const crossed = absX > threshold;

    if (crossed && !thresholdCrossed) {
      setThresholdCrossed(true);
      haptics.light();
    } else if (!crossed && thresholdCrossed) {
      setThresholdCrossed(false);
    }
  };

  const handleDragEnd = (e, info) => {
    const absX = Math.abs(dragX);

    if (dragDirection === "right" && absX > threshold) {
      onComplete();
    } else if (dragDirection === "left" && absX > threshold) {
      setShowActions(true);
    }

    setDragX(0);
    setDragDirection(null);
    setThresholdCrossed(false);
  };

  const rightReveal = Math.max(dragX, 0);
  const leftReveal = Math.max(-dragX, 0);
  const checkmarkScale = 0.5 + (rightReveal / maxDrag) * 0.5;

  return (
    <>
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-lg",
          isRemoving && "animate-slide-left-fade"
        )}
        drag="x"
        dragElastic={0.2}
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        initial={{ x: 0 }}
        animate={{ x: dragX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Right Reveal (Complete) */}
        {rightReveal > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-green-500/20 flex items-center px-4"
            style={{ width: `${Math.min(rightReveal, maxDrag)}px` }}
          >
            <motion.div
              style={{ scale: checkmarkScale }}
              className="text-green-400"
            >
              <Check className="h-5 w-5 stroke-[2.5]" />
            </motion.div>
          </div>
        )}

        {/* Left Reveal (Actions) */}
        {leftReveal > 0 && (
          <div
            className="absolute inset-y-0 right-0 bg-blue-500/20 flex items-center justify-end px-4 gap-2"
            style={{ width: `${Math.min(leftReveal, maxDrag)}px` }}
          >
            <div className="flex gap-1.5 opacity-60">
              <Eye className="h-4 w-4 stroke-[1.5] text-blue-400" />
              <User className="h-4 w-4 stroke-[1.5] text-blue-400" />
              <Clock className="h-4 w-4 stroke-[1.5] text-blue-400" />
            </div>
          </div>
        )}

        {/* Card */}
        <div
          className={cn(
            "card-with-border border-l-slate-600 p-3 flex items-center gap-3 bg-card transition-all duration-250",
            isRemoving && "opacity-20"
          )}
        >
          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 stroke-[1.5] text-secondary-text" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{task.name}</p>
            <div className="flex items-center gap-1.5 text-[9px] text-secondary-text mt-0.5">
              {task.due_time && <span>{task.due_time}</span>}
              {task.due_time && task.assigned && <span>·</span>}
              {task.assigned && <span className="truncate">{task.assigned}</span>}
              {task.progress && <span>· {task.progress}</span>}
            </div>
          </div>
          {statusLabel && (
            <span
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap",
                statusColor
              )}
            >
              {statusLabel}
            </span>
          )}
          <motion.button
            onClick={() => !completing && onComplete()}
            disabled={completing}
            className={cn(
              "h-8 px-3 text-xs flex items-center justify-center gap-1 shrink-0 rounded-lg font-bold transition-all duration-200",
              completing ? "bg-green-500 text-white" : "btn-primary"
            )}
            whileTap={{ scale: 0.95 }}
          >
            {completing ? (
              <svg
                className="w-4 h-4 animate-checkmark"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 50 }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              "✓"
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Actions Modal */}
      <Dialog open={showActions} onOpenChange={setShowActions}>
        <DialogContent className="w-11/12 mx-auto">
          <DialogHeader>
            <DialogTitle>{task.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setShowActions(false);
                onSnooze?.();
              }}
              className="btn-secondary w-full h-10 text-sm flex items-center justify-center gap-2"
            >
              <Clock className="h-4 w-4 stroke-[1.5]" />
              Snooze
            </button>
            <button
              onClick={() => {
                setShowActions(false);
                onReassign?.();
              }}
              className="btn-secondary w-full h-10 text-sm flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4 stroke-[1.5]" />
              Reassign
            </button>
            <button
              onClick={() => {
                setShowActions(false);
                onView?.();
              }}
              className="btn-secondary w-full h-10 text-sm flex items-center justify-center gap-2"
            >
              <Eye className="h-4 w-4 stroke-[1.5]" />
              View Details
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}