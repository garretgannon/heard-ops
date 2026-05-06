import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const ShiftModeContext = createContext();

export function ShiftModeProvider({ children }) {
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentShift();
    const unsub = base44.entities.Shift.subscribe(() => loadCurrentShift());
    return () => unsub?.();
  }, []);

  const loadCurrentShift = async () => {
    try {
      const shifts = await base44.entities.Shift.filter({ status: { $in: ['setup', 'running', 'closing'] } });
      setCurrentShift(shifts[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startShift = async (managerId, managerName, locationId, locationName, shiftType) => {
    const shift = await base44.entities.Shift.create({
      manager_id: managerId,
      manager_name: managerName,
      location_id: locationId,
      location_name: locationName,
      shift_type: shiftType,
      status: 'setup',
      started_at: new Date().toISOString(),
      setup_checklist: [
        { id: '1', title: 'Review handoff notes', completed: false },
        { id: '2', title: 'Check critical tasks', completed: false },
        { id: '3', title: 'Confirm staff coverage', completed: false },
        { id: '4', title: 'Check temps logged', completed: false },
      ],
    });
    setCurrentShift(shift);
    return shift;
  };

  const updateSetupChecklist = async (shiftId, checklistId, completed) => {
    const shift = await base44.entities.Shift.get(shiftId);
    const updated = shift.setup_checklist.map(item =>
      item.id === checklistId ? { ...item, completed } : item
    );
    await base44.entities.Shift.update(shiftId, { setup_checklist: updated });
    await loadCurrentShift();
  };

  const markSetupComplete = async (shiftId) => {
    await base44.entities.Shift.update(shiftId, { status: 'running' });
    await loadCurrentShift();
  };

  const reopenShift = async (shiftId) => {
    await base44.entities.Shift.update(shiftId, { status: 'running', ended_at: null });
    await loadCurrentShift();
  };

  const markClosing = async (shiftId) => {
    await base44.entities.Shift.update(shiftId, { status: 'closing' });
    await loadCurrentShift();
  };

  const completeShift = async (shiftId, notes) => {
    const score = Math.round(Math.random() * 100); // Placeholder
    await base44.entities.Shift.update(shiftId, {
      status: 'completed',
      ended_at: new Date().toISOString(),
      manager_notes: notes,
      score,
    });
    await loadCurrentShift();
  };

  return (
    <ShiftModeContext.Provider value={{ currentShift, loading, startShift, updateSetupChecklist, markSetupComplete, markClosing, completeShift, reopenShift, loadCurrentShift }}>
      {children}
    </ShiftModeContext.Provider>
  );
}

export function useShiftMode() {
  return useContext(ShiftModeContext);
}