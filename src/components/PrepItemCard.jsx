import { useState } from "react";
import SwipeableCard from "./SwipeableCard";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ListChecks } from "lucide-react";
import PriorityBadge from "./PriorityBadge";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PhotoUpload from "./PhotoUpload";
import PhotoPreviewDialog from "./PhotoPreviewDialog";
import PrepStepsPanel from "./PrepStepsPanel";

export default function PrepItemCard({ item, prepList, userName, onUpdate }) {
  const cyclePriority = async (e) => {
    e.stopPropagation();
    const cycle = { high: "medium", medium: "low", low: "high" };
    await base44.entities.PrepItem.update(item.id, { priority: cycle[item.priority || "medium"] });
    onUpdate(item.id, { priority: cycle[item.priority || "medium"] });
  };
  const [expanded, setExpanded] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const isCompleted = item.status === "completed";
  const isOverdue = item.status === "overdue";

  const toggleComplete = async () => {
    if (isCompleted) {
      await onUpdate(item.id, { status: "pending", completed_by: "", completed_at: "", photo_url: "" });
    } else {
      setExpanded(true);
    }
  };

  const markDone = async (photoUrl) => {
    await onUpdate(item.id, {
      status: "completed",
      completed_by: userName,
      completed_at: new Date().toISOString(),
      photo_url: photoUrl || "",
    });
    setExpanded(false);
  };

  return (
    <SwipeableCard
      onSwipeRight={!isCompleted ? () => setExpanded(true) : undefined}
      onSwipeLeft={!isCompleted ? () => {} : undefined}
      disabled={isCompleted}
    >
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "bg-card rounded-xl border overflow-hidden transition-colors",
        isCompleted && "opacity-75 border-border",
        isOverdue && !isCompleted && "border-red-500/50 bg-red-950/20",
        !isCompleted && !isOverdue && "border-border"
      )}
    >
      <div className="p-4 flex items-start gap-3">
        <motion.button
          onClick={toggleComplete}
          className="mt-0.5 flex-shrink-0"
          whileTap={{ scale: 0.85 }}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-accent" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </motion.button>

        <div className="flex-1 min-w-0" onClick={() => !isCompleted && setExpanded(!expanded)}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("font-medium text-sm", isCompleted && "line-through text-muted-foreground", isOverdue && !isCompleted && "text-red-400")}>{item.name}</p>
            {isOverdue && !isCompleted && <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">OVERDUE</span>}
            <PriorityBadge priority={item.priority || "medium"} onClick={!isCompleted ? cyclePriority : undefined} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            {(item.quantity || item.unit) && (
              <span className="font-mono">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>
            )}
            {prepList && <span>{prepList.name}</span>}
          </div>
          {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
          <button
            onClick={e => { e.stopPropagation(); setStepsOpen(v => !v); }}
            className={`flex items-center gap-1 text-xs font-medium mt-1 transition-colors ${stepsOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ListChecks className="h-3 w-3" />
            {stepsOpen ? "Hide Steps" : "View Steps"}
          </button>
          {isCompleted && item.completed_by && (
            <p className="text-xs text-accent mt-1">✓ {item.completed_by}</p>
          )}
        </div>

        {item.photo_url ? (
          <button onClick={() => setPhotoPreview(item.photo_url)} className="flex-shrink-0">
            <img src={item.photo_url} alt="Done" className="h-10 w-10 rounded-lg object-cover border border-border" />
          </button>
        ) : !isCompleted ? (
          <button onClick={() => setExpanded(!expanded)} className="flex-shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {expanded && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="px-4 pb-4 border-t border-border pt-3 space-y-3 overflow-hidden"
          >
            <p className="text-xs text-muted-foreground font-medium">Upload a photo of the completed prep, then mark as done:</p>
            <PhotoUpload onUpload={(url) => markDone(url)} />
            <Button variant="outline" size="sm" className="w-full" onClick={() => markDone(null)}>
              Mark done without photo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {stepsOpen && (
        <div className="border-t border-border">
          <PrepStepsPanel itemId={item.id} isAdmin={false} />
        </div>
      )}

      <PhotoPreviewDialog url={photoPreview} onClose={() => setPhotoPreview(null)} />
    </motion.div>
    </SwipeableCard>
  );
}