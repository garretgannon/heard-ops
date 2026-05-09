/**
 * Standardized modal animations - all slide from right with 200ms duration
 */

export const MODAL_VARIANTS = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const DRAWER_VARIANTS = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};