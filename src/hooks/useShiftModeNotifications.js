import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Hook to detect shift-related state changes and trigger contextual feedback
 * Triggers toasts when key milestones are achieved
 */
export function useShiftModeNotifications({
  tasksCompleted,
  tasksTotal,
  overdue,
  tempLogs,
  tempLogsNeeded,
  issues,
  isShiftActive,
}) {
  const prevStateRef = useRef({
    tasksCompleted: 0,
    overdue: 0,
    tempLogs: 0,
    issues: [],
  });

  useEffect(() => {
    if (!isShiftActive) return;

    const prev = prevStateRef.current;

    // All prep tasks completed
    if (tasksCompleted > prev.tasksCompleted && tasksCompleted === tasksTotal && tasksTotal > 0) {
      toast.success('All prep on track 🔥', { duration: 3000 });
    }

    // Overdue items resolved
    if (overdue < prev.overdue && overdue === 0) {
      toast.success('Back on pace 💪', { duration: 3000 });
    }

    // Temperature logs fully completed
    if (tempLogs > prev.tempLogs && tempLogs >= tempLogsNeeded && tempLogsNeeded > 0) {
      toast.success('Logs up to date ✅', { duration: 3000 });
    }

    // Issues resolved
    const prevIssueCount = prev.issues.length;
    const currIssueCount = issues.length;
    if (currIssueCount < prevIssueCount && currIssueCount === 0) {
      toast.success('All issues resolved 👍', { duration: 3000 });
    }

    // Update ref with current state
    prevStateRef.current = {
      tasksCompleted,
      overdue,
      tempLogs,
      issues,
    };
  }, [tasksCompleted, tasksTotal, overdue, tempLogs, tempLogsNeeded, issues, isShiftActive]);
}