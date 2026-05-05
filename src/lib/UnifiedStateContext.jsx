import { createContext, useContext, useState, useCallback } from 'react';

const UnifiedStateContext = createContext();

export function UnifiedStateProvider({ children }) {
  const [activeTab, setActiveTab] = useState('/');
  const [lastCompletedAction, setLastCompletedAction] = useState(null);
  const [taskLinks, setTaskLinks] = useState({});
  const [logLinks, setLogLinks] = useState({});
  const [navigationContext, setNavigationContext] = useState(null);

  const recordAction = useCallback((actionType, data) => {
    setLastCompletedAction({ type: actionType, data, timestamp: Date.now() });
  }, []);

  const linkTaskToRecipe = useCallback((taskId, recipeId) => {
    setTaskLinks(prev => ({ ...prev, [taskId]: recipeId }));
  }, []);

  const linkLogToTask = useCallback((logId, taskId) => {
    setLogLinks(prev => ({ ...prev, [logId]: taskId }));
  }, []);

  const setNavContext = useCallback((context) => {
    setNavigationContext(context);
  }, []);

  const value = {
    activeTab,
    setActiveTab,
    lastCompletedAction,
    recordAction,
    taskLinks,
    linkTaskToRecipe,
    logLinks,
    linkLogToTask,
    navigationContext,
    setNavContext,
  };

  return (
    <UnifiedStateContext.Provider value={value}>
      {children}
    </UnifiedStateContext.Provider>
  );
}

export function useUnifiedState() {
  const context = useContext(UnifiedStateContext);
  if (!context) {
    throw new Error('useUnifiedState must be used within UnifiedStateProvider');
  }
  return context;
}