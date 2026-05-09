import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';

const WHAT_YOU_HAVE = [
  { emoji: '🗺️', label: 'Areas & Stations built' },
  { emoji: '👥', label: 'Roles & hierarchy created' },
  { emoji: '📋', label: 'Starter templates active' },
  { emoji: '🔄', label: 'Shift handoff system on' },
  { emoji: '🧹', label: 'Cleaning checklists ready' },
];

export default function OnboardingSuccess({ config, onLaunch }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-sm mx-auto">
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative inline-flex">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500/30 flex items-center justify-center">
            <span className="text-5xl">🏁</span>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-green-500 border-2 border-background flex items-center justify-center"
          >
            <CheckCircle2 className="h-4 w-4 text-white" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          {config?.restaurantName ? (
            <><span className="text-green-400">{config.restaurantName}</span><br />is Operational.</>
          ) : 'Your OS is Ready.'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Your restaurant operating system has been built. Now let's fine-tune it and reach 100% operational readiness.
        </p>
      </motion.div>

      {/* What was created */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full bg-card border border-border rounded-2xl p-4 mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">What We Built</p>
        </div>
        <div className="space-y-2">
          {WHAT_YOU_HAVE.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.07 }}
              className="flex items-center gap-2.5"
            >
              <span className="text-base">{item.emoji}</span>
              <p className="text-sm text-foreground font-medium">{item.label}</p>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400 ml-auto" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Readiness score teaser */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="w-full bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Operational Readiness</p>
          <p className="text-xs font-bold text-primary">42%</p>
        </div>
        <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '42%' }}
            transition={{ delay: 1, duration: 0.8 }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Complete your setup journey to reach 100% 🎯</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        onClick={onLaunch}
        className="w-full h-14 bg-primary text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-glow active:scale-95 transition-transform"
      >
        Open Setup Journey <ArrowRight className="h-5 w-5" />
      </motion.button>
    </div>
  );
}