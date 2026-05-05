import { useShiftMode } from '@/lib/ShiftModeContext';
import { Check, ChevronRight } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function SetupChecklist({ shift, onContinue }) {
  const { updateSetupChecklist } = useShiftMode();
  const allComplete = shift.setup_checklist.every(item => item.completed);

  const handleCheck = async (itemId) => {
    const item = shift.setup_checklist.find(i => i.id === itemId);
    await updateSetupChecklist(shift.id, itemId, !item.completed);
    haptics.light();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold">Setup Checklist</h1>
        <p className="text-xs text-secondary-text mt-1">Complete setup before running shift</p>
      </div>

      {/* Checklist */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {shift.setup_checklist.map(item => (
          <button
            key={item.id}
            onClick={() => handleCheck(item.id)}
            className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${
              item.completed
                ? 'bg-green-500/10 border-green-500/30 opacity-60'
                : 'bg-card border-border hover:bg-muted'
            }`}
          >
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
              item.completed
                ? 'bg-green-500 border-green-500'
                : 'border-secondary-text'
            }`}>
              {item.completed && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="text-sm font-bold text-foreground text-left">{item.title}</span>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <div className="bg-card border-t border-border p-4">
        <button
          onClick={onContinue}
          disabled={!allComplete}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Shift
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}