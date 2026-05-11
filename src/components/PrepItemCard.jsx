import { useState, useRef } from "react";
import SwipeableCard from "./SwipeableCard";
import useHaptic from "@/hooks/useHaptic";
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
  const haptic = useHaptic();
  const [justCompleted, setJustCompleted] = useState(false);
  const cyclePriority = async (e) => {
    e.stopPropagation();
    const cycle = { high: "medium", medium: "low", low: "high" };
    await base44.entities.PrepItem.update(item.id, { priority: cycle[item.priority || "medium"] });
    onUpdate(item.id, { priority: cycle[item.priority || "medium"] });
  };
  const [expanded, setExpanded] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);
  const isCompleted = item.status === "completed";
  const isOverdue = item.status === "overdue";

  const toggleComplete = async () => {
    if (isCompleted) {
      haptic.tap();
      await onUpdate(item.id, { status: "pending", completed_by: "", completed_at: "", photo_url: "" });
    } else {
      haptic.tap();
      setExpanded(true);
    }
  };

  const markDone = async (photoUrl) => {
    haptic.success();
    setJustCompleted(true);
    setBurstKey(k => k + 1);
    await onUpdate(item.id, {
      status: "completed",
      completed_by: userName,
      completed_at: new Date().toISOString(),
      photo_url: photoUrl || "",
    });
    setExpanded(false);
    setTimeout(() => setJustCompleted(false), 1200);
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
        "bg-card rounded-xl border overflow-hidden transition-all duration-300 relative",
        justCompleted && "border-green-500/60",
        isCompleted && !justCompleted && "opacity-70 border-border",
        isOverdue && !isCompleted && "border-red-500/50 bg-red-950/20",
        !isCompleted && !isOverdue && "border-border"
      )}
      style={justCompleted ? { boxShadow: '0 0 0 2px rgba(34,197,94,0.3), 0 0 20px rgba(34,197,94,0.12)' } : {}}
    >
      {/* Completion burst overlay */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            key={burstKey}
            className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-10 h-10 rounded-full border-2 border-green-400"
            />
            <motion.div
              className="absolute"
              initial={{ scale: 0.6, opacity: 1 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="p-4 flex items-start gap-3">
        <motion.button
          onClick={toggleComplete}
          className="mt-0.5 flex-shrink-0 relative"
          whileTap={{ scale: 0.75 }}
          transition={{ type: 'spring', stiffness: 600, damping: 15 }}
        >
          <motion.div
            animate={justCompleted ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </motion.div>
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
            <motion.button
              onClick={() => markDone(null)}
              className="w-full h-11 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-bold text-sm flex items-center justify-center gap-2"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark done without photo
            </motion.button>
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