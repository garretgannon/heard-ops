import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, X, ChevronLeft, ChevronRight, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REJECTION_REASONS = [
  "Photo unclear",
  "Task incomplete",
  "Wrong item",
  "Area not clean",
  "Need closer photo",
];

const SOURCE_TYPES = {
  prep: { label: "Prep", color: "bg-blue-500", icon: "📋" },
  sidework: { label: "Side Work", color: "bg-orange-500", icon: "✓" },
  cleaning: { label: "Cleaning", color: "bg-green-500", icon: "🧹" },
  maintenance: { label: "Maintenance", color: "bg-red-500", icon: "🔧" },
};

export default function PhotoReview() {
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterSource, setFilterSource] = useState("all");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      const [prepItems, sideWork] = await Promise.all([
        base44.entities.PrepItem.list("-updated_date", 500),
        base44.entities.SideWorkAssignment.filter({}),
      ]);

      // Combine all photos with source type
      const allPhotosData = [
        ...prepItems.filter(i => i.photo_url && i.status === "completed").map(i => ({
          id: i.id,
          type: "prep",
          name: i.name,
          photo_url: i.photo_url,
          completed_by: i.completed_by,
          completed_at: i.completed_at,
          completion_notes: i.completion_notes,
          status: i.status,
        })),
        ...sideWork.filter(t => t.photo_url && t.status === "completed").map(t => ({
          id: t.id,
          type: "sidework",
          name: t.task_name,
          photo_url: t.photo_url,
          completed_by: t.completed_by,
          completed_at: t.completed_at,
          completion_notes: t.completion_notes,
          status: t.status,
        })),
      ];

      setAllPhotos(allPhotosData.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)));
      setLoading(false);
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load photos");
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Pending photos (not yet approved)
  const pending = allPhotos.filter(p => p.status !== "approved");
  const approved = allPhotos.filter(p => p.status === "approved");

  const filtered = filterSource === "all" ? pending : pending.filter(p => p.type === filterSource);

  const selectedIdx = selected ? filtered.findIndex(p => p.id === selected.id) : -1;
  const openNext = () => { if (selectedIdx < filtered.length - 1) setSelected(filtered[selectedIdx + 1]); };
  const openPrev = () => { if (selectedIdx > 0) setSelected(filtered[selectedIdx - 1]); };

  const handleApprove = async (photoId) => {
    setActionLoading(true);
    try {
      const photo = allPhotos.find(p => p.id === photoId);
      if (photo.type === "prep") {
        await base44.entities.PrepItem.update(photoId, { status: "approved" });
      } else {
        await base44.entities.SideWorkAssignment.update(photoId, { status: "approved" });
      }
      toast.success("Photo approved ✓");
      setSelected(null);
      load();
    } catch (err) {
      toast.error("Failed to approve");
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectionReason && !rejectionComment.trim()) {
      toast.error("Select a reason or add a comment");
      return;
    }

    setActionLoading(true);
    try {
      const photo = allPhotos.find(p => p.id === rejectingId);
      const updateData = {
        status: "rejected",
        rejection_notes: `${rejectionReason}${rejectionComment ? ` — ${rejectionComment}` : ""}`,
      };

      if (photo.type === "prep") {
        await base44.entities.PrepItem.update(rejectingId, updateData);
      } else {
        await base44.entities.SideWorkAssignment.update(rejectingId, updateData);
      }

      toast.success("Photo rejected, task sent back to employee");
      setRejectingId(null);
      setRejectionReason("");
      setRejectionComment("");
      setSelected(null);
      load();
    } catch (err) {
      toast.error("Failed to reject");
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 pb-12" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Photo Review</h1>
          <p className="text-muted-foreground mt-1">
            {pending.length > 0 ? `${pending.length} pending approval` : "All caught up!"}
          </p>
        </div>
        {pending.length > 0 && (
          <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />{pending.length} to review
          </span>
        )}
      </div>

      {/* Source filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterSource("all")}
          className={cn("px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors", 
            filterSource === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Pending ({pending.length})
        </button>
        {Object.entries(SOURCE_TYPES).map(([key, source]) => {
          const count = pending.filter(p => p.type === key).length;
          return count > 0 ? (
            <button
              key={key}
              onClick={() => setFilterSource(key)}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                filterSource === key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {source.icon} {source.label} ({count})
            </button>
          ) : null;
        })}
      </div>

      {/* Pending photos grid */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-2">
          {pending.length === 0 ? (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
              <p className="text-foreground font-semibold">All photos reviewed!</p>
              <p className="text-muted-foreground text-sm">{approved.length} approved</p>
            </>
          ) : (
            <>
              <Camera className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No photos in this category</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(photo => (
            <motion.div
              key={photo.id}
              className="cursor-pointer group rounded-xl overflow-hidden border-2 border-yellow-500/30 bg-card hover:border-yellow-500/60 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(photo)}
            >
              <div className="aspect-square overflow-hidden relative bg-black">
                <img src={photo.photo_url} alt={photo.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 left-2">
                  <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-white", SOURCE_TYPES[photo.type].color)}>
                    {SOURCE_TYPES[photo.type].icon} {SOURCE_TYPES[photo.type].label}
                  </span>
                </div>
                <div className="absolute top-2 right-2 bg-yellow-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  ⏳ Pending
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate">{photo.name}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {photo.completed_by || "Unknown"} • {photo.completed_at ? new Date(photo.completed_at).toLocaleTimeString() : ""}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="relative bg-card rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>

              {/* Image */}
              <div className="flex-1 overflow-y-auto bg-black flex items-center justify-center">
                <img src={selected.photo_url} alt={selected.name} className="max-w-full max-h-full object-contain" />
              </div>

              {/* Details */}
              <div className="p-5 space-y-3 bg-card border-t border-border">
                <div>
                  <h3 className="font-bold text-base">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded font-semibold text-white", SOURCE_TYPES[selected.type].color)}>
                      {SOURCE_TYPES[selected.type].icon} {SOURCE_TYPES[selected.type].label}
                    </span>
                  </p>
                </div>

                <div className="text-xs space-y-1 text-muted-foreground">
                  {selected.completed_by && <p>By: <span className="text-foreground font-semibold">{selected.completed_by}</span></p>}
                  {selected.completed_at && <p>At: <span className="text-foreground">{new Date(selected.completed_at).toLocaleString()}</span></p>}
                  {selected.completion_notes && <p>Notes: <span className="text-foreground">{selected.completion_notes}</span></p>}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={actionLoading}
                    onClick={() => handleApprove(selected.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {actionLoading ? "Approving..." : "Approve"}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => setRejectingId(selected.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button variant="outline" size="sm" disabled={selectedIdx === 0} onClick={openPrev}>
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">{selectedIdx + 1} / {filtered.length}</span>
                  <Button variant="outline" size="sm" disabled={selectedIdx === filtered.length - 1} onClick={openNext}>
                    Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Quick Reasons</label>
              <div className="space-y-2">
                {REJECTION_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => setRejectionReason(reason)}
                    className={cn("w-full text-left px-3 py-2 rounded-lg border-2 transition-colors text-sm font-medium",
                      rejectionReason === reason
                        ? "bg-red-500/10 border-red-500 text-red-700"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Additional Comment (optional)</label>
              <Textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="e.g., Need to see the entire area..."
                className="min-h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button onClick={handleReject} disabled={actionLoading} className="bg-red-600 hover:bg-red-700">
              {actionLoading ? "Rejecting..." : "Send Back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export const hideBase44Index = true;