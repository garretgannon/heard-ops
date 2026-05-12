import { useState, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import Step1HandoffReview from './Step1HandoffReview';
import Step2StaffingAssignment from './Step2StaffingAssignment';
import Step3PrepReview from './Step3PrepReview';
import Step4ReservationsReview from './Step4ReservationsReview';
import Step5OperationalAlerts from './Step5OperationalAlerts';
import Step6PreShiftNotes from './Step6PreShiftNotes';

const STEPS = [
  { id: 1, label: 'Shift Handoff', shortLabel: 'Handoff' },
  { id: 2, label: 'Staffing & Roles', shortLabel: 'Staff' },
  { id: 3, label: 'Prep Review', shortLabel: 'Prep' },
  { id: 4, label: 'Reservations', shortLabel: 'Reservations' },
  { id: 5, label: 'Operational Alerts', shortLabel: 'Alerts' },
  { id: 6, label: 'Pre-Shift Notes', shortLabel: 'Notes' },
];

export default function ShiftLaunchModal({ isOpen, onComplete, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(new Set());
  const [stepData, setStepData] = useState({});

  useEffect(() => {
    if (isOpen) {
      haptics.medium?.();
    }
  }, [isOpen]);

  const handleStepComplete = (stepId, data) => {
    haptics.light?.();
    setCompleted(prev => new Set([...prev, stepId]));
    setStepData(prev => ({ ...prev, [stepId]: data }));
    
    if (stepId < 6) {
      setTimeout(() => {
        setCurrentStep(stepId + 1);
      }, 300);
    }
  };

  const handleLaunchShift = async () => {
    haptics.medium?.();
    if (onComplete) {
      await onComplete(stepData);
    }
  };

  const canLaunch = completed.size === 6;
  const progress = (completed.size / 6) * 100;

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1HandoffReview onComplete={handleStepComplete} />;
      case 2:
        return <Step2StaffingAssignment onComplete={handleStepComplete} />;
      case 3:
        return <Step3PrepReview onComplete={handleStepComplete} />;
      case 4:
        return <Step4ReservationsReview onComplete={handleStepComplete} />;
      case 5:
        return <Step5OperationalAlerts onComplete={handleStepComplete} />;
      case 6:
        return <Step6PreShiftNotes onComplete={handleStepComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-gradient-to-b from-card via-card to-card/50 border-b border-border/50 px-4 pt-3 pb-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Shift Launch</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Taking operational control of your restaurant</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Progress</span>
              <span className="text-xs font-bold text-foreground">{completed.size} of 6</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STEPS.map((step, idx) => {
              const isCompleted = completed.has(step.id);
              const isCurrent = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isCompleted || isCurrent) {
                      haptics.light?.();
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={!isCompleted && !isCurrent}
                  className={cn(
                    'flex-shrink-0 h-8 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 whitespace-nowrap',
                    isCompleted ? 'bg-primary/20 border border-primary/30 text-primary' : 'card-glass border border-border text-secondary-text',
                    isCurrent && !isCompleted && 'ring-2 ring-primary/50 border-primary/30',
                    !isCompleted && !isCurrent && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isCompleted ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span className="hidden xs:inline">{step.shortLabel}</span>
                    </>
                  ) : (
                    <span className="hidden xs:inline">{step.shortLabel}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>

      {/* Footer Action */}
      <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent border-t border-border/50 px-4 py-3 space-y-2">
        {currentStep < 6 ? (
          <p className="text-[10px] text-secondary-text text-center">
            {currentStep === 1 && 'Review handoff items and acknowledge to continue'}
            {currentStep === 2 && 'Assign all stations and roles before proceeding'}
            {currentStep === 3 && 'Review prep status and assign ownership'}
            {currentStep === 4 && 'Review reservations and acknowledge'}
            {currentStep === 5 && 'Acknowledge all critical alerts'}
            {currentStep === 6 && 'Create your shift focus notes'}
          </p>
        ) : null}
        
        {canLaunch ? (
          <button
            onClick={handleLaunchShift}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            <span>🚀</span>
            Launch Shift
          </button>
        ) : (
          <button
            disabled
            className="w-full h-11 rounded-lg bg-muted/50 text-muted-foreground font-bold text-sm opacity-50 cursor-not-allowed"
          >
            Complete all steps to launch
          </button>
        )}
      </div>
    </div>
  );
}