/**
 * Haptic feedback utility for iPhone/iOS using the Vibration API.
 * Patterns are tuned to be subtle and intentional.
 * Falls back silently on unsupported devices.
 */

const vibrate = (pattern) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const haptics = {
  /** Light success — task complete, submission success */
  success: () => vibrate(10),

  /** Warning — missing fields, action blocked, validation error */
  warning: () => vibrate([15, 40, 15]),

  /** Medium — manager approve/reject actions */
  medium: () => vibrate(25),

  /** Very light — swipe threshold reached */
  swipe: () => vibrate(6),
};