import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { BRAND_ASSETS } from '@/lib/brandAssets';

const FEATURES = [
  { icon: "🏗️", label: "Auto-builds your restaurant structure" },
  { icon: "👥", label: "Generates roles & team hierarchy" },
  { icon: "📋", label: "Creates prep, cleaning & handoff systems" },
  { icon: "🚀", label: "Ready to run operations in minutes" },
];

export default function OnboardingWelcome({ onBegin }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-sm mx-auto">
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative inline-flex">
          <img src={BRAND_ASSETS.appIcon} alt="HeardOS" className="h-20 w-20 rounded-2xl object-contain shadow-glow-lg" />
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-400 border-2 border-background flex items-center justify-center">
            <Zap className="h-3 w-3 text-green-900" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-2">
          Build Your Restaurant<br /><span className="text-primary">Operating System.</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          HeardOS sets up your entire operation automatically — team, stations, tasks, logs, and handoffs — so you can run your restaurant, not your software.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-2.5 mb-8"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.07 }}
            className="flex items-center gap-3 card-glass border border-border rounded-xl px-4 py-3 text-left"
          >
            <span className="text-xl">{f.icon}</span>
            <p className="text-sm font-medium text-foreground">{f.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onBegin}
        className="w-full h-14 bg-primary text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-glow active:scale-95 transition-transform"
      >
        Let's Build It <ArrowRight className="h-5 w-5" />
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xs text-muted-foreground mt-4"
      >
        Takes about 2 minutes • No credit card required
      </motion.p>
    </div>
  );
}
