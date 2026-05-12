import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, ChefHat, AlertCircle, Thermometer, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const STEPS = [
  { id: 1, label: 'My Assignments', shortLabel: 'Assignments' },
  { id: 2, label: 'Station Review', shortLabel: 'Station' },
  { id: 3, label: 'Readiness Check', shortLabel: 'Ready' },
];

export default function CookLaunch({ isOpen, onClose, onComplete, roleLabel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(new Set());
  const [assignedPrep, setAssignedPrep] = useState([]);
  const [stationNotes, setStationNotes] = useState('');
  const [readyConfirmed, setReadyConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const preps = await base44.entities.PrepItem.filter({ status: 'assigned' }).catch(() => []);
        setAssignedPrep(preps.filter(p => p.assigned_to === 'current-user-email'));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) load();
  }, [isOpen]);

  const handleStepComplete = (stepId) => {
    haptics.light?.();
    setCompleted(prev => new Set([...prev, stepId]));
    if (stepId < 3) {
      setTimeout(() => setCurrentStep(stepId + 1), 300);
    }
  };

  const handleReadyConfirm = async () => {
    haptics.medium?.();
    try {
      await base44.entities.Shift.update('current-shift-id', {
        cook_ready: true,
        ready_at: new Date().toISOString(),
      });
      onComplete?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const canFinish = completed.size === 3;
  const progress = (completed.size / 3) * 100;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="shrink-0 bg-gradient-to-b from-card via-card to-card/50 border-b border-border/50 px-4 pt-3 pb-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">{roleLabel} Launch</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Station ready check</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Ready</span>
              <span className="text-xs font-bold text-foreground">{completed.size} of 3</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {STEPS.map(step => {
              const isCompleted = completed.has(step.id);
              const isCurrent = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => { if (isCompleted || isCurrent) { haptics.light?.(); setCurrentStep(step.id); } }}
                  disabled={!isCompleted && !isCurrent}
                  className={cn(
                    'flex-shrink-0 h-8 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 whitespace-nowrap',
                    isCompleted ? 'bg-primary/20 border border-primary/30 text-primary' : 'card-glass border border-border text-secondary-text',
                    isCurrent && !isCompleted && 'ring-2 ring-primary/50 border-primary/30',
                    !isCompleted && !isCurrent && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : <span className="hidden xs:inline">{step.shortLabel}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {currentStep === 1 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Your Prep Assignments</h2>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assignedPrep.length === 0 ? (
              <div className="text-center py-6 text-secondary-text text-xs">No assignments for this shift</div>
            ) : (
              <div className="space-y-2">
                {assignedPrep.map(prep => (
                  <div key={prep.id} className="card-glass border border-border rounded-lg p-2.5">
                    <div className="flex items-start gap-2">
                      <ChefHat className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">{prep.name}</p>
                        <div className="flex gap-1.5 text-[9px] text-secondary-text mt-0.5">
                          <span>{prep.quantity} {prep.unit}</span>
                          <span>·</span>
                          <span>Due {prep.due_time || 'TBD'}</span>
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-bold text-amber-400">Priority</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => handleStepComplete(1)}
              className="w-full mt-4 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              Continue
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Station Readiness Check</h2>
            <p className="text-xs text-secondary-text">Review your station and note any issues</p>
            
            <div className="space-y-2">
              <div className="card-glass border border-border rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  <Thermometer className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Cooler temp check</p>
                    <p className="text-secondary-text mt-0.5">41F - PASS</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-red-300">Knives need sharpening</p>
                    <p className="text-red-400/70 mt-0.5">Report to lead before service</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleStepComplete(2)}
              className="w-full mt-4 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              Continue
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Ready to Start</h2>
            <p className="text-xs text-secondary-text">Confirm your station is prepped and ready</p>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readyConfirmed}
                  onChange={(e) => {
                    haptics.light?.();
                    setReadyConfirmed(e.target.checked);
                  }}
                  className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-xs text-foreground font-semibold">
                  I have reviewed my assignments, checked my station, and I am ready to start service.
                </span>
              </label>

              <button
                onClick={() => handleStepComplete(3)}
                disabled={!readyConfirmed}
                className={cn(
                  'w-full h-9 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all',
                  readyConfirmed
                    ? 'bg-primary text-primary-foreground active:scale-95'
                    : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                )}
              >
                <Check className="h-4 w-4" />
                Continue
              </button>
            </div>

            {canFinish && (
              <button
                onClick={handleReadyConfirm}
                className="w-full h-9 rounded-lg bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <Flame className="h-4 w-4" />
                Start Shift
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}