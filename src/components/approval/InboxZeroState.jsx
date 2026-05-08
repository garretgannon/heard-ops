import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, Zap, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InboxZeroState({ processedToday, onReset }) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24">
      {/* Celebration animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="mb-6"
      >
        <div className="relative h-24 w-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
          />
          <CheckCircle2 className="absolute inset-0 h-24 w-24 text-green-500" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-extrabold text-foreground text-center mb-2"
      >
        Inbox Zero
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-xl text-muted-foreground text-center mb-8"
      >
        The restaurant gods are pleased.
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 gap-4 mb-8 w-full max-w-xs"
      >
        <div className="rounded-xl bg-card border border-primary/30 p-4 text-center">
          <p className="text-3xl font-extrabold text-primary">{processedToday}</p>
          <p className="text-xs text-muted-foreground mt-1">approvals reviewed</p>
        </div>
        <div className="rounded-xl bg-card border border-green-500/30 p-4 text-center">
          <p className="text-3xl font-extrabold text-green-400">0</p>
          <p className="text-xs text-muted-foreground mt-1">left to clear</p>
        </div>
      </motion.div>

      {/* Motivational message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="rounded-xl bg-primary/10 border border-primary/30 px-6 py-4 text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <p className="font-bold text-primary">You're crushing it!</p>
        </div>
        <p className="text-xs text-secondary-text">
          All approvals processed. Your restaurant is running smoothly.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        onClick={onReset}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all active:scale-95"
      >
        <RotateCcw className="h-4 w-4" /> Check again
      </motion.button>
    </div>
  );
}