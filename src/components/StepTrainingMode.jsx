import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play, CheckCircle2, Wand2 } from "lucide-react";

/**
 * StepTrainingMode — fullscreen swipe-through training experience.
 * Accepts an array of steps with visuals and shows them one at a time.
 */
export default function StepTrainingMode({ steps, initialIndex = 0, onClose }) {
  const [current, setCurrent] = useState(initialIndex);
  const [direction, setDirection] = useState(1);
  const [completed, setCompleted] = useState(new Set());

  const step = steps[current];
  const visual = step?.photo_url || step?.ai_illustration_url;
  const hasVideo = !!step?.video_url;

  const go = (dir) => {
    const next = current + dir;
    if (next < 0 || next >= steps.length) return;
    setDirection(dir);
    setCurrent(next);
  };

  const markDone = () => {
    setCompleted(prev => new Set([...prev, step.id]));
    if (current < steps.length - 1) go(1);
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current]);

  // Touch swipe
  let touchStart = null;
  const onTouchStart = (e) => { touchStart = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
    touchStart = null;
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-[#070C10] flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-white/70 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}>
              <div className={`rounded-full transition-all duration-200 ${
                i === current ? "h-2 w-6 bg-primary" :
                completed.has(s.id) ? "h-2 w-2 bg-green-500" :
                "h-2 w-2 bg-white/20"
              }`} />
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-white/40">{current + 1} / {steps.length}</span>
      </div>

      {/* Main slide */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step?.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Visual area — takes ~65% height */}
            <div className="flex-1 relative flex items-center justify-center bg-[#070C10] overflow-hidden">
              {hasVideo ? (
                <video
                  src={step.video_url}
                  className="max-h-full max-w-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : visual ? (
                <>
                  <img
                    src={visual}
                    alt={step.instruction}
                    className="max-h-full max-w-full object-contain"
                  />
                  {/* Orange bottom vignette */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(255,122,26,0.10) 0%, transparent 40%)' }} />
                  {/* AI badge */}
                  {step.ai_illustration_url && !step.photo_url && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold text-primary border border-primary/30">
                      <Wand2 className="h-3 w-3" /> AI
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/20">
                  <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
                    <Play className="h-6 w-6" />
                  </div>
                  <p className="text-sm">No visual for this step</p>
                </div>
              )}
            </div>

            {/* Instruction card */}
            <div className="flex-shrink-0 px-5 pt-4 pb-6 space-y-4"
              style={{ background: 'linear-gradient(to bottom, rgba(7,12,16,0) 0%, #070C10 15%)' }}>
              {/* Step badge */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[11px] font-extrabold text-primary">
                  {current + 1}
                </div>
                <div className="h-px flex-1 bg-white/5" />
                {completed.has(step?.id) && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
              <p className="text-[17px] font-semibold text-white leading-snug">{step?.instruction}</p>

              {/* CTA */}
              <button
                onClick={markDone}
                className={`w-full h-12 rounded-xl font-bold text-sm transition-all ${
                  completed.has(step?.id)
                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : "bg-primary text-white"
                }`}
              >
                {completed.has(step?.id) ? "✓ Done" : current === steps.length - 1 ? "Complete" : "Got it →"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Side nav arrows (desktop) */}
        {current > 0 && (
          <button onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors lg:flex hidden">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {current < steps.length - 1 && (
          <button onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors lg:flex hidden">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}