import { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';

const ISSUE_TYPES = [
  { label: 'Station Issue', value: 'station', color: 'text-orange-400' },
  { label: 'Shortage', value: 'shortage', color: 'text-red-400' },
  { label: 'Staffing', value: 'staffing', color: 'text-amber-400' },
  { label: 'Food Safety', value: 'food_safety', color: 'text-red-500' },
  { label: 'Quality', value: 'quality', color: 'text-yellow-400' },
  { label: 'Other', value: 'other', color: 'text-blue-400' },
];

const SEVERITY = [
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
];

const severityToPriority = {
  info: 'low',
  warning: 'high',
  critical: 'critical',
};

export default function ShiftIntelligenceLog({ isOpen, onClose, onSuccess }) {
  const [issueType, setIssueType] = useState('station');
  const [severity, setSeverity] = useState('warning');
  const [note, setNote] = useState('');
  const [station, setStation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    
    setSubmitting(true);
    haptics.medium?.();
    
    try {
      const issueLabel = ISSUE_TYPES.find(issue => issue.value === issueType)?.label || 'Shift Issue';
      await base44.entities.UnifiedLog.create({
        type: 'incident',
        title: station ? `${issueLabel} - ${station}` : issueLabel,
        description: note,
        location: station,
        status: 'open',
        priority: severityToPriority[severity] || 'medium',
        requires_review: true,
        created_by: 'Kitchen Lead',
        custom_metadata: {
          issue_type: issueType,
          severity,
          shift_date: new Date().toISOString().split('T')[0],
          is_critical: severity === 'critical',
        },
      });

      setNote('');
      setStation('');
      setIssueType('station');
      setSeverity('warning');
      onSuccess?.();
      onClose?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-2xl border-t border-border p-5 space-y-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between sticky top-0 bg-card pb-3 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">Shift Intelligence Log</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Issue Type */}
          <div>
            <label className="text-xs font-bold text-secondary-text uppercase block mb-2">Issue Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ISSUE_TYPES.map(({ label, value, color }) => (
                <button
                  key={value}
                  onClick={() => setIssueType(value)}
                  className={`p-2.5 rounded-lg border-2 transition-all text-sm font-semibold ${
                    issueType === value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted'
                  }`}
                >
                  <span className={issueType === value ? color : 'text-foreground'}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs font-bold text-secondary-text uppercase block mb-2">Severity</label>
            <div className="flex gap-2">
              {SEVERITY.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setSeverity(value)}
                  className={`flex-1 py-2.5 rounded-lg border-2 transition-all text-sm font-semibold ${
                    severity === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Station */}
          <div>
            <label className="text-xs font-bold text-secondary-text uppercase block mb-2">Station (Optional)</label>
            <input
              type="text"
              placeholder="Grill Station, Cold Prep, etc."
              value={station}
              onChange={e => setStation(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground text-sm"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-secondary-text uppercase block mb-2">Details</label>
            <textarea
              placeholder="Describe the issue, what happened, and any context..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={5}
              className="w-full p-3 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground text-sm resize-none"
            />
          </div>

          {severity === 'critical' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">Critical logs will immediately notify all managers.</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!note.trim() || submitting}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Logging...' : 'Log Issue'}
        </button>
      </div>
    </div>
  );
}