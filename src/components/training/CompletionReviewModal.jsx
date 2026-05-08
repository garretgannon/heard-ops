import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function CompletionReviewModal({ completion, onClose, onSuccess }) {
  const [notes, setNotes] = useState(completion.managerNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.TrainingCompletion.update(completion.id, {
        managerNotes: notes,
        managerReviewed: true,
      });
      toast.success('Review saved');
      onSuccess();
    } catch (err) {
      toast.error('Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card w-full max-w-xl rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Review Completion</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
          <p><span className="font-semibold">Employee:</span> {completion.employeeName}</p>
          <p><span className="font-semibold">Module:</span> {completion.moduleName}</p>
          <p><span className="font-semibold">Status:</span> {completion.status}</p>
          {completion.score !== undefined && (
            <p><span className="font-semibold">Score:</span> {completion.score}%</p>
          )}
          {completion.timeSpent && (
            <p><span className="font-semibold">Time Spent:</span> {completion.timeSpent} min</p>
          )}
          {completion.completedAt && (
            <p><span className="font-semibold">Completed:</span> {new Date(completion.completedAt).toLocaleDateString()}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Review Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm min-h-24"
              placeholder="Add any feedback or notes..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}