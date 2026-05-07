import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingRestaurantType from '@/components/onboarding/OnboardingRestaurantType';
import OnboardingRoleSelection from '@/components/onboarding/OnboardingRoleSelection';
import OnboardingTeamSize from '@/components/onboarding/OnboardingTeamSize';
import OnboardingBuildAnimation from '@/components/onboarding/OnboardingBuildAnimation';
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [restaurantType, setRestaurantType] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [teamSize, setTeamSize] = useState(null);

  const handleStartSetup = () => {
    setStep(2);
  };

  const handleExploreDemo = () => {
    navigate('/');
  };

  const handleRestaurantTypeSelect = async (type) => {
    setRestaurantType(type);
    // Auto-generate basic setup for selected type
    try {
      await base44.entities.Settings.create({
        key: 'onboarding_restaurant_type',
        value: type.id,
      });
    } catch (e) {
      console.error(e);
    }
    setStep(3);
  };

  const handleRoleSelect = async (role) => {
    setUserRole(role);
    try {
      await base44.auth.updateMe({ role: role.id });
    } catch (e) {
      console.error(e);
    }
    setStep(4);
  };

  const handleTeamSizeSelect = (size) => {
    setTeamSize(size);
    setStep(5);
  };

  const handleBuildComplete = () => {
    setStep(6);
  };

  const handleSuccessLaunch = () => {
    navigate('/');
  };

  const handleSuccessCustomize = () => {
    navigate('/my-restaurant');
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <OnboardingWelcome
          key="welcome"
          onStartSetup={handleStartSetup}
          onExploreDemo={handleExploreDemo}
        />
      )}

      {step === 2 && (
        <OnboardingRestaurantType
          key="restaurant-type"
          onBack={handleBack}
          onSelect={handleRestaurantTypeSelect}
        />
      )}

      {step === 3 && (
        <OnboardingRoleSelection
          key="role-selection"
          onBack={handleBack}
          onSelect={handleRoleSelect}
        />
      )}

      {step === 4 && (
        <OnboardingTeamSize
          key="team-size"
          onBack={handleBack}
          onSelect={handleTeamSizeSelect}
        />
      )}

      {step === 5 && (
        <OnboardingBuildAnimation
          key="build-animation"
          onComplete={handleBuildComplete}
        />
      )}

      {step === 6 && (
        <OnboardingSuccess
          key="success"
          onLaunchApp={handleSuccessLaunch}
          onCustomize={handleSuccessCustomize}
        />
      )}
    </AnimatePresence>
  );
}

export const hideBase44Index = true;