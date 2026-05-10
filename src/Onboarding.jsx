import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingQuickStart from '@/components/onboarding/OnboardingQuickStart';
import OnboardingBuildAnimation from '@/components/onboarding/OnboardingBuildAnimation';
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);

  const handleBegin = () => setStep(2);

  const handleQuickStartComplete = async (data) => {
    setConfig(data);
    setStep(3);
  };

  const handleBuildComplete = () => setStep(4);

  const handleLaunch = async () => {
    await base44.entities.Settings.create({ key: 'onboarding_complete', value: 'true' }).catch(() => {});
    navigate('/setup-journey');
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="h-full">
            <OnboardingWelcome onBegin={handleBegin} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="quickstart" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="h-full">
            <OnboardingQuickStart onBack={() => setStep(1)} onComplete={handleQuickStartComplete} />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="build" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="h-full">
            <OnboardingBuildAnimation config={config} onComplete={handleBuildComplete} />
          </motion.div>
        )}
        {step === 4 && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="h-full">
            <OnboardingSuccess config={config} onLaunch={handleLaunch} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const hideBase44Index = true;