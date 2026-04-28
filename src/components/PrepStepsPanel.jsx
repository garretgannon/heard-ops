import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Camera, X, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PrepStepsPanel({ itemId, isAdmin }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newInstruction, setNewInstruction] = useState("");
  const [adding, setAdding] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [photoModal, setPhotoModal] = useState(null);

  const load = async () => {
    setLoading(true);
    const results = await base44.entities.PrepStep.filter({ prep_item_id: itemId }, "step_number");
    setSteps(results);
    setLoading(false);
  };

  useEffect(() => { load(); }, [itemId]);

  const addStep = async () => {
    if (!newInstruction.trim()) return;
    setAdding(true);
    await base44.entities.PrepStep.create({
      prep_item_id: itemId,
      instruction: newInstruction.trim(),
      step_number: steps.length + 1,
    });
    setNewInstruction("");
    setAdding(false);
    load();
  };

  const deleteStep = async (id) => {
    await base44.entities.PrepStep.delete(id);
    toast.success("Step removed");
    load();
  };

  const uploadPhoto = async (stepId, file) => {
    setUploadingFor(stepId);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.PrepStep.update(stepId, { photo_url: file_url });
    setUploadingFor(null);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-5 pb-4 space-y-3">
      {steps.length === 0 && !isAdmin && (
        <p className="text-xs text-muted-foreground italic">No prep steps added yet.</p>
      )}

      {steps.map((step, idx) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, delay: idx * 0.04 }}
          className="flex items-start gap-3"
        >
          {/* Step number bubble */}
          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {idx + 1}
          </div>

          {/* Instruction + photo */}
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed">{step.instruction}</p>
            {step.photo_url && (
              <button onClick={() => setPhotoModal(step.photo_url)} className="mt-2 block">
                <img
                  src={step.photo_url}
                  alt={`Step ${idx + 1}`}
                  className="h-28 w-auto rounded-xl object-cover border border-border hover:border-primary transition-colors"
                />
              </button>
            )}
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
              {!step.photo_url ? (
                <label className="cursor-pointer h-7 w-7 rounded-lg border border-dashed border-border flex items-center justify-center hover:border-primary transition-colors" title="Add step photo">
                  {uploadingFor === step.id
                    ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    : <Camera className="h-3 w-3 text-muted-foreground" />
                  }
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files[0] && uploadPhoto(step.id, e.target.files[0])} />
                </label>
              ) : (
                <label className="cursor-pointer h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary transition-colors" title="Replace photo">
                  {uploadingFor === step.id
                    ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    : <Camera className="h-3 w-3 text-muted-foreground" />
                  }
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files[0] && uploadPhoto(step.id, e.target.files[0])} />
                </label>
              )}
              <button
                onClick={() => deleteStep(step.id)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </motion.div>
      ))}

      {/* Connector line between steps */}
      {steps.length > 0 && (
        <div className="ml-3 h-px bg-border" />
      )}

      {/* Admin: add new step */}
      {isAdmin && (
        <div className="flex items-center gap-2 pl-9">
          <Input
            placeholder="Add a prep step instruction…"
            value={newInstruction}
            onChange={e => setNewInstruction(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addStep()}
            className="text-sm h-8"
          />
          <Button size="sm" className="h-8 px-3" onClick={addStep} disabled={adding || !newInstruction.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Photo fullscreen */}
      <AnimatePresence>
        {photoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPhotoModal(null)}
          >
            <button className="absolute top-4 right-4 text-white" onClick={() => setPhotoModal(null)}>
              <X className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={photoModal}
              alt="Step"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}