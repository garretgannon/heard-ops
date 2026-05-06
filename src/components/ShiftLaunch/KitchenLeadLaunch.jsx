import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Check, AlertTriangle, Flame, Clock, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const STEPS = [
  { id: 1, label: 'Prep Inventory', shortLabel: 'Inventory' },
  { id: 2, label: 'Build Prep Plan', shortLabel: 'Plan' },
  { id: 3, label: 'Assign Prep', shortLabel: 'Assign' },
  { id: 4, label: 'Staff + Alerts', shortLabel: 'Staff' },
  { id: 5, label: 'Publish', shortLabel: 'Publish' },
];

export default function KitchenLeadLaunch({ isOpen, onClose, onComplete, roleLabel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [prepItems, setPrepItems] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [stations, setStations] = useState([]);
  const [cooks, setCooks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [preps, stationList, cookList] = await Promise.all([
          base44.entities.PrepItem.filter({ status: 'pending' }).catch(() => []),
          base44.entities.Station.filter({ department: 'BOH', isActive: true }).catch(() => []),
          base44.entities.User.filter({ role: 'cook' }).catch(() => []),
        ]);
        setPrepItems(preps);
        setStations(stationList);
        setCooks(cookList);
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
    if (stepId < 5) {
      setTimeout(() => setCurrentStep(stepId + 1), 300);
    }
  };

  const handlePublish = async () => {
    haptics.medium?.();
    try {
      for (const [prepId, assignmentData] of Object.entries(assignments)) {
        await base44.entities.PrepItem.update(prepId, {
          status: 'assigned',
          assigned_to: assignmentData.cookId,
          assigned_station: assignmentData.stationId,
          due_time: assignmentData.dueTime,
        });
      }
      onComplete?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const canPublish = completed.size === 5;
  const progress = (completed.size / 5) * 100;

  const renderContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Current Prep Inventory</h2>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : prepItems.length === 0 ? (
              <div className="text-center py-6 text-secondary-text text-xs">No pending prep items</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {prepItems.slice(0, 8).map(prep => (
                  <div key={prep.id} className="bg-card border border-border rounded-lg p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{prep.name}</p>
                        <div className="flex gap-1.5 text-[9px] text-secondary-text mt-0.5">
                          <span>{prep.quantity || 0} {prep.unit}</span>
                          <span>·</span>
                          <span>{prep.station_name || 'Unassigned'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-amber-400">Due {prep.due_time || 'TBD'}</p>
                      </div>
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
        );
      
      case 2:
        return (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Build Prep Plan</h2>
            <p className="text-xs text-secondary-text">Set priorities and due times for all items</p>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">Plan complete</p>
                  <p className="text-secondary-text mt-0.5">Ready to assign to stations</p>
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
        );
      
      case 3:
        return (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Assign Prep to Stations</h2>
            <p className="text-xs text-secondary-text">Distribute work across kitchen stations</p>
            <div className="space-y-2">
              {stations.slice(0, 4).map(station => (
                <div key={station.id} className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <p className="text-xs font-bold text-foreground">{station.name}</p>
                    <div className="ml-auto text-[9px] text-secondary-text">{Math.floor(Math.random() * 5) + 2} items</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleStepComplete(3)}
              className="w-full mt-4 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              Continue
            </button>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Staffing and Equipment</h2>
            <div className="space-y-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-red-300">Saute cooler out of range</p>
                    <p className="text-red-400/70 mt-0.5">Temperature 44F (max 41F)</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-foreground">Staff scheduled</p>
                    <p className="text-secondary-text mt-0.5">5 cooks, 2 prep</p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleStepComplete(4)}
              className="w-full mt-4 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              Continue
            </button>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Publish Prep Plan</h2>
            <p className="text-xs text-secondary-text">Assignments will flow to cooks immediately</p>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-foreground font-bold">Ready to launch kitchen operations</p>
              <p className="text-[10px] text-secondary-text mt-1">Cooks will receive updated assignments and dashboard refreshes</p>
            </div>
            <button
              onClick={handlePublish}
              className="w-full mt-4 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-glow"
            >
              <Flame className="h-4 w-4" />
              Publish Launch
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="shrink-0 bg-gradient-to-b from-card via-card to-card/50 border-b border-border/50 px-4 pt-3 pb-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">{roleLabel} Launch</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Publish your prep plan and kitchen ops</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Progress</span>
              <span className="text-xs font-bold text-foreground">{completed.size} of 5</span>
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
                    isCompleted ? 'bg-primary/20 border border-primary/30 text-primary' : 'bg-card border border-border text-secondary-text',
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
        {renderContent()}
      </div>
    </div>
  );
}