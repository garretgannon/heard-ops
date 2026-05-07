import { createContext, useContext, useState } from 'react';

const SimulatorContext = createContext();

export function SimulatorProvider({ children }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMode, setSimulationMode] = useState(null);
  const [simulatedRole, setSimulatedRole] = useState(null);
  const [simulatedRestaurantType, setSimulatedRestaurantType] = useState(null);
  const [frictionNotes, setFrictionNotes] = useState([]);
  const [checklistItems, setChecklistItems] = useState([
    { id: 'onboard-time', text: 'Can a new user finish onboarding in under 2 minutes?', checked: false, notes: '' },
    { id: 'first-screen', text: 'Is the first screen clear?', checked: false, notes: '' },
    { id: 'blank-pages', text: 'Are there any blank pages?', checked: false, notes: '' },
    { id: 'demo-data', text: 'Does demo data appear correctly?', checked: false, notes: '' },
    { id: 'role-visibility', text: 'Can each role see the right information?', checked: false, notes: '' },
    { id: 'manager-only', text: 'Are manager-only items hidden from staff?', checked: false, notes: '' },
    { id: 'button-links', text: 'Do all buttons link correctly?', checked: false, notes: '' },
    { id: 'task-complete', text: 'Can fake tasks be completed?', checked: false, notes: '' },
    { id: 'log-submit', text: 'Can fake logs be submitted?', checked: false, notes: '' },
    { id: 'handoff-review', text: 'Can fake handoffs be reviewed?', checked: false, notes: '' },
    { id: 'today-view', text: 'Does Today View feel useful immediately?', checked: false, notes: '' },
  ]);

  const addFrictionNote = (note) => {
    setFrictionNotes([...frictionNotes, { id: Date.now(), ...note, createdAt: new Date() }]);
  };

  const removeFrictionNote = (id) => {
    setFrictionNotes(frictionNotes.filter(n => n.id !== id));
  };

  const updateChecklistItem = (id, updates) => {
    setChecklistItems(checklistItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationMode(null);
    setSimulatedRole(null);
    setSimulatedRestaurantType(null);
    setFrictionNotes([]);
    setChecklistItems(checklistItems.map(item => ({ ...item, checked: false, notes: '' })));
  };

  return (
    <SimulatorContext.Provider
      value={{
        isSimulating,
        setIsSimulating,
        simulationMode,
        setSimulationMode,
        simulatedRole,
        setSimulatedRole,
        simulatedRestaurantType,
        setSimulatedRestaurantType,
        frictionNotes,
        addFrictionNote,
        removeFrictionNote,
        checklistItems,
        updateChecklistItem,
        resetSimulation,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator() {
  return useContext(SimulatorContext);
}