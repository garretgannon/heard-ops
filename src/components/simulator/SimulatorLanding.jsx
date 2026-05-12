import { motion } from 'framer-motion';
import { PlayCircle, Zap, Users, RotateCcw } from 'lucide-react';

export default function SimulatorLanding({ onQuickStart, onAdvanced, onDemo, onReset }) {
  const modes = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Quick Start Simulation',
      desc: 'Test the 2-minute fast-track onboarding flow',
      color: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
      buttonLabel: 'Start Quick Start',
      onClick: onQuickStart,
    },
    {
      icon: <PlayCircle className="h-6 w-6" />,
      title: 'Advanced Setup Simulation',
      desc: 'Test the full custom configuration flow',
      color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
      buttonLabel: 'Start Advanced Setup',
      onClick: onAdvanced,
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Demo Restaurant Mode',
      desc: 'Explore a fully populated fake restaurant with all roles',
      color: 'from-green-500/20 to-green-500/5 border-green-500/30',
      buttonLabel: 'Explore Demo',
      onClick: onDemo,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-8"
      >
        <h2 className="text-3xl font-bold text-foreground">Onboarding Simulator</h2>
        <p className="text-muted-foreground">
          Test the first-time user experience without changing live data. All test data is isolated and can be reset anytime.
        </p>
      </motion.div>

      {/* Simulation modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modes.map((mode, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl border bg-gradient-to-br p-6 flex flex-col ${mode.color}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-primary">
                {mode.icon}
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-muted-foreground font-bold">
                SIMULATOR
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{mode.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">{mode.desc}</p>
            <button
              onClick={mode.onClick}
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-foreground font-bold text-sm transition-all"
            >
              {mode.buttonLabel}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Status cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8"
      >
        <div className="rounded-xl border border-border card-glass p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Simulator Status</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mode:</span>
              <span className="text-foreground font-bold">Ready</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data isolation:</span>
              <span className="text-green-400 font-bold">✓ Active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last test run:</span>
              <span className="text-foreground font-bold">Never</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border card-glass p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Data Safety</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Simulator uses demo records only</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Live data is never affected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Reset anytime</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200"
      >
        <p className="font-bold mb-1">⚠️ Testing Notes</p>
        <p className="text-amber-200/80">
          Use the Checklist and Friction Log tabs to track testing progress and document any issues you find during simulation.
        </p>
      </motion.div>
    </div>
  );
}