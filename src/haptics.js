/**
 * Haptics API wrapper with fallback support
 * Provides consistent tactile feedback across the app
 */

const haptics = {
  /**
   * Light tap - button presses, navigation
   */
  light: () => {
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(10);
      }
    } catch (e) {
      // Silently fail on unsupported devices
    }
  },

  /**
   * Medium impact - completing tasks, confirming actions
   */
  medium: () => {
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([20, 30, 20]);
      }
    } catch (e) {
      // Silently fail
    }
  },

  /**
   * Strong impact - critical alerts, overdue items
   */
  strong: () => {
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([30, 40, 30, 40, 30]);
      }
    } catch (e) {
      // Silently fail
    }
  },

  /**
   * Success feedback
   */
  success: () => {
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([15, 10, 15]);
      }
    } catch (e) {
      // Silently fail
    }
  },

  /**
   * Warning/error feedback
   */
  warning: () => {
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([30, 20, 30]);
      }
    } catch (e) {
      // Silently fail
    }
  },

  /**
   * Swipe/gesture feedback
   */
  swipe: () => {
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(5);
      }
    } catch (e) {
      // Silently fail
    }
  },
};

export { haptics };