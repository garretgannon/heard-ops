import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const BUILD_STEPS = [
  { icon: '🏪', text: 'Creating stations' },
  { icon: '🧹', text: 'Building cleaning system' },
  { icon: '🤝', text: 'Creating handoff workflows' },
  { icon: '📝', text: 'Creating manager logs' },
  { icon: '🌡️', text: 'Building temp logs' },
  { icon: '👥', text: 'Creating role dashboards' },
  { icon: '📊', text: 'Preparing Today View' },
];

export default function OnboardingBuildAnimation({ onComplete }) {
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    BUILD_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setCompleted(prev => [...prev, i]);
        if (i === BUILD_STEPS.length - 1) {
          setTimeout(() => onComplete(), 800);
        }
      }, i * 300 + 400);
    });
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/20 mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-3xl">⚙️</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Setting up your restaurant</h2>
        <p className="text-muted-foreground text-sm mt-2">This only takes a moment...</p>
      </motion.div>

      {/* Build steps */}
      <div className="w-full max-w-xs space-y-3 mb-8">
        {BUILD_STEPS.map((step, i) => {
          const isDone = completed.includes(i);
          const isActive = completed.includes(i) && (i === completed[completed.length - 1]);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isDone ? 1 : 0.4, x: 0 }}
              transition={{ delay: i * 0.3 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isDone ? 'bg-primary/10' : 'bg-card'
              }`}
            >
              {isDone ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              ) : isActive ? (
                <motion.div
                  className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/40"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ) : (
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-border" />
              )}
              <span className="text-sm font-medium text-foreground">{step.text}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <motion.div
        className="w-full max-w-xs h-2 bg-border rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/50"
          initial={{ width: '0%' }}
          animate={{ width: `${(completed.length / BUILD_STEPS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Percentage */}
      <motion.p
        className="text-xs text-muted-foreground mt-3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round((completed.length / BUILD_STEPS.length) * 100)}% ready
      </motion.p>
    </div>
  );
}