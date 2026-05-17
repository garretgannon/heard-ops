import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useShiftMode } from '@/lib/ShiftModeContext';
import { toast } from 'sonner';
import { haptics } from '@/utils/haptics';
import ShiftModeHeader from '@/components/shift/ShiftModeHeader';
import ShiftProgressCard from '@/components/shift/ShiftProgressCard';
import CurrentTaskCard from '@/components/shift/CurrentTaskCard';
import UpNextList from '@/components/shift/UpNextList';
import AdminShiftDashboard from '@/components/shift/AdminShiftDashboard';

export default function Shift() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { currentShift } = useShiftMode();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [stats, setStats] = useState({ completedCount: 0, totalCount: 0, completionPct: 0 });
  const [activeModal, setActiveModal] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  const isMounted = useRef(true);

  // Load shift tasks
  useEffect(() => {
    isMounted.current = true;
    const loadTasks = async () => {
      try {
        const allTasks = await base44.entities.Task.list('-updated_date', 100).catch(() => []);

        if (isMounted.current) {
          // Sort by due time/status to find current task
          const sorted = allTasks.sort((a, b) => {
            const statusOrder = { overdue: 0, in_progress: 1, not_started: 2, complete: 3, approved: 4, needs_review: 5 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
              return statusOrder[a.status] - statusOrder[b.status];
            }
            return new Date(a.due_date || 0) - new Date(b.due_date || 0);
          });

          const current = sorted.find((t) => !['complete', 'approved'].includes(t.status)) || null;
          const nextTasks = sorted.filter((t) => !['complete', 'approved'].includes(t.status)).slice(1, 6);

          const completedCount = allTasks.filter((t) => ['complete', 'approved'].includes(t.status)).length;
          const totalCount = allTasks.length;
          const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          setTasks(sorted);
          setCurrentTask(current);
          setStats({ completedCount, totalCount, completionPct });
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load shift tasks:', err);
        if (isMounted.current) setLoading(false);
      }
    };

    loadTasks();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Track mobile/desktop on resize
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleStartTask = async (taskId) => {
    haptics.light?.();
    try {
      await base44.entities.Task.update(taskId, { status: 'in_progress' });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' } : t))
      );
      const updated = tasks.find((t) => t.id === taskId);
      setCurrentTask({ ...updated, status: 'in_progress' });
      toast.success('Task started');
    } catch (err) {
      toast.error('Failed to start task');
      console.error(err);
    }
  };

  const handleCompleteTask = async (taskId) => {
    haptics.medium?.();
    try {
      await base44.entities.Task.update(taskId, { status: 'complete', completed_by_user: user?.email });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'complete' } : t))
      );

      // Find next task
      const remaining = tasks.filter((t) => !['complete', 'approved'].includes(t.status));
      const nextIdx = remaining.findIndex((t) => t.id === taskId) + 1;
      const nextTask = remaining[nextIdx] || null;
      setCurrentTask(nextTask);

      const newStats = {
        completedCount: stats.completedCount + 1,
        totalCount: stats.totalCount,
      };
      setStats(newStats);

      toast.success('Task completed!');
    } catch (err) {
      toast.error('Failed to complete task');
      console.error(err);
    }
  };

  const handleMarkReview = async (taskId) => {
    haptics.medium?.();
    try {
      await base44.entities.Task.update(taskId, { status: 'needs_review', completed_by_user: user?.email });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'needs_review' } : t))
      );

      const remaining = tasks.filter((t) => !['complete', 'approved'].includes(t.status));
      const nextIdx = remaining.findIndex((t) => t.id === taskId) + 1;
      const nextTask = remaining[nextIdx] || null;
      setCurrentTask(nextTask);

      toast.success('Task submitted for review');
    } catch (err) {
      toast.error('Failed to mark for review');
      console.error(err);
    }
  };

  const handleUnableToComplete = async (taskId, reason) => {
    haptics.medium?.();
    try {
      await base44.entities.Task.update(taskId, {
        status: 'unable_to_complete',
        custom_metadata: { unable_reason: reason },
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'unable_to_complete' } : t))
      );

      const remaining = tasks.filter((t) => !['complete', 'approved'].includes(t.status));
      const nextIdx = remaining.findIndex((t) => t.id === taskId) + 1;
      const nextTask = remaining[nextIdx] || null;
      setCurrentTask(nextTask);

      toast.info('Manager has been notified');
    } catch (err) {
      toast.error('Failed to report issue');
      console.error(err);
    }
  };

  const handleSkipTask = async (taskId) => {
    haptics.light?.();
    // Just move to next task without updating status
    const remaining = tasks.filter((t) => !['complete', 'approved'].includes(t.status));
    const nextIdx = remaining.findIndex((t) => t.id === taskId) + 1;
    const nextTask = remaining[nextIdx] || null;
    setCurrentTask(nextTask);
  };

  const handleModalSuccess = () => {
    setActiveModal(null);
    // Reload task data instead of full page reload
    loadTasks();
  };

  const loadTasks = async () => {
    try {
      const allTasks = await base44.entities.Task.list('-updated_date', 100).catch(() => []);
      const sorted = allTasks.sort((a, b) => {
        const statusOrder = { overdue: 0, in_progress: 1, not_started: 2, complete: 3, approved: 4, needs_review: 5 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(a.due_date || 0) - new Date(b.due_date || 0);
      });

      const completedCount = allTasks.filter((t) => ['complete', 'approved'].includes(t.status)).length;
      const totalCount = allTasks.length;
      const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      if (isMounted.current) {
        setTasks(sorted);
        setStats({ completedCount, totalCount, completionPct });
      }
    } catch (err) {
      console.error('Failed to reload tasks:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nextDueTime = currentTask?.due_time || null;
  const nextTasks = tasks.filter((t) => !['complete', 'approved'].includes(t.status)).slice(1, 6);

  return (
    <div className="pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      {/* Header */}
      <ShiftModeHeader />

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 w-full">
        {isMobile ? (
          /* Mobile Staff View */
          <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* Shift Progress */}
            <ShiftProgressCard
              completedCount={stats.completedCount}
              totalCount={stats.totalCount}
              status={currentTask?.status || 'complete'}
              nextDueTime={nextDueTime}
            />

            {/* Current Task */}
            <CurrentTaskCard
              task={currentTask}
              onStart={handleStartTask}
              onComplete={handleCompleteTask}
              onReview={handleMarkReview}
              onUnableToComplete={handleUnableToComplete}
              onSkip={handleSkipTask}
            />

            {/* Up Next */}
            {nextTasks.length > 0 && <UpNextList tasks={nextTasks} />}
          </div>
        ) : (
          /* Desktop Admin/Manager View */
          <div className="w-full">
            <AdminShiftDashboard
              tasks={tasks}
              stats={stats}
              user={user}
              onTaskUpdate={handleModalSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;