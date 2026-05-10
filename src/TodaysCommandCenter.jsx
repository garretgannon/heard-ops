import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useShiftMode } from '@/lib/ShiftModeContext';
import TodayHeader from '@/components/today/TodayHeader';
import ShiftOverviewCard from '@/components/today/ShiftOverviewCard';
import AlertsSection from '@/components/today/AlertsSection';
import QuickActionModal from '@/components/quickactions/QuickActionModal';
import DesktopOverviewDashboard from '@/components/today/DesktopOverviewDashboard';
import PrepPlanningCards from '@/components/today/PrepPlanningCards';

export default function TodaysCommandCenter() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { currentShift } = useShiftMode();
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    completionPct: 0,
    completedCount: 0,
    totalCount: 0,
    overdueCount: 0,
    logsNeedingReview: 0,
    openIncidents: 0,
  });
  const [nextDueItem, setNextDueItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
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
          setTasks(tasks);
          setLogs(logs);
          setPriorities(Object.values(priorityCounts).filter((p) => p.count > 0));
          setAlerts(alertList);
          const logsReview = logs.filter((l) => l.requires_review || l.review_status === 'pending').length;
          const incidents = logs.filter((l) => l.type === 'incident' && l.status === 'open').length;
          setStats({
            completionPct,
            completedCount: completedTasks,
            totalCount: allTasks,
            overdueCount: tasks.filter((t) => t.status === 'overdue').length,
            logsNeedingReview: logsReview,
            openIncidents: incidents,
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

  // Track mobile/desktop on resize
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
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
    <div className="pb-40 lg:pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      {/* Header */}
      <TodayHeader />

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 lg:px-8 w-full">
        {isMobile ? (
          /* Mobile Layout */
          <div className="max-w-6xl mx-auto w-full space-y-8">
            {/* Quick Overview */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Today's Status</p>
              <ShiftOverviewCard
                completionPct={stats.completionPct}
                completedCount={stats.completedCount}
                totalCount={stats.totalCount}
                overdueCount={stats.overdueCount}
                nextDueItem={nextDueItem}
              />
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">Attention</p>
                <AlertsSection alerts={alerts} />
              </div>
            )}

            {/* Prep Planning Cards Grid */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Food Prep</p>
              <div className="grid grid-cols-2 gap-3">
                <PrepPlanningCards />
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Quick Actions</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleQuickAction('add_log')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">📝</div>
                  <p className="text-xs font-bold text-foreground">New Log</p>
                  <p className="text-[10px] text-muted-foreground">Add entry</p>
                </button>
                <button onClick={() => handleQuickAction('create_task')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">✓</div>
                  <p className="text-xs font-bold text-foreground">New Task</p>
                  <p className="text-[10px] text-muted-foreground">Create item</p>
                </button>
                <button onClick={() => handleQuickAction('report_issue')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">⚠️</div>
                  <p className="text-xs font-bold text-foreground">Issue</p>
                  <p className="text-[10px] text-muted-foreground">Report problem</p>
                </button>
                <button onClick={() => navigate('/shift-handoff')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">📋</div>
                  <p className="text-xs font-bold text-foreground">Handoff</p>
                  <p className="text-[10px] text-muted-foreground">Shift plan</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Layout */
          <div className="max-w-7xl mx-auto w-full">
            <DesktopOverviewDashboard
              stats={stats}
              priorities={priorities}
              alerts={alerts}
              tasks={tasks}
              logs={logs}
              onQuickAction={handleQuickAction}
              nextDueItem={nextDueItem}
            />
          </div>
        )}
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