import { createContext, useContext, useState } from 'react';

const ShiftModeContext = createContext(null);

export function ShiftModeProvider({ children }) {
  const [shiftMode, setShiftMode] = useState(null);
  const [activeShift, setActiveShift] = useState(null);

  return (
    <ShiftModeContext.Provider value={{ shiftMode, setShiftMode, activeShift, setActiveShift }}>
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