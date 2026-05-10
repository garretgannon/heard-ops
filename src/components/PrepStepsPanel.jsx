import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, X, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import StepVisualCard from "./StepVisualCard";
import StepTrainingMode from "./StepTrainingMode";

export default function PrepStepsPanel({ itemId, isAdmin }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newInstruction, setNewInstruction] = useState("");
  const [adding, setAdding] = useState(false);
  const [fullscreen, setFullscreen] = useState(null); // { url, caption }
  const [trainingMode, setTrainingMode] = useState(false);

  const load = async () => {
    setLoading(true);
    const results = await base44.entities.PrepStep.filter({ prep_item_id: itemId }, "step_number");
    setSteps(results);
    setLoading(false);
  };

  useEffect(() => { load(); }, [itemId]);

  // Auto-generate AI illustration for steps that have none (staff view)
  useEffect(() => {
    if (isAdmin || loading) return;
    steps.forEach(async (step) => {
      if (!step.photo_url && !step.ai_illustration_url && !step.video_url && step.instruction) {
        try {
          const prompt = `Dark cinematic commercial kitchen instructional illustration. 
Step: "${step.instruction}". 
Style: premium dark background (#0A0F14), clean stainless steel kitchen environment, 
minimal clutter, dramatic top-down or 45-degree angle lighting, orange (#FF7A1A) accent 
highlight on the key action/object, photorealistic textures, modern restaurant kitchen 
aesthetic. Show the action clearly with no text overlays. High contrast. Cinematic depth.`;
          const { url } = await base44.integrations.Core.GenerateImage({ prompt });
          await base44.entities.PrepStep.update(step.id, { ai_illustration_url: url });
          setSteps(prev => prev.map(s => s.id === step.id ? { ...s, ai_illustration_url: url } : s));
        } catch {}
      }
    });
  }, [steps.length, isAdmin, loading]);

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

  const updateStep = (updatedStep) => {
    setSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-5 pt-4 pb-4 space-y-5">
      {/* Training mode launcher */}
      {steps.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{steps.length} step{steps.length !== 1 ? "s" : ""}</p>
          <button
            onClick={() => setTrainingMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Training Mode
          </button>
        </div>
      )}

      {steps.length === 0 && !isAdmin && (
        <p className="text-xs text-muted-foreground italic">No prep steps added yet.</p>
      )}

      {steps.map((step, idx) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: idx * 0.04 }}
          className="space-y-2.5"
        >
          {/* Step header */}
          <div className="flex items-start gap-2.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <p className="text-sm leading-relaxed flex-1">{step.instruction}</p>
            {isAdmin && (
              <button
                onClick={() => deleteStep(step.id)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Visual card */}
          <div className="pl-8">
            <StepVisualCard
              step={step}
              isAdmin={isAdmin}
              onUpdate={updateStep}
              onFullscreen={setFullscreen}
            />
          </div>

          {/* Step connector */}
          {idx < steps.length - 1 && (
            <div className="ml-3 mt-1 flex flex-col items-center gap-1">
              <div className="w-px h-3 bg-border" />
            </div>
          )}
        </motion.div>
      ))}

      {/* Admin: add new step */}
      {isAdmin && (
        <div className="flex items-center gap-2 pl-8">
          <Input
            placeholder="Add a prep step instruction…"
            value={newInstruction}
            onChange={e => setNewInstruction(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addStep()}
            className="text-sm h-9"
          />
          <Button size="sm" className="h-9 px-3" onClick={addStep} disabled={adding || !newInstruction.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            onClick={() => setFullscreen(null)}
          >
            <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white" onClick={() => setFullscreen(null)}>
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              src={fullscreen.url}
              alt={fullscreen.caption}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            {fullscreen.caption && (
              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-4 text-sm text-white/70 text-center max-w-sm"
              >
                {fullscreen.caption}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training mode */}
      <AnimatePresence>
        {trainingMode && (
          <StepTrainingMode
            steps={steps}
            initialIndex={0}
            onClose={() => setTrainingMode(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}