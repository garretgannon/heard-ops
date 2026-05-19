import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import CompletionReviewModal from './CompletionReviewModal';

export default function CompletionsTab({ completions, onRefresh }) {
  const [selectedCompletion, setSelectedCompletion] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-green-500/10 text-green-600';
      case 'failed': return 'bg-red-500/10 text-red-600';
      default: return 'bg-blue-500/10 text-blue-600';
    }
  };

  const markAsReviewed = async (id) => {
    try {
      await base44.entities.TrainingCompletion.update(id, { managerReviewed: true });
      toast.success('Marked as reviewed');
      onRefresh();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold">Completion Records</h2>
        <p className="text-xs text-muted-foreground mt-1">Track who completed or attempted training</p>
      </div>

      {completions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No completion records yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {completions.map(comp => (
            <div key={comp.id} className="p-4 rounded-xl border border-border/30 space-y-3" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{comp.employeeName}</h3>
                    {comp.managerReviewed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{comp.moduleName}</p>
                  {comp.completedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed: {new Date(comp.completedAt).toLocaleDateString()}
                    </p>
                  )}
                  {comp.timeSpent && (
                    <p className="text-xs text-muted-foreground">
                      Time: {comp.timeSpent} min
                    </p>
                  )}
                  {comp.score !== undefined && (
                    <p className="text-xs font-semibold text-foreground mt-1">
                      Score: {comp.score}%
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-semibold ${getStatusColor(comp.status)}`}>
                  {comp.status}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCompletion(comp)}
                  className="flex-1 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-semibold transition-all"
                >
                  Review
                </button>
                {!comp.managerReviewed && (
                  <button
                    onClick={() => markAsReviewed(comp.id)}
                    className="flex-1 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 text-sm font-semibold transition-all"
                  >
                    Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCompletion && (
        <CompletionReviewModal
          completion={selectedCompletion}
          onClose={() => setSelectedCompletion(null)}
          onSuccess={() => { setSelectedCompletion(null); onRefresh(); }}
        />
      )}
    </div>
  );
}