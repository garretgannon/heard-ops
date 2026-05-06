import { createContext, useContext, useState, useCallback } from 'react';

const TabHistoryContext = createContext(null);

export function TabHistoryProvider({ children }) {
  const [tabHistory, setTabHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tabHistory') || '{}');
    } catch {
      return {};
    }
  });

  const savePath = useCallback((tabPath, path) => {
    setTabHistory(prev => {
      const next = { ...prev, [tabPath]: path };
      localStorage.setItem('tabHistory', JSON.stringify(next));
      return next;
    });
  }, []);

  const getPath = useCallback((tabPath, defaultPath) => {
    return tabHistory[tabPath] || defaultPath;
  }, [tabHistory]);

  return (
    <TabHistoryContext.Provider value={{ savePath, getPath }}>
      {children}
    </TabHistoryContext.Provider>
  );
}

export function useTabHistory() {
  const context = useContext(TabHistoryContext);
  if (!context) {
    throw new Error('useTabHistory must be used within TabHistoryProvider');
  }
  return context;
}