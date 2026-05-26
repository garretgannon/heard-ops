import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSimulator } from '@/lib/SimulatorContext';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { RotateCcw } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import SimulatorLanding from '@/components/simulator/SimulatorLanding';
import QuickStartSim from '@/components/simulator/QuickStartSim';
import AdvancedSetupSim from '@/components/simulator/AdvancedSetupSim';
import DemoRestaurantSim from '@/components/simulator/DemoRestaurantSim';
import RoleSwitcher from '@/components/simulator/RoleSwitcher';
import TestingChecklist from '@/components/simulator/TestingChecklist';
import FrictionTracker from '@/components/simulator/FrictionTracker';

const PAGES = {
  LANDING: 'landing',
  QUICK_START: 'quick_start',
  ADVANCED: 'advanced',
  DEMO: 'demo',
};

export default function OnboardingSimulator() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const { isSimulating, simulationMode, resetSimulation } = useSimulator();
  const [page, setPage] = useState(PAGES.LANDING);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showFriction, setShowFriction] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (isAdmin === false) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (isAdmin === false) return null;

  const handleStartQuickStart = () => {
    haptics.medium?.();
    setPage(PAGES.QUICK_START);
  };

  const handleStartAdvanced = () => {
    haptics.medium?.();
    setPage(PAGES.ADVANCED);
  };

  const handleStartDemo = () => {
    haptics.medium?.();
    setPage(PAGES.DEMO);
  };

  const handleReset = () => {
    haptics.light?.();
    if (confirm('Reset all simulation data? This will not affect live data.')) {
      resetSimulation();
      setPage(PAGES.LANDING);
    }
  };

  const handleBack = () => {
    haptics.light?.();
    setPage(PAGES.LANDING);
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopPageHeader title="Onboarding Simulator" subtitle="Admin testing — No live data affected" />
      {/* Top admin bar */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Onboarding Simulator</h1>
            <p className="text-xs text-muted-foreground">Admin testing — No live data affected</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className="px-3 py-1.5 rounded-2xl bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 hover:bg-purple-500/30 transition-all"
            >
              Checklist
            </button>
            <button
              onClick={() => setShowFriction(!showFriction)}
              className="px-3 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-all"
            >
              Friction Log
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-2xl bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Role switcher (if simulating) */}
      {isSimulating && simulationMode === 'demo' && (
        <RoleSwitcher onBack={handleBack} />
      )}

      {/* Main content */}
      <div className="app-page">
        {page === PAGES.LANDING && (
          <SimulatorLanding
            onQuickStart={handleStartQuickStart}
            onAdvanced={handleStartAdvanced}
            onDemo={handleStartDemo}
            onReset={handleReset}
          />
        )}

        {page === PAGES.QUICK_START && (
          <QuickStartSim onBack={handleBack} />
        )}

        {page === PAGES.ADVANCED && (
          <AdvancedSetupSim onBack={handleBack} />
        )}

        {page === PAGES.DEMO && (
          <DemoRestaurantSim onBack={handleBack} />
        )}
      </div>

      {/* Side panels */}
      {showChecklist && (
        <TestingChecklist onClose={() => setShowChecklist(false)} />
      )}

      {showFriction && (
        <FrictionTracker onClose={() => setShowFriction(false)} />
      )}
    </div>
  );
}

export const hideBase44Index = true;