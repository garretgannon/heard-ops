import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { Thermometer } from 'lucide-react';
import MobileModalWrapper from '@/components/MobileModalWrapper';

export default function TemperatureCheckForm({ task, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const minTemp = task.custom_metadata?.minTemperature || 0;
  const maxTemp = task.custom_metadata?.maxTemperature || 100;
  const isPassed = temperature ? parseFloat(temperature) >= minTemp && parseFloat(temperature) <= maxTemp : null;
  const requiresCorrectiveAction = task.custom_metadata?.correctiveActionRequired && !isPassed;

  const handleSubmit = async () => {
    if (!temperature) {
      toast.error('Temperature is required');
      return;
    }

    if (requiresCorrectiveAction && !correctionNotes.trim()) {
      toast.error('Corrective action notes required for failed temperature');
      return;
    }

    setSaving(true);
    try {
      const tempValue = parseFloat(temperature);
      const status = isPassed ? 'complete' : 'needs_review';

      // Update task
      await base44.entities.Task.update(task.id, {
        status,
        completed_by_user: user?.email,
        completed_timestamp: new Date().toISOString(),
        custom_metadata: {
          ...task.custom_metadata,
          submittedTemperature: tempValue,
          submittedNotes: notes,
          correctionNotes: requiresCorrectiveAction ? correctionNotes : '',
          passed: isPassed,
        },
      });

      // Create log record
      await base44.entities.UnifiedLog.create({
        type: 'temperature',
        title: `${task.title} - ${tempValue}°F`,
        description: notes || `Temperature check: ${tempValue}°F`,
        location: task.station || task.custom_metadata?.location,
        employee_name: user?.full_name,
        created_by: user?.email,
        status: isPassed ? 'resolved' : 'needs_review',
        priority: isPassed ? 'medium' : 'high',
        custom_metadata: {
          temperatureValue: tempValue,
          temperatureUnit: 'F',
          minSafe: minTemp,
          maxSafe: maxTemp,
          passFail: isPassed ? 'pass' : 'fail',
          correctiveAction: requiresCorrectiveAction ? correctionNotes : '',
          equipment: task.title,
          taskId: task.id,
        },
        requires_review: !isPassed,
        visibility: 'team_log',
      });

      toast.success(isPassed ? 'Temperature check passed' : 'Temperature check submitted for review');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to submit temperature check');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary active:scale-95 transition-all">
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving || !temperature}
        className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all"
      >
        {saving ? 'Submitting...' : 'Submit Check'}
      </button>
    </>
  );

  return (
    <MobileModalWrapper isOpen={true} onClose={onClose} title={`Temperature Check: ${task.title}`} footer={footer}>
      <div className="space-y-4">
        {/* Equipment Info */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-muted-foreground">Equipment</p>
          <p className="text-sm font-bold text-foreground mt-1">{task.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Safe Range: {minTemp}°F to {maxTemp}°F
          </p>
        </div>

        {/* Temperature Input */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
            Temperature (°F) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="Enter temperature"
              className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Thermometer className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {temperature && (
            <p className={`text-xs font-bold mt-2 ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
              {isPassed ? '✓ Within safe range' : '✗ Outside safe range'}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about the check"
            rows="2"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Corrective Action (if failed) */}
        {requiresCorrectiveAction && (
          <div>
            <label className="text-xs font-bold text-red-400 uppercase mb-2 block">
              Corrective Action Required <span className="text-red-500">*</span>
            </label>
            <textarea
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              placeholder="What action was taken to correct the temperature?"
              rows="3"
              className="w-full px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-foreground text-base focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        )}
      </div>
    </MobileModalWrapper>
  );
}