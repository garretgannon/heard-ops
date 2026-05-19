import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, List, CheckCircle2, Wand2, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import IngredientSheet from "./IngredientSheet";
import PhotoUploadModule from "./PhotoUploadModule";
import useHaptic from "@/hooks/useHaptic";

function ChefSignOffOverlay({ itemName, onApprove, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-[#030507] flex flex-col items-center justify-center px-8 text-center"
    >
      <div className="h-20 w-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6">
        <ChefHat className="h-10 w-10 text-emerald-400" />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/70 mb-2">Chef Sign-Off Required</p>
      <p className="text-2xl font-extrabold text-white mb-2">{itemName}</p>
      <p className="text-white/40 text-sm mb-10">Hand your phone to the chef to taste and approve this item before it can be marked complete.</p>
      <button
        onClick={onApprove}
        className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-extrabold text-base flex items-center justify-center gap-2 mb-3 active:scale-[0.97] transition-transform"
      >
        <CheckCircle2 className="h-5 w-5" />
        Tastes Good — Approve
      </button>
      <button
        onClick={onCancel}
        className="text-white/30 text-sm font-semibold py-2"
      >
        Cancel
      </button>
    </motion.div>
  );
}

export default function ActivePrepStep({
  item,
  steps = [],
  ingredients = [],
  requiresPhoto = false,
  requiresChefApproval = false,
  onComplete,
  onClose,
}) {
  const haptic = useHaptic();
  const [stepIndex, setStepIndex] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [chefApproved, setChefApproved] = useState(false);
  const [showChefSignOff, setShowChefSignOff] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showPhotoModule, setShowPhotoModule] = useState(false);
  const [direction, setDirection] = useState(1);

  const totalSteps = steps.length;
  const step = steps[stepIndex];
  const isLast = stepIndex === totalSteps - 1;
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) : 1;

  const visual = step?.photo_url || step?.ai_illustration_url;

  const advance = () => {
    haptic.tap();
    if (isLast) {
      if (requiresPhoto && photos.length === 0) {
        setShowPhotoModule(true);
        return;
      }
      if (requiresChefApproval && !chefApproved) {
        setShowChefSignOff(true);
        return;
      }
      onComplete?.({ photos, chefApproved });
    } else {
      setDirection(1);
      setStepIndex(i => i + 1);
    }
  };

  const back = () => {
    if (stepIndex === 0) return;
    haptic.tap();
    setDirection(-1);
    setStepIndex(i => i - 1);
  };

  const slideVariants = {
    enter: d => ({ x: d > 0 ? "60%" : "-60%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: d => ({ x: d > 0 ? "-40%" : "40%", opacity: 0 }),
  };

  // No steps: show single-action complete screen
  if (totalSteps === 0) {
    const photoBlocking = requiresPhoto && photos.length === 0;
    const chefBlocking = requiresChefApproval && !chefApproved;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-[#070C10] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <button onClick={onClose} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
            <X className="h-4 w-4 text-white/60" />
          </button>
          <p className="text-sm font-bold text-white/50">{item?.name}</p>
          <div className="w-9" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <p className="text-2xl font-extrabold">{item?.name}</p>
          {item?.notes && <p className="text-white/40 text-sm leading-relaxed">{item.notes}</p>}
          {requiresPhoto && (
            <div className="w-full">
              <PhotoUploadModule photos={photos} onAdd={url => setPhotos(p => [...p, url])} required label="Completion Photo" />
            </div>
          )}
          {requiresChefApproval && (
            <button
              onClick={() => setShowChefSignOff(true)}
              className={cn(
                "w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                chefApproved
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
              )}
            >
              <ChefHat className="h-4 w-4" />
              {chefApproved ? "Chef Approved" : "Get Chef Sign-Off"}
            </button>
          )}
          <button
            onClick={() => {
              if (photoBlocking || chefBlocking) return;
              onComplete?.({ photos, chefApproved });
            }}
            disabled={photoBlocking || chefBlocking}
            className="w-full h-14 rounded-2xl bg-primary text-white font-extrabold text-base disabled:opacity-40"
          >
            Mark Complete
          </button>
        </div>
        {showChefSignOff && createPortal(
          <AnimatePresence>
            <ChefSignOffOverlay
              itemName={item?.name}
              onApprove={() => { setChefApproved(true); setShowChefSignOff(false); }}
              onCancel={() => setShowChefSignOff(false)}
            />
          </AnimatePresence>,
          document.body
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#070C10] flex flex-col overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
        <button onClick={onClose} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
          <X className="h-4 w-4 text-white/60" />
        </button>
        <p className="text-xs font-bold text-white/30 tracking-widest uppercase">{item?.name}</p>
        <button
          onClick={() => setShowIngredients(true)}
          className="h-9 px-3 rounded-xl bg-white/5 flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors"
        >
          <List className="h-3.5 w-3.5" />
          Ingredients
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3 flex-shrink-0">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-white/20 font-semibold">Step {stepIndex + 1}</span>
          <span className="text-[10px] text-white/20">{totalSteps} total</span>
        </div>
      </div>

      {/* Step area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={stepIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Visual */}
            {(visual || step?.video_url) && (
              <div className="flex-shrink-0 relative h-[42vh] bg-[#0A0F14] overflow-hidden">
                {step?.video_url ? (
                  <video src={step.video_url} className="w-full h-full object-cover" autoPlay muted playsInline />
                ) : (
                  <img src={visual} alt={step?.instruction} className="w-full h-full object-cover" />
                )}
                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, #070C10 0%, transparent 100%)' }} />
                {/* AI badge */}
                {step?.ai_illustration_url && !step?.photo_url && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-bold text-primary border border-primary/30">
                    <Wand2 className="h-2.5 w-2.5" /> AI
                  </div>
                )}
                {/* Orange glow */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(255,122,26,0.06) 0%, transparent 50%)' }} />
              </div>
            )}

            {/* Text — fills remaining space */}
            <div className={cn("flex-1 flex flex-col justify-center px-6", visual || step?.video_url ? "pt-2" : "pt-12")}>
              {/* Step counter bubble */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-extrabold text-primary">
                  {stepIndex + 1}
                </div>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <p className={cn(
                "font-extrabold leading-tight text-white",
                visual || step?.video_url ? "text-[22px]" : "text-[28px]"
              )}>
                {step?.instruction}
              </p>

              {step?.notes && (
                <p className="mt-3 text-white/40 text-sm leading-relaxed">{step.notes}</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="flex-shrink-0 px-5 pb-8 pt-3 space-y-3">
        {/* Photo upload on last step */}
        {isLast && (
          <div>
            <PhotoUploadModule
              photos={photos}
              onAdd={url => setPhotos(p => [...p, url])}
              onRemove={url => setPhotos(p => p.filter(u => u !== url))}
              required={requiresPhoto}
              label={requiresPhoto ? "Completion Photo (Required)" : "Add Completion Photo"}
            />
          </div>
        )}

        {/* Chef sign-off button on last step */}
        {isLast && requiresChefApproval && (
          <button
            onClick={() => setShowChefSignOff(true)}
            className={cn(
              "w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
              chefApproved
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
            )}
          >
            <ChefHat className="h-4 w-4" />
            {chefApproved ? "Chef Approved" : "Get Chef Sign-Off"}
          </button>
        )}

        <div className="flex gap-3">
          {stepIndex > 0 && (
            <button onClick={back} className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 font-bold text-xl">
              ‹
            </button>
          )}
          <motion.button
            onClick={advance}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            disabled={isLast && ((requiresPhoto && photos.length === 0) || (requiresChefApproval && !chefApproved))}
            className="flex-1 h-14 rounded-2xl bg-primary text-white font-extrabold text-base flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isLast ? (
              <><CheckCircle2 className="h-5 w-5" /> Complete</>
            ) : (
              <>Next <ChevronRight className="h-5 w-5" /></>
            )}
          </motion.button>
        </div>
      </div>

      <IngredientSheet
        ingredients={ingredients}
        open={showIngredients}
        onClose={() => setShowIngredients(false)}
      />

      {showChefSignOff && createPortal(
        <AnimatePresence>
          <ChefSignOffOverlay
            itemName={item?.name}
            onApprove={() => { setChefApproved(true); setShowChefSignOff(false); }}
            onCancel={() => setShowChefSignOff(false)}
          />
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}