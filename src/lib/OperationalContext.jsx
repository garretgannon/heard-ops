import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const OperationalContext = createContext();

export function OperationalProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceTaskTimerRef = useRef(null);
  const debounceLogTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadOperationalData = async () => {
      try {
        // Reduced limits to prevent rate limiting
        const [tasksList, logsList] = await Promise.all([
          base44.entities.Task.list('-updated_date', 50).catch(() => []),
          base44.entities.UnifiedLog.list('-created_date', 50).catch(() => []),
        ]);
        if (isMounted) {
          setTasks(tasksList);
          setLogs(logsList);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load operational data:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadOperationalData();

    // Debounced subscription handlers to reduce update frequency
    const debouncedTaskUpdate = (event) => {
      clearTimeout(debounceTaskTimerRef.current);
      debounceTaskTimerRef.current = setTimeout(() => {
        setTasks((prev) => {
          if (event.type === 'create') return [event.data, ...prev.slice(0, 49)];
          if (event.type === 'update') return prev.map((t) => (t.id === event.id ? event.data : t));
          if (event.type === 'delete') return prev.filter((t) => t.id !== event.id);
          return prev;
        });
      }, 500);
    };

    const debouncedLogUpdate = (event) => {
      clearTimeout(debounceLogTimerRef.current);
      debounceLogTimerRef.current = setTimeout(() => {
        setLogs((prev) => {
          if (event.type === 'create') return [event.data, ...prev.slice(0, 49)];
          if (event.type === 'update') return prev.map((l) => (l.id === event.id ? event.data : l));
          if (event.type === 'delete') return prev.filter((l) => l.id !== event.id);
          return prev;
        });
      }, 500);
    };

    const unsubTasks = base44.entities.Task.subscribe(debouncedTaskUpdate);
    const unsubLogs = base44.entities.UnifiedLog.subscribe(debouncedLogUpdate);

    return () => {
      isMounted = false;
      clearTimeout(debounceTaskTimerRef.current);
      clearTimeout(debounceLogTimerRef.current);
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