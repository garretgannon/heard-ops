import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useSimulator } from '@/lib/SimulatorContext';
import { haptics } from '@/utils/haptics';

const SETUP_STEPS = [
  { name: 'Restaurant Type', icon: '🏪', desc: 'Select restaurant category' },
  { name: 'Stations', icon: '🔧', desc: 'Configure work stations' },
  { name: 'Job Codes', icon: '👤', desc: 'Define job roles' },
  { name: 'Permissions', icon: '🔐', desc: 'Set role permissions' },
  { name: 'Temp Logs', icon: '🌡️', desc: 'Configure temperature monitoring' },
  { name: 'Side Work', icon: '✓', desc: 'Create side work templates' },
  { name: 'Prep', icon: '👨‍🍳', desc: 'Set up prep lists' },
  { name: 'Cleaning', icon: '🧹', desc: 'Build cleaning checklists' },
  { name: 'Handoff', icon: '🤝', desc: 'Configure shift handoffs' },
  { name: 'Employees', icon: '👥', desc: 'Add sample employees' },
];

export default function AdvancedSetupSim({ onBack }) {
  const { setIsSimulating, setSimulationMode } = useSimulator();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [frictionPoints, setFrictionPoints] = useState([]);

  const handleStepComplete = () => {
    haptics.light?.();
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepSkip = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleAddFrictionPoint = () => {
    const friction = prompt('Describe the friction point:');
    if (friction) {
      setFrictionPoints([...frictionPoints, { step: SETUP_STEPS[currentStep].name, note: friction }]);
    }
  };

  const handleComplete = () => {
    haptics.heavy?.();
    setIsSimulating(false);
    setSimulationMode(null);
  };

  const elapsedTime = Math.round((Date.now() - startTime) / 1000);
  const progress = (completedSteps.length / SETUP_STEPS.length) * 100;

  // Completion screen
  if (currentStep >= SETUP_STEPS.length && completedSteps.length === SETUP_STEPS.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <motion.div
          className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 flex items-center gap-2"
        >
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <p className="text-sm font-bold text-orange-300">Advanced Setup Simulation Complete</p>
        </motion.div>

        <div className="text-center py-12">
          <motion.div
            className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: 1 }}
          >
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </motion.div>
          <h3 className="text-2xl font-bold text-foreground mb-1">Setup Complete</h3>
          <p className="text-muted-foreground text-sm mb-8">Advanced setup tested</p>
        </div>

        {/* Results cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border card-glass p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Time</p>
            <p className="text-2xl font-bold text-foreground">{(elapsedTime / 60).toFixed(1)}m</p>
          </div>

          <div className="rounded-xl border border-border card-glass p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Steps Completed</p>
            <p className="text-2xl font-bold text-foreground">{completedSteps.length} / {SETUP_STEPS.length}</p>
          </div>

          <div className="rounded-xl border border-border card-glass p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Friction Points</p>
            <p className="text-2xl font-bold text-yellow-400">{frictionPoints.length}</p>
          </div>
        </div>

        {/* Friction points log */}
        {frictionPoints.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-bold text-amber-300 mb-3">Issues Found</p>
            <div className="space-y-2">
              {frictionPoints.map((item, i) => (
                <div key={i} className="text-sm text-amber-200/80 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="font-bold text-amber-300">{item.step}</p>
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="rounded-xl border border-border card-glass p-4 space-y-2">
          <p className="text-sm font-bold text-foreground mb-2">Recommendations</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>✓ Advanced setup took {(elapsedTime / 60).toFixed(1)} minutes</p>
            <p>✓ {frictionPoints.length > 0 ? '⚠️ Review friction points before launch' : '✓ No friction points detected'}</p>
            <p>✓ Consider breaking setup into multiple sessions</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-3 rounded-lg border border-border card-glass text-foreground font-bold"
          >
            Return to Simulator
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold"
          >
            Done
          </button>
        </div>
      </motion.div>
    );
  }

  // Setup in progress
  const step = SETUP_STEPS[currentStep];
  const isCompleted = completedSteps.includes(currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-sm font-bold text-orange-300">Advanced Setup Simulation Active</p>
        </div>
        <button
          onClick={onBack}
          className="text-orange-300 hover:text-orange-200 text-sm font-bold flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Exit
        </button>
      </motion.div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progress</p>
          <p className="text-xs font-bold text-foreground">{completedSteps.length} / {SETUP_STEPS.length}</p>
        </div>
        <motion.div
          className="h-2 bg-border rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>

      {/* Current step */}
      <div className="rounded-2xl border border-border card-glass p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Step {currentStep + 1} of {SETUP_STEPS.length}
            </p>
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="text-2xl">{step.icon}</span>
              {step.name}
            </h3>
            <p className="text-muted-foreground mt-1">{step.desc}</p>
          </div>
          {isCompleted && <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />}
        </div>

        {/* Placeholder content */}
        <div className="h-32 rounded-lg liquid-card/50 flex items-center justify-center mb-4">
          <p className="text-muted-foreground text-sm">Step content simulated</p>
        </div>

        {/* Step actions */}
        <div className="flex gap-2">
          <button
            onClick={handleStepComplete}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
          >
            {isCompleted ? 'Step Completed' : 'Complete Step'}
          </button>
          <button
            onClick={handleStepSkip}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border card-glass text-foreground font-bold text-sm"
          >
            Next
          </button>
          <button
            onClick={handleAddFrictionPoint}
            className="px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 font-bold text-sm"
          >
            ⚠️ Friction
          </button>
        </div>
      </div>

      {/* Steps timeline */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Timeline</p>
        <div className="grid grid-cols-5 gap-2">
          {SETUP_STEPS.map((s, i) => (
            <motion.div
              key={i}
              className={`p-2 rounded-lg text-center text-xs font-bold transition-all ${
                i === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : completedSteps.includes(i)
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'card-glass border border-border text-muted-foreground'
              }`}
            >
              {s.icon}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="rounded-xl border border-border card-glass p-3 flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Elapsed Time</p>
        <p className="text-2xl font-bold text-primary">{(elapsedTime / 60).toFixed(1)}m</p>
      </div>
    </motion.div>
  );
}