import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const OperationalContext = createContext();

export function OperationalProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOperationalData = async () => {
      try {
        const [tasksList, logsList] = await Promise.all([
          base44.entities.Task.list('-updated_date', 200).catch(() => []),
          base44.entities.UnifiedLog.list('-created_date', 100).catch(() => []),
        ]);
        setTasks(tasksList);
        setLogs(logsList);
      } catch (err) {
        console.error('Failed to load operational data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOperationalData();

    // Subscribe to changes
    const unsubTasks = base44.entities.Task.subscribe((event) => {
      setTasks((prev) => {
        if (event.type === 'create') return [event.data, ...prev];
        if (event.type === 'update') return prev.map((t) => (t.id === event.id ? event.data : t));
        if (event.type === 'delete') return prev.filter((t) => t.id !== event.id);
        return prev;
      });
    });

    const unsubLogs = base44.entities.UnifiedLog.subscribe((event) => {
      setLogs((prev) => {
        if (event.type === 'create') return [event.data, ...prev];
        if (event.type === 'update') return prev.map((l) => (l.id === event.id ? event.data : l));
        if (event.type === 'delete') return prev.filter((l) => l.id !== event.id);
        return prev;
      });
    });

    return () => {
      unsubTasks?.();
      unsubLogs?.();
    };
  }, []);

  // Derived metrics
  const overdueTasks = tasks.filter((t) => t.status === 'overdue');
  const dueTodayTasks = tasks.filter(
    (t) =>
      !['complete', 'approved'].includes(t.status) &&
      t.due_date === new Date().toISOString().split('T')[0]
  );
  const tasksNeedingReview = tasks.filter((t) => t.status === 'needs_review' || t.review_status === 'pending');
  const openIncidents = logs.filter((l) => l.type === 'incident' && l.status === 'open');
  const failedTemps = logs.filter((l) => l.type === 'temperature' && (l.status === 'flagged' || l.custom_metadata?.passFail === 'fail'));
  const logsNeedingReview = logs.filter((l) => l.requires_review || l.review_status === 'pending');

  return (
    <OperationalContext.Provider
      value={{
        tasks,
        logs,
        loading,
        overdueTasks,
        dueTodayTasks,
        tasksNeedingReview,
        openIncidents,
        failedTemps,
        logsNeedingReview,
      }}
    >
      {children}
    </OperationalContext.Provider>
  );
}

export function useOperational() {
  const ctx = useContext(OperationalContext);
  if (!ctx) throw new Error('useOperational must be within OperationalProvider');
  return ctx;
}