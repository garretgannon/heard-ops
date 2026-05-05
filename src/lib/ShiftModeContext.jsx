import { createContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const ShiftModeContext = createContext();

export function ShiftModeProvider({ children }) {
  const [shiftSession, setShiftSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShift = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const sessions = await base44.entities.ShiftSession.filter({ date: today }).catch(() => []);
        const activeShift = sessions.find(s => ['not_started', 'in_progress', 'closing'].includes(s.status));
        setShiftSession(activeShift || null);
      } catch (e) {
        console.error('Failed to load shift session:', e);
      } finally {
        setLoading(false);
      }
    };
    loadShift();
  }, []);

  const startShift = async (user) => {
    const today = new Date().toISOString().split('T')[0];
    const session = await base44.entities.ShiftSession.create({
      date: today,
      status: 'in_progress',
      start_time: new Date().toISOString(),
      manager_on_duty: user.email,
      manager_name: user.full_name,
    });
    setShiftSession(session);
    return session;
  };

  const transitionToClosing = async () => {
    if (!shiftSession) return;
    const updated = await base44.entities.ShiftSession.update(shiftSession.id, {
      status: 'closing',
    });
    setShiftSession(updated);
    return updated;
  };

  const completeShift = async (score, notes) => {
    if (!shiftSession) return;
    const updated = await base44.entities.ShiftSession.update(shiftSession.id, {
      status: 'completed',
      end_time: new Date().toISOString(),
      shift_score: score,
      notes,
    });
    setShiftSession(updated);
    return updated;
  };

  const updateShiftMetrics = async (metrics) => {
    if (!shiftSession) return;
    const updated = await base44.entities.ShiftSession.update(shiftSession.id, metrics);
    setShiftSession(updated);
    return updated;
  };

  return (
    <ShiftModeContext.Provider
      value={{
        shiftSession,
        loading,
        isShiftActive: shiftSession && ['in_progress', 'closing'].includes(shiftSession.status),
        isClosing: shiftSession?.status === 'closing',
        startShift,
        transitionToClosing,
        completeShift,
        updateShiftMetrics,
      }}
    >
      {children}
    </ShiftModeContext.Provider>
  );
}