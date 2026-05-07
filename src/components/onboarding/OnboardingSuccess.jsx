import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { haptics } from '@/utils/haptics';

export default function OnboardingSuccess({ onLaunchApp, onCustomize }) {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    haptics.heavy?.();
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ['#E66A1F', '#22C55E', '#3B82F6'],
      shapes: ['circle', 'square'],
      scalar: 1.2,
    });
    setTimeout(() => setShowButtons(true), 800);
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
        className="mb-6"
      >
        <motion.div
          className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: 1 }}
        >
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-foreground mb-2">You're operational!</h2>
        <p className="text-muted-foreground text-sm">
          Your restaurant is ready to run. Let's get started.
        </p>
      </motion.div>

      {/* Features list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-xs space-y-2 mb-8 bg-card p-4 rounded-2xl border border-border"
      >
        {[
          { emoji: '🏪', text: 'Stations created' },
          { emoji: '📋', text: 'Prep lists ready' },
          { emoji: '🤝', text: 'Handoff workflows' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-foreground font-medium">{item.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showButtons ? 1 : 0, y: showButtons ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xs space-y-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLaunchApp}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
        >
          Launch Today View
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCustomize}
          className="w-full h-12 rounded-xl border border-border bg-card text-foreground font-bold"
        >
          Customize Settings
        </motion.button>
      </motion.div>
    </div>
  );
}