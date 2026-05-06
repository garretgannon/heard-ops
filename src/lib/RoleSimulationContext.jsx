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

  const enterSimulation = useCallback((role, dummyData = {}) => {
    setSimulatedRole(role);
    setSimulatedData(dummyData);
  }, []);

  const exitSimulation = useCallback(() => {
    setSimulatedRole(null);
    setSimulatedData({});
  }, []);

  const isSimulating = simulatedRole !== null;

  return (
    <RoleSimulationContext.Provider
      value={{
        simulatedRole,
        simulatedData,
        isSimulating,
        enterSimulation,
        exitSimulation,
      }}
    >
      {children}
    </RoleSimulationContext.Provider>
  );
}