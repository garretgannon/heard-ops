import { createContext, useContext, useState } from 'react';

const ShiftModeContext = createContext(null);

export function ShiftModeProvider({ children }) {
  const [currentShift, setCurrentShift] = useState(null);

  const startShift = async (email, fullName, locationId, locationName, shiftType) => {
    const shift = {
      id: `shift-${Date.now()}`,
      email,
      full_name: fullName,
      location_id: locationId,
      location_name: locationName,
      shift_type: shiftType,
      status: 'setup',
      created_date: new Date().toISOString(),
    };
    setCurrentShift(shift);
    return shift;
  };

  const markSetupComplete = (shiftId) => {
    setCurrentShift(prev => prev ? { ...prev, status: 'running' } : null);
  };

  const closeShift = (shiftId) => {
    setCurrentShift(prev => prev ? { ...prev, status: 'closed' } : null);
  };

  const reopenShift = (shiftId) => {
    setCurrentShift(prev => prev ? { ...prev, status: 'running' } : null);
  };

  return (
    <ShiftModeContext.Provider value={{ currentShift, setCurrentShift, startShift, markSetupComplete, closeShift, reopenShift }}>
      {children}
    </ShiftModeContext.Provider>
  );
}

export function useShiftMode() {
  const context = useContext(ShiftModeContext);
  if (!context) {
    throw new Error('useShiftMode must be used within ShiftModeProvider');
  }
  return context;
}