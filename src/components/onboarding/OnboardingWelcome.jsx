import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Zap } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function OnboardingWelcome({ onStartSetup, onExploreDemo }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4,
    }));
    setParticles(p);
  }, []);

  const handleStartSetup = () => {
    haptics.medium?.();
    onStartSetup();
  };

  const handleExploreDemo = () => {
    haptics.light?.();
    onExploreDemo();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 animate-pulse-subtle" />
      </div>

      {/* Floating particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 100 }}
          className="mb-8"
        >
          <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-[28px] font-extrabold text-foreground leading-tight mb-2">
            Heard<span className="text-primary">OS</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-2xl font-bold text-foreground mb-3">
            Restaurant operations without chaos.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Prep. Tasks. Logs. Handoffs. Scheduling. One system.
          </p>
        </motion.div>

        {/* Progress dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-2 mb-12 justify-center"
        >
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <motion.div
              key={i}
              className="h-2 rounded-full bg-border"
              animate={{ width: i === 0 ? 24 : 8 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-xs space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartSetup}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Zap className="h-4 w-4" />
            Start Setup
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExploreDemo}
            className="w-full h-12 rounded-xl border border-border bg-card text-foreground font-bold text-base"
          >
            Explore Demo
          </motion.button>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-8 text-xs text-muted-foreground"
        >
          ✨ Get operational in under 2 minutes
        </motion.p>
      </div>
    </div>
  );
}