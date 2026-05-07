import { createContext, useContext, useState, useCallback } from 'react';

const RoleSimulationContext = createContext();

export const useRoleSimulation = () => {
  const context = useContext(RoleSimulationContext);
  if (!context) {
    throw new Error('useRoleSimulation must be used within RoleSimulationProvider');
  }
  return context;
};

export function RoleSimulationProvider({ children }) {
  const [simulatedRole, setSimulatedRole] = useState(null);
  const [simulatedData, setSimulatedData] = useState({});
  const [previewRole, setPreviewRole] = useState(null);

  const enterSimulation = useCallback((role, dummyData = {}) => {
    setSimulatedRole(role);
    setSimulatedData(dummyData);
  }, []);

  const exitSimulation = useCallback(() => {
    setSimulatedRole(null);
    setSimulatedData({});
  }, []);

  const setPreview = useCallback((role) => {
    setPreviewRole(role);
  }, []);

  const exitPreview = useCallback(() => {
    setPreviewRole(null);
  }, []);

  const isSimulating = simulatedRole !== null;
  const isPreviewing = previewRole !== null;

  return (
    <RoleSimulationContext.Provider
      value={{
        simulatedRole,
        simulatedData,
        isSimulating,
        enterSimulation,
        exitSimulation,
        previewRole,
        setPreview,
        exitPreview,
        isPreviewing,
      }}
    >
      {children}
    </RoleSimulationContext.Provider>
  );
}