import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import MobileModalWrapper from '@/components/MobileModalWrapper';

export default function TemperatureManagerReview({ log, isOpen, onClose, onUpdate }) {
  const [managerNotes, setManagerNotes] = useState(log?.custom_metadata?.managerNotes || '');
  const [reviewStatus, setReviewStatus] = useState(log?.review_status || 'pending');
  const [followUpRequired, setFollowUpRequired] = useState(log?.follow_up_required || false);
  const [followUpDueDate, setFollowUpDueDate] = useState(log?.follow_up_due_date || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!log) return;

    setSaving(true);
    try {
      await base44.entities.UnifiedLog.update(log.id, {
        custom_metadata: {
          ...log.custom_metadata,
          managerNotes,
        },
        review_status: reviewStatus,
        requires_review: reviewStatus === 'pending',
        follow_up_required: followUpRequired,
        follow_up_due_date: followUpRequired ? followUpDueDate : null,
        reviewed_by: (await base44.auth.me()).email,
        reviewed_timestamp: new Date().toISOString(),
      });

      toast.success('Review saved');
      onUpdate?.();
      onClose?.();
    } catch (err) {
      toast.error('Failed to save review');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!log) return null;

  const isFailed = log.custom_metadata?.passFail === 'fail';

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary active:scale-95 transition-all">
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Review'}
      </button>
    </>
  );

  return (
    <MobileModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Manager Review"
      footer={footer}
    >
      {/* Log Details */}
      <div className="space-y-4 pb-4">
        <div className="bg-background rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground">Equipment</label>
            <p className="text-foreground font-semibold">{log.title}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Location</label>
            <p className="text-foreground">{log.location || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Reading</label>
            <p className="text-foreground">{log.custom_metadata?.temperatureValue}°F</p>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              Status
              {isFailed ? (
                <AlertTriangle className="h-4 w-4 text-status-critical" />
              ) : (
                <CheckCircle className="h-4 w-4 text-status-success" />
              )}
            </label>
            <p className={`font-semibold ${isFailed ? 'text-status-critical' : 'text-status-success'}`}>
              {isFailed ? 'FAILED' : 'PASSED'}
            </p>
          </div>
        </div>

        {/* Manager Notes */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
            Manager Notes
          </label>
          <textarea
            value={managerNotes}
            onChange={(e) => setManagerNotes(e.target.value)}
            placeholder="Add your review comments..."
            rows="3"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Review Status */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
            Review Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setReviewStatus(status)}
                className={`p-3 rounded-lg border font-semibold text-xs uppercase transition-all ${
                  reviewStatus === status
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-background border-border text-muted-foreground hover:border-border/60'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Follow-up */}
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-background min-h-11">
          <input
            type="checkbox"
            checked={followUpRequired}
            onChange={(e) => setFollowUpRequired(e.target.checked)}
            className="rounded border-border w-5 h-5 cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">Assign follow-up action</span>
        </label>

        {followUpRequired && (
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
              Due Date
            </label>
            <input
              type="date"
              value={followUpDueDate}
              onChange={(e) => setFollowUpDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>
    </MobileModalWrapper>
  );
}