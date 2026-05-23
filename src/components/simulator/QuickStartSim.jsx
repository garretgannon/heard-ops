import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useSimulator } from '@/lib/SimulatorContext';
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/utils/haptics';
import confetti from 'canvas-confetti';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingRestaurantType from '@/components/onboarding/OnboardingRestaurantType';
import OnboardingRoleSelection from '@/components/onboarding/OnboardingRoleSelection';
import OnboardingTeamSize from '@/components/onboarding/OnboardingTeamSize';
import OnboardingBuildAnimation from '@/components/onboarding/OnboardingBuildAnimation';
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess';

export default function QuickStartSim({ onBack }) {
  const { setIsSimulating, setSimulationMode, setSimulatedRestaurantType, setSimulatedRole } = useSimulator();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState({
    restaurantType: 'full_service',
    role: 'manager',
    teamSize: 'medium',
  });

  const handleStartWithPresets = () => {
    haptics.heavy?.();
    setIsSimulating(true);
    setSimulationMode('quick_start');
    setShowPresets(false);
    setStep(2);
  };

  const handleWelcomeStart = () => {
    navigate('/team-structure-wizard');
  };

  const handleRestaurantType = (type) => {
    setSimulatedRestaurantType(type);
    setStep(3);
  };

  const handleRole = (role) => {
    setSimulatedRole(role);
    setStep(4);
  };

  const handleTeamSize = () => {
    setStep(5);
  };

  const handleBuildComplete = () => {
    setStep(6);
  };

  const handleSuccess = () => {
    haptics.heavy?.();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF6B00', '#22C55E', '#3B82F6'],
    });
    setStep(7);
  };

  const handleDone = () => {
    onBack();
    setIsSimulating(false);
  };

  const stepContent = (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <div key="welcome" className="h-full">
          <OnboardingWelcome onBegin={handleWelcomeStart} />
        </div>
      )}

      {step === 2 && showPresets && (
        <div key="presets" className="text-center py-12">
          <p className="text-muted-foreground">Configuring presets...</p>
        </div>
      )}

      {step === 3 && (
        <div key="restaurant">
          <OnboardingRestaurantType onBack={() => setStep(2)} onSelect={handleRestaurantType} />
        </div>
      )}

      {step === 4 && (
        <div key="role">
          <OnboardingRoleSelection onBack={() => setStep(3)} onSelect={handleRole} />
        </div>
      )}

      {step === 5 && (
        <div key="team">
          <OnboardingTeamSize onBack={() => setStep(4)} onSelect={handleTeamSize} />
        </div>
      )}

      {step === 6 && (
        <div key="build">
          <OnboardingBuildAnimation onComplete={handleBuildComplete} />
        </div>
      )}

      {step === 7 && (
        <div key="success">
          <OnboardingSuccess
            onLaunchApp={handleSuccess}
            onCustomize={handleSuccess}
          />
        </div>
      )}

      {step === 8 && (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <motion.div
            className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: 1 }}
          >
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </motion.div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Simulation Complete</h3>
          <p className="text-muted-foreground mb-6">Quick Start flow tested successfully</p>
          <button
            onClick={handleDone}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold"
          >
            Return to Simulator
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-4">
      {/* Simulation banner */}
      {step > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-sm font-bold text-orange-300">Quick Start Simulation Active</p>
          </div>
          <button
            onClick={onBack}
            className="text-orange-300 hover:text-orange-200 text-sm font-bold flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Exit Sim
          </button>
        </motion.div>
      )}

      {/* Preset selector modal */}
      {showPresets && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Quick Start Options</h3>
              <p className="text-sm text-muted-foreground">Choose your test profile or use defaults</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Restaurant</label>
                <select
                  value={presets.restaurantType}
                  onChange={(e) => setPresets({ ...presets, restaurantType: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
                >
                  <option value="full_service">Full Service</option>
                  <option value="fast_casual">Fast Casual</option>
                  <option value="qsr">Quick Service</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Role</label>
                <select
                  value={presets.role}
                  onChange={(e) => setPresets({ ...presets, role: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">General Manager</option>
                  <option value="chef">Executive Chef</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Team Size</label>
                <select
                  value={presets.teamSize}
                  onChange={(e) => setPresets({ ...presets, teamSize: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
                >
                  <option value="small">Small (5-15)</option>
                  <option value="medium">Medium (25-50)</option>
                  <option value="large">Large (50+)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPresets(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border card-glass text-foreground font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleStartWithPresets}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
              >
                Start Simulation
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Mobile: render directly. Desktop: render inside phone frame */}
      <div className="lg:hidden">
        {stepContent}
      </div>

      <div className="hidden lg:flex items-start justify-center gap-8 pt-2">
        {/* Phone frame mockup */}
        <div
          className="relative shrink-0"
          style={{
            width: 375,
            height: 720,
            background: 'rgba(255,255,255,0.03)',
            border: '2px solid rgba(255,255,255,0.12)',
            borderRadius: 44,
            boxShadow: '0 0 0 6px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* Notch */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
            style={{
              width: 126,
              height: 34,
              background: 'rgba(5,8,14,1)',
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}
          />
          {/* Screen content */}
          <div className="absolute inset-0 overflow-y-auto" style={{ paddingTop: 44 }}>
            {stepContent}
          </div>
        </div>

        {/* Desktop info panel */}
        <div className="flex flex-col gap-4 pt-4 max-w-xs">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/30 mb-1">Simulator</p>
            <h3 className="text-lg font-bold text-white">Quick Start Flow</h3>
            <p className="text-sm text-white/40 mt-1 leading-relaxed">
              Preview the new user onboarding experience exactly as it appears on a real device.
            </p>
          </div>
          <div
            className="p-4 rounded-xl flex flex-col gap-2"
            style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)' }}
          >
            <p className="text-xs font-semibold text-white/70">Step {step} of 8</p>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(step / 8) * 100}%`, background: '#FF6B00' }}
              />
            </div>
          </div>
          <p className="text-xs text-white/30 leading-relaxed">
            "Let's Build It" opens the Team Setup Wizard. Complete the wizard to see the full new-user flow.
          </p>
        </div>
      </div>
    </div>
  );
}