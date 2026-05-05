import { useState, useEffect } from 'react';
import { useShiftMode } from '@/lib/ShiftModeContext';
import { base44 } from '@/api/base44Client';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export default function CloseShiftModal({ isOpen, onClose, shift }) {
  const { markClosing, completeShift } = useShiftMode();
  const [blockers, setBlockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('blockers'); // blockers, handoff, complete
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && shift) {
      checkBlockers();
    }
  }, [isOpen, shift?.id]);

  const checkBlockers = async () => {
    try {
      const [tasks, logs, issues] = await Promise.all([
        base44.entities.Task.filter({ shift_id: shift.id, is_required_for_close: true }).catch(() => []),
        base44.entities.Log.filter({ shift_id: shift.id, status: 'danger' }).catch(() => []),
        base44.entities.Issue.filter({ shift_id: shift.id, status: 'open', blocks_shift_close: true }).catch(() => []),
      ]);

      const newBlockers = [
        ...tasks.filter(t => t.status !== 'completed' && t.status !== 'approved').map(t => ({
          type: 'task',
          id: t.id,
          title: t.title,
          station: t.station_name,
        })),
        ...logs.map(l => ({
          type: 'log',
          id: l.id,
          title: l.title,
          location: l.location_id,
        })),
        ...issues.map(i => ({
          type: 'issue',
          id: i.id,
          title: i.title,
          priority: i.priority,
        })),
      ];

      setBlockers(newBlockers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockerTap = (blocker) => {
    haptics.medium();
    // Return to parent to show blocker (will be handled by parent component)
    onClose();
  };

  const handleContinueToHandoff = async () => {
    haptics.medium();
    await markClosing(shift.id);
    setScreen('handoff');
  };

  const handleSubmitHandoff = async () => {
    setSubmitting(true);
    haptics.medium();
    await completeShift(shift.id, notes);
    setScreen('complete');
  };

  if (!isOpen) return null;

  // Complete Screen
  if (screen === 'complete') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-foreground font-bold">Shift Complete</p>
          <p className="text-sm text-secondary-text">Score: {shift.score}</p>
          <button
            onClick={onClose}
            className="btn-primary mt-4 text-sm h-10"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Handoff Screen
  if (screen === 'handoff') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Shift Handoff</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Manager Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add shift notes, upcoming tasks, warnings..."
              rows={6}
              className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="bg-card border border-border rounded-lg p-3 space-y-2">
            <h3 className="text-sm font-bold">Shift Summary</h3>
            <div className="text-xs text-secondary-text space-y-1">
              <p>Tasks: {shift.tasks_completed}/{shift.tasks_total} complete</p>
              <p>Logs: {shift.logs_completed}/{shift.logs_total} complete</p>
              <p>Issues: {shift.critical_issues_open} open</p>
            </div>
          </div>
        </div>

        <div className="bg-card border-t border-border p-4">
          <button
            onClick={handleSubmitHandoff}
            disabled={submitting}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit & End Shift'}
          </button>
        </div>
      </div>
    );
  }

  // Blockers Screen
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Close Shift</h2>
        <button onClick={onClose} className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blockers.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">{blockers.length} blocker{blockers.length !== 1 ? 's' : ''} preventing close</span>
            </div>
            {blockers.map(blocker => (
              <button
                key={`${blocker.type}-${blocker.id}`}
                onClick={() => handleBlockerTap(blocker)}
                className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-left hover:bg-red-500/20 transition-all"
              >
                <p className="text-sm font-bold text-red-400">{blocker.title}</p>
                <p className="text-xs text-secondary-text mt-0.5">{blocker.type.toUpperCase()} • Tap to fix</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="font-bold text-foreground">Ready to close</p>
            <p className="text-xs text-secondary-text mt-1">All blockers cleared</p>
          </div>
        )}
      </div>

      <div className="bg-card border-t border-border p-4">
        <button
          onClick={handleContinueToHandoff}
          disabled={blockers.length > 0}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Handoff
        </button>
      </div>
    </div>
  );
}