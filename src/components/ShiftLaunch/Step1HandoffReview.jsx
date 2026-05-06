import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

export default function Step1HandoffReview({ onComplete }) {
  const [handoff, setHandoff] = useState(null);
  const [issues, setIssues] = useState([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const handoffs = await base44.entities.ShiftHandoff.list('-created_date', 1).catch(() => []);
        const allIssues = await base44.entities.Issue.filter({ status: 'open' }).catch(() => []);
        setHandoff(handoffs?.[0] || null);
        setIssues(allIssues.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAcknowledge = () => {
    haptics.medium?.();
    setAcknowledged(true);
    setTimeout(() => {
      onComplete(1, { handoffId: handoff?.id, acknowledgedAt: new Date().toISOString() });
    }, 200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Previous Shift Handoff</h2>

        {handoff ? (
          <div className="bg-card border-l-4 border-l-blue-500 border border-border rounded-lg p-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground italic">"{handoff.key_notes}"</p>
                <p className="text-[10px] text-secondary-text mt-2">— {handoff.from_manager_name}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 border border-border rounded-lg p-3 text-center py-4">
            <p className="text-xs text-muted-foreground">No previous handoff on file</p>
          </div>
        )}
      </div>

      {issues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-text">Open Issues</h3>
          <div className="space-y-2">
            {issues.map(issue => (
              <div key={issue.id} className="bg-card border-l-4 border-l-red-500 border border-border rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{issue.title}</p>
                    <p className="text-[9px] text-secondary-text mt-0.5 line-clamp-2">{issue.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-3 mt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => {
              haptics.light?.();
              setAcknowledged(e.target.checked);
            }}
            className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-xs text-foreground font-semibold">
            I acknowledge all shift handoff items and understand any unresolved issues.
          </span>
        </label>

        <button
          onClick={handleAcknowledge}
          disabled={!acknowledged}
          className={cn(
            'w-full h-9 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all',
            acknowledged
              ? 'bg-primary text-primary-foreground active:scale-95'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Acknowledge and Continue
        </button>
      </div>
    </div>
  );
}