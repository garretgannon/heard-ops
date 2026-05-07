import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import MobileModalWrapper from '@/components/MobileModalWrapper';

export default function TemperatureCheckForm({ task, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extract item metadata from task
  const itemMeta = task?.custom_metadata || {};
  const minTemp = itemMeta.minTemperature || 33;
  const maxTemp = itemMeta.maxTemperature || 41;
  const itemType = itemMeta.type || 'refrigerator';
  const equipmentName = itemMeta.equipment || task?.title || 'Equipment';

  // Calculate pass/fail status
  const calculateStatus = (temp) => {
    if (!temp || isNaN(temp)) return null;
    const t = parseFloat(temp);

    if (itemType === 'freezer') {
      return t <= maxTemp ? 'pass' : 'fail';
    } else if (itemType === 'hot_holding') {
      return t >= minTemp ? 'pass' : 'fail';
    } else {
      // refrigerator, cooling_log, custom
      return t >= minTemp && t <= maxTemp ? 'pass' : 'fail';
    }
  };

  const status = calculateStatus(temperature);
  const requiresCorrectiveAction = status === 'fail' && itemMeta.correctiveActionRequired;
  const canSubmit = temperature && status && (!requiresCorrectiveAction || correctiveAction.trim());

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(result.file_url);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error('Photo upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(requiresCorrectiveAction ? 'Corrective action notes required' : 'Please enter temperature');
      return;
    }

    setSaving(true);
    try {
      // Create temperature log
      const log = await base44.entities.UnifiedLog.create({
        type: 'temperature',
        title: equipmentName,
        description: `Temperature check: ${temperature}°F`,
        location: itemMeta.location || '',
        status: status === 'pass' ? 'closed' : 'needs_review',
        priority: status === 'fail' ? 'high' : 'low',
        visibility: 'team_log',
        requires_review: status === 'fail' && itemMeta.managerReviewRequired,
        photo_urls: photoUrl ? [photoUrl] : [],
        custom_metadata: {
          temperature: parseFloat(temperature),
          unit: 'F',
          minTemp,
          maxTemp,
          itemType,
          equipmentName,
          status,
          correctiveAction: correctiveAction || null,
          notes: notes || null,
        },
        created_by: user?.email,
      });

      // Update task to complete
      await base44.entities.Task.update(task.id, {
        status: status === 'pass' ? 'complete' : 'needs_review',
        completed_by_user: user?.email,
        completed_timestamp: new Date().toISOString(),
        linked_log_id: log.id,
      });

      toast.success(`Temperature check ${status === 'pass' ? 'passed' : 'failed'}`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to save temperature check');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <button
      onClick={handleSubmit}
      disabled={!canSubmit || saving}
      className={`w-full h-12 rounded-lg font-bold text-base transition-all flex items-center justify-center gap-2 ${
        status === 'pass'
          ? 'bg-green-600 text-white hover:brightness-110'
          : status === 'fail'
          ? 'bg-red-600 text-white hover:brightness-110'
          : 'bg-muted text-muted-foreground'
      } disabled:opacity-50 active:scale-95`}
    >
      {saving ? 'Saving...' : status === 'pass' ? <><Check className="h-5 w-5" /> PASS</> : status === 'fail' ? <><X className="h-5 w-5" /> FAIL</> : 'Enter Temp'}
    </button>
  );

  return (
    <MobileModalWrapper
      isOpen={true}
      onClose={onClose}
      title="Temperature Check"
      footer={footer}
    >
      <div className="space-y-4">
        {/* Equipment Name (Read-only) */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Equipment</label>
          <div className="px-3 py-3 rounded-lg bg-muted/50 border border-border text-foreground text-base font-semibold">
            {equipmentName}
          </div>
        </div>

        {/* Temperature Range (Read-only) */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Safe Range</label>
          <div className="px-3 py-3 rounded-lg bg-muted/50 border border-border text-foreground text-sm">
            {itemType === 'freezer' ? (
              <span>At or below {maxTemp}°F</span>
            ) : itemType === 'hot_holding' ? (
              <span>At or above {minTemp}°F</span>
            ) : (
              <span>{minTemp}°F - {maxTemp}°F</span>
            )}
          </div>
        </div>

        {/* Temperature Input */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Current Temperature *</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="Enter temp"
              className="flex-1 px-3 py-3 rounded-lg border border-border bg-background text-foreground text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary min-h-12"
              autoFocus
            />
            <div className="px-3 py-3 rounded-lg bg-muted border border-border text-foreground text-base font-bold min-w-12 flex items-center justify-center">
              °F
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {status && (
          <div
            className={`px-4 py-3 rounded-lg text-center font-bold text-base flex items-center justify-center gap-2 ${
              status === 'pass'
                ? 'bg-green-600/15 text-green-500 border border-green-600/30'
                : 'bg-red-600/15 text-red-500 border border-red-600/30'
            }`}
          >
            {status === 'pass' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            {status === 'pass' ? 'WITHIN RANGE' : 'OUT OF RANGE'}
          </div>
        )}

        {/* Corrective Action (Required if Failed) */}
        {requiresCorrectiveAction && (
          <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/30">
            <label className="text-xs font-bold text-red-500 uppercase mb-2 block">
              Corrective Action Required *
            </label>
            <textarea
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="Describe corrective action taken..."
              rows="2"
              className="w-full px-3 py-2 rounded-lg border border-red-600/30 bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-red-500 min-h-12"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes..."
            rows="2"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Photo (Optional)</label>
          {photoUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={photoUrl} alt="Temperature check photo" className="w-full h-32 object-cover" />
              <button
                onClick={() => setPhotoUrl('')}
                className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-red-600/80 text-white text-xs font-bold hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="block p-3 rounded-lg border-2 border-dashed border-border text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
                disabled={uploading}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground font-semibold">
                {uploading ? 'Uploading...' : '+ Add Photo'}
              </span>
            </label>
          )}
        </div>
      </div>
    </MobileModalWrapper>
  );
}