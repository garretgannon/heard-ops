import { useState } from "react";
import { CheckCircle2, Circle, Camera, ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PhotoUpload from "./PhotoUpload";
import PhotoPreviewDialog from "./PhotoPreviewDialog";

export default function PrepItemCard({ item, prepList, userName, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const isCompleted = item.status === "completed";

  const toggleComplete = async () => {
    if (isCompleted) {
      await onUpdate(item.id, {
        status: "pending",
        completed_by: "",
        completed_at: "",
        photo_url: "",
      });
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
    <div className={cn(
      "bg-card rounded-xl border border-border overflow-hidden transition-all",
      isCompleted && "opacity-75"
    )}>
      <div className="p-4 flex items-start gap-3">
        <button onClick={toggleComplete} className="mt-0.5 flex-shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-accent" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0" onClick={() => !isCompleted && setExpanded(!expanded)}>
          <p className={cn("font-medium text-sm", isCompleted && "line-through text-muted-foreground")}>{item.name}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            {(item.quantity || item.unit) && (
              <span className="font-mono">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>
            )}
            {prepList && <span>{prepList.name}</span>}
          </div>
          {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
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

      {expanded && !isCompleted && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Upload a photo of the completed prep, then mark as done:</p>
          <PhotoUpload onUpload={(url) => markDone(url)} />
          <Button variant="outline" size="sm" className="w-full" onClick={() => markDone(null)}>
            Mark done without photo
          </Button>
        </div>
      )}

      <PhotoPreviewDialog url={photoPreview} onClose={() => setPhotoPreview(null)} />
    </div>
  );
}