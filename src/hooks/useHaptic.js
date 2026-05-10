/**
 * useHaptic — lightweight haptic feedback hook
 * Uses Vibration API on supported mobile devices, silently no-ops elsewhere.
 */
export function useHaptic() {
  const tap = () => {
    try { navigator.vibrate?.(8); } catch {}
  };

  const success = () => {
    try { navigator.vibrate?.([6, 40, 12]); } catch {}
  };

  const warning = () => {
    try { navigator.vibrate?.([20, 60, 20]); } catch {}
  };

  const error = () => {
    try { navigator.vibrate?.([30, 50, 30, 50, 30]); } catch {}
  };

  return { tap, success, warning, error };
}

export default useHaptic;