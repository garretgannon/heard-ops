import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, RotateCcw, ShieldCheck } from 'lucide-react';

export default function InboxZeroState({ processedToday, onReset }) {
  const [showConfetti] = useState(true);

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 90,
        spread: 64,
        origin: { y: 0.62 },
      });
    }
  }, [showConfetti]);

  return (
    <div className="app-screen flex items-center justify-center px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-card-lg w-full max-w-sm text-center"
      >
        <div className="relative mx-auto mb-7 h-28 w-28">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent shadow-[0_0_32px_hsl(var(--primary)/0.35)]"
          />
          <div className="absolute inset-3 flex items-center justify-center rounded-full border border-green-500/50 bg-green-500/10 text-green-400">
            <Check className="h-12 w-12" />
          </div>
        </div>

        <p className="metric-label">Completed</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Inbox Zero</h1>
        <p className="mt-2 text-sm text-muted-foreground">All approvals are clear.</p>

        <div className="my-7 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-primary/35 bg-primary/10 p-4">
            <p className="text-3xl font-black text-primary">{processedToday}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">reviewed</p>
          </div>
          <div className="rounded-lg border border-green-500/35 bg-green-500/10 p-4">
            <p className="text-3xl font-black text-green-400">0</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">remaining</p>
          </div>
        </div>

        <div className="mb-7 flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-black/25 px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Queue reviewed and ready for service.</span>
        </div>

        <button
          onClick={onReset}
          className="quick-link-primary w-full justify-center"
        >
          <RotateCcw className="h-4 w-4" />
          Check again
        </button>
      </motion.div>
    </div>
  );
}
