import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useShiftMode } from '@/lib/ShiftModeContext';
import TodayHeader from '@/components/today/TodayHeader';
import ShiftOverviewCard from '@/components/today/ShiftOverviewCard';
import PrioritiesSection from '@/components/today/PrioritiesSection';
import AlertsSection from '@/components/today/AlertsSection';
import QuickActionsBar from '@/components/today/QuickActionsBar';
import QuickActionModal from '@/components/quickactions/QuickActionModal';

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { currentShift } = useShiftMode();
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    completionPct: 0,
    completedCount: 0,
    totalCount: 0,
    overdueCount: 0,
  });
  const [nextDueItem, setNextDueItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMounted = useRef(true);

  // Load task and priority data
  useEffect(() => {
    isMounted.current = true;
    const loadData = async () => {
      try {
        const tasks = await base44.entities.Task.list('-updated_date', 100).catch(() => []);
        const logs = await base44.entities.UnifiedLog.list('-created_date', 50).catch(() => []);

        // Build priorities by type
        const priorityCounts = {};
        const priorityTypes = ['prep', 'sidework', 'temperature', 'cleaning', 'manager_note', 'shift_handoff', 'beo', 'incident'];
        priorityTypes.forEach((type) => {
          const typeItems = tasks.filter((t) => t.type === type);
          priorityCounts[type] = {
            type,
            count: typeItems.length,
            dueCount: typeItems.filter((t) => t.status === 'in_progress' || t.status === 'not_started').length,
            overdueCount: typeItems.filter((t) => t.status === 'overdue').length,
          };
        });

        // Build alerts
        const alertList = [];
        if (priorityCounts.prep.overdueCount > 0) {
          alertList.push({ type: 'overdue_prep', count: priorityCounts.prep.overdueCount });
        }
        if (priorityCounts.temperature.dueCount > 0) {
          alertList.push({ type: 'missed_temps', count: priorityCounts.temperature.dueCount });
        }
        const reviewItems = tasks.filter((t) => t.status === 'needs_review').length;
        if (reviewItems > 0) {
          alertList.push({ type: 'pending_review', count: reviewItems });
        }
        const incidents = logs.filter((l) => l.type === 'incident' && l.status === 'open').length;
        if (incidents > 0) {
          alertList.push({ type: 'incidents', count: incidents });
        }
        const maintenance = logs.filter((l) => l.type === 'maintenance' && l.follow_up_required).length;
        if (maintenance > 0) {
          alertList.push({ type: 'maintenance', count: maintenance });
        }

        // Shift stats
        const allTasks = tasks.length;
        const completedTasks = tasks.filter((t) => ['complete', 'approved'].includes(t.status)).length;
        const completionPct = allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0;
        const nextTask = tasks
          .filter((t) => !['complete', 'approved'].includes(t.status))
          .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))[0];

        if (isMounted.current) {
          setPriorities(Object.values(priorityCounts).filter((p) => p.count > 0));
          setAlerts(alertList);
          setStats({
            completionPct,
            completedCount: completedTasks,
            totalCount: allTasks,
            overdueCount: tasks.filter((t) => t.status === 'overdue').length,
          });
          if (nextTask) {
            setNextDueItem({
              title: nextTask.title,
              dueIn: nextTask.due_time ? `Due at ${nextTask.due_time}` : 'Due today',
            });
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load task data:', err);
        if (isMounted.current) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleQuickAction = (actionId) => {
    // Map old action IDs to new action types
    const actionMap = {
      'add_log': 'add_log',
      'temp_log': 'log_temperature',
      'create_task': 'add_task',
      'report_issue': 'report_incident',
      'handoff': null, // Handled separately
    };
    const actionType = actionMap[actionId];
    if (actionType) setActiveModal(actionType);
    else if (actionId === 'handoff') navigate('/shift-handoff');
  };

  const handleModalSuccess = () => {
    setActiveModal(null);
    setRefreshKey(k => k + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      {/* Header */}
      <TodayHeader />

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Shift Overview */}
        <ShiftOverviewCard
          completionPct={stats.completionPct}
          completedCount={stats.completedCount}
          totalCount={stats.totalCount}
          overdueCount={stats.overdueCount}
          nextDueItem={nextDueItem}
        />

        {/* Alerts */}
        <AlertsSection alerts={alerts} />

        {/* Priorities */}
        <PrioritiesSection priorities={priorities} />

        {/* Quick Actions */}
        <div className="pt-4">
          <QuickActionsBar role={user?.role} onAction={handleQuickAction} />
        </div>
      </div>

      {/* Quick Action Modal */}
      {activeModal && (
        <QuickActionModal
          actionType={activeModal}
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
          key={refreshKey}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;