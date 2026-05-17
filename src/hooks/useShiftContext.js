import { useState, useCallback } from 'react';
import {
  detectShiftType,
  matchProfilesForUser,
  buildShiftContext,
  DEFAULT_PROFILES,
} from '@/lib/briefingProfiles';

const SESSION_KEY = 'heardos_shift_context';
const today = () => new Date().toISOString().slice(0, 10);

function loadSavedContext() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire on date change
    if (parsed.date !== today()) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return parsed;
  } catch { return null; }
}

function saveContext(ctx) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(ctx)); } catch {}
}

/**
 * Shift Context Engine hook.
 *
 * Returns:
 *   context           — the active ShiftContext (null until resolved)
 *   candidateProfiles — profiles to show in the selector (when needsSelection)
 *   needsSelection    — true when user must choose a profile
 *   selectProfile(p)  — user selects a profile → sets context
 *   resetContext()    — clears saved context and re-shows selector
 *   updateContext(Δ)  — patch the active context (for manual overrides)
 */
export function useShiftContext(user) {
  const initContext = () => {
    const saved = loadSavedContext();
    if (saved) return saved;
    return null;
  };

  const initNeedsSelection = () => {
    if (loadSavedContext()) return false;
    if (!user) return false;
    const shiftType = detectShiftType(new Date().getHours());
    const matches = matchProfilesForUser(user, shiftType);
    return matches.length !== 1;
  };

  const initCandidates = () => {
    if (loadSavedContext()) return [];
    if (!user) return DEFAULT_PROFILES;
    const shiftType = detectShiftType(new Date().getHours());
    return matchProfilesForUser(user, shiftType);
  };

  // Lazy-init so sessionStorage is read synchronously on first render
  const [context, setContext]                   = useState(initContext);
  const [needsSelection, setNeedsSelection]     = useState(initNeedsSelection);
  const [candidateProfiles, setCandidateProfiles] = useState(initCandidates);

  // If no saved context and exactly one profile matches, auto-set it
  useState(() => {
    if (context || !user) return;
    const shiftType = detectShiftType(new Date().getHours());
    const matches = matchProfilesForUser(user, shiftType);
    if (matches.length === 1) {
      const ctx = buildShiftContext(matches[0], user);
      setContext(ctx);
      saveContext(ctx);
      setNeedsSelection(false);
    } else {
      setCandidateProfiles(matches);
      setNeedsSelection(true);
    }
  });

  const selectProfile = useCallback((profile) => {
    const ctx = buildShiftContext(profile, user);
    setContext(ctx);
    saveContext(ctx);
    setNeedsSelection(false);
  }, [user]);

  const resetContext = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setContext(null);
    if (user) {
      const shiftType = detectShiftType(new Date().getHours());
      const matches = matchProfilesForUser(user, shiftType);
      setCandidateProfiles(matches);
    } else {
      setCandidateProfiles(DEFAULT_PROFILES);
    }
    setNeedsSelection(true);
  }, [user]);

  const updateContext = useCallback((updates) => {
    setContext(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      saveContext(next);
      return next;
    });
  }, []);

  return { context, candidateProfiles, needsSelection, selectProfile, resetContext, updateContext };
}
