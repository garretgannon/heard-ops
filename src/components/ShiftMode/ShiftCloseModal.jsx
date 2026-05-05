import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import CloseShiftChecklist from './CloseShiftChecklist';
import ShiftHandoffReview from './ShiftHandoffReview';
import ShiftCompletionScreen from './ShiftCompletionScreen';
import QuickFixModal from './QuickFixModal';

export default function ShiftCloseModal({ shiftSession, onClose, isLoading }) {
  const [stage, setStage] = useState('checklist'); // 'checklist', 'finish', 'handoff', or 'complete'
  const [score, setScore] = useState(85);
  const [notes, setNotes] = useState('');
  const [incompleteTasks, setIncompleteTasks] = useState(0);
  const [missingLogs, setMissingLogs] = useState(0);
  const [criticalIssues, setCriticalIssues] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [quickFixType, setQuickFixType] = useState(null); // 'tasks', 'logs', 'issues', or null

  const refreshChecks = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const [prepItems, tempLogs, issues] = await Promise.all([
        base44.entities.PrepItem.list('-updated_date', 500).catch(() => []),
        base44.entities.TempLogEntry.filter({ date: todayStr }).catch(() => []),
        base44.entities.Issue.filter({ status: 'critical' }).catch(() => []),
      ]);
      
      const incomplete = prepItems.filter(i => !['completed', 'approved'].includes(i.status)).length;
      const missing = Math.max(0, 4 - tempLogs.length);
      
      setIncompleteTasks(incomplete);
      setMissingLogs(missing);
      setCriticalIssues(issues);
    } catch (e) {
      console.error('Failed to refresh checks:', e);
    }
  };

  useEffect(() => {
    refreshChecks();
    setChecklistLoading(false);
  }, []);

  const handleReadyToClose = () => {
    setStage('finish');
  };

  const handleFinishShift = async (handoffNotes) => {
    setStage('complete');
  };

  const handleCompletionDone = () => {
    if (onClose) {
      onClose(score, notes);
    }
  };

  const handleQuickFix = (type) => {
    setQuickFixType(type);
  };

  const handleQuickFixResolved = async () => {
    await refreshChecks();
    setQuickFixType(null);
  };

  if (checklistLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
        <div className="relative bg-background border-t border-border rounded-t-2xl p-4 flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Quick fix modal overlay
  if (quickFixType) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
        <div className="relative bg-background border-t border-border rounded-t-2xl p-4 max-h-[90vh] overflow-y-auto">
          <div className="w-8 h-0.5 bg-border rounded-full mx-auto mb-4" />
          <QuickFixModal
            type={quickFixType}
            onClose={() => setQuickFixType(null)}
            onResolved={handleQuickFixResolved}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
      <div className="relative bg-background border-t border-border rounded-t-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="w-8 h-0.5 bg-border rounded-full mx-auto" />

        {stage === 'checklist' ? (
          <>
            <CloseShiftChecklist
              incompleteTasks={incompleteTasks}
              missingLogs={missingLogs}
              criticalIssues={criticalIssues}
              onReadyToClose={handleReadyToClose}
              isLoading={isLoading}
              onQuickFix={handleQuickFix}
              quickFixMode={true}
            />
            <button
              onClick={() => onClose()}
              className="w-full h-10 rounded-lg border border-border font-bold text-sm text-muted-foreground hover:bg-card transition-all"
            >
              Cancel
            </button>
          </>
        ) : stage === 'handoff' ? (
          <ShiftHandoffReview
            tasksCompletedPct={shiftSession.prep_completion_pct || 0}
            logsCompletedPct={Math.round((Math.min(missingLogs === 0 ? 4 : Math.max(0, 4 - missingLogs), 4) / 4) * 100)}
            issuesResolved={criticalIssues.length}
            onSubmit={handleFinishShift}
            isLoading={isLoading}
            onBack={() => setStage('finish')}
          />
        ) : stage === 'complete' ? (
          <ShiftCompletionScreen
            tasksCompletedPct={shiftSession.prep_completion_pct || 0}
            logsCompletedPct={Math.round((Math.min(missingLogs === 0 ? 4 : Math.max(0, 4 - missingLogs), 4) / 4) * 100)}
            issuesLeftOpen={criticalIssues.length}
            shiftScore={score}
            onDone={handleCompletionDone}
          />
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Close Shift</p>
                <p className="text-xs text-muted-foreground mt-0.5">Complete today's shift and hand off to next manager</p>
              </div>
            </div>

            {/* Shift Score Slider */}
            <div className="bg-card border border-border rounded-lg p-3 space-y-2">
              <label className="block">
                <span className="text-xs font-semibold text-foreground">Shift Score</span>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={e => setScore(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className={cn(
                    "text-lg font-bold w-12 text-center",
                    score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {score}
                  </span>
                </div>
              </label>
            </div>

            {/* Metrics Summary */}
            <div className="bg-card border border-border rounded-lg p-3 grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">{shiftSession.prep_completion_pct || 0}%</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">Prep Done</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{shiftSession.temp_check_count || 0}</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">Temp Checks</p>
              </div>
              <div className="text-center col-span-2">
                <p className="text-lg font-bold text-amber-400">{shiftSession.incidents_count || 0}</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">Incidents</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Handoff Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Key items for next shift..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-card text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStage('checklist')}
                disabled={isLoading}
                className="flex-1 h-11 rounded-lg border border-border font-bold text-sm text-muted-foreground hover:bg-card transition-all active:scale-95"
              >
                Back
              </button>
              <button
                onClick={() => setStage('handoff')}
                disabled={isLoading}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Continue"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}