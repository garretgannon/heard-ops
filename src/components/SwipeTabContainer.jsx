import { lazy, Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { haptics } from '@/utils/haptics';

const AppOverview = lazy(() => import('@/pages/AppOverview'));
const ManagerShift = lazy(() => import('@/pages/ManagerShift'));
const OperationalMap = lazy(() => import('@/pages/OperationalMap'));
const More = lazy(() => import('@/pages/More'));

const TAB_PAGES = [
  { path: '/app/overview', component: AppOverview },
  { path: '/operational-map', component: OperationalMap },
  { path: '/shift', component: ManagerShift },
  { path: '/more', component: More },
];

const TAB_PATHS = TAB_PAGES.map(t => t.path);

function TabFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>
  );
}

// Selectors where swipe should be suppressed
const NO_SWIPE_SELECTORS = [
  'input', 'textarea', 'select',
  '[role="dialog"]', '[role="menu"]', '[role="listbox"]',
  '[role="combobox"]', '[data-no-swipe]',
  '.overflow-x-auto', '[data-radix-scroll-area-viewport]',
  '[data-radix-select-content]',
];

// Tags that cancel swipe. Touch targets are often child icons/text inside buttons,
// so isInteractiveTarget also checks the closest interactive ancestor.
const CANCEL_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);

function isInteractiveTarget(el) {
  if (!el) return false;
  if (CANCEL_TAGS.has(el.tagName)) return true;
  try {
    if (el.closest('button, a, input, textarea, select, label, [role="button"], [role="link"]')) {
      return true;
    }
  } catch (_) {}
  for (const sel of NO_SWIPE_SELECTORS) {
    try { if (el.closest(sel)) return true; } catch (_) {}
  }
  return false;
}

export function isTabRoute(pathname) {
  return TAB_PATHS.includes(pathname);
}

export default function SwipeTabContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const touchStart = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const pageRefs = useRef([]);

  const activeIndex = TAB_PATHS.indexOf(location.pathname);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  // Scroll the newly-active page to the top whenever the tab changes
  useEffect(() => {
    const el = pageRefs.current[safeIndex];
    if (el) el.scrollTop = 0;
  }, [safeIndex]);

  const goToTab = useCallback((index) => {
    if (index < 0 || index >= TAB_PAGES.length) return;
    haptics.light();
    navigate(TAB_PAGES[index].path);
  }, [navigate]);

  const handleTouchStart = useCallback((e) => {
    // Cancel on interactive targets — let them handle their own events
    if (isInteractiveTarget(e.target)) return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      startScrollY: e.target.scrollTop ?? 0,
      locked: null,    // null = undecided, 'h' = horizontal, 'v' = vertical
    };
    isDragging.current = false;
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;

    // Need at least 14px movement to decide direction (avoids accidental locks on taps)
    if (touchStart.current.locked === null) {
      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
      // Require horizontal to be clearly dominant (ratio ≥ 2.5) to avoid false triggers on taps
      if (Math.abs(dx) > Math.abs(dy) * 2.5) {
        touchStart.current.locked = 'h';
        isDragging.current = true;
      } else {
        touchStart.current.locked = 'v';
        return;
      }
    }

    if (touchStart.current.locked !== 'h') return;

    // We own this gesture — prevent native scroll
    e.preventDefault();

    // Rubber-band resistance at first/last tab
    const isAtStart = safeIndex === 0 && dx > 0;
    const isAtEnd = safeIndex === TAB_PAGES.length - 1 && dx < 0;
    const resistance = (isAtStart || isAtEnd) ? 0.18 : 1;
    setDragOffset(dx * resistance);
  }, [safeIndex]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || touchStart.current.locked !== 'h') {
      touchStart.current = null;
      isDragging.current = false;
      setDragOffset(0);
      return;
    }

    // Threshold: 55px or >30% of screen width, whichever is smaller
    const threshold = Math.min(55, window.innerWidth * 0.30);
    if (dragOffset < -threshold) {
      goToTab(safeIndex + 1);
    } else if (dragOffset > threshold) {
      goToTab(safeIndex - 1);
    }

    touchStart.current = null;
    isDragging.current = false;
    setDragOffset(0);
  }, [dragOffset, safeIndex, goToTab]);

  // passive: false is required so e.preventDefault() works in touchmove
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [handleTouchMove]);

  const translateX = `calc(-${safeIndex * 100}% + ${dragOffset}px)`;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-hidden w-full"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Horizontal strip of all 5 tab pages */}
      <div
        className="flex h-full"
        style={{
          transform: `translateX(${translateX})`,
          // 250ms ease-out snap when finger lifts; no transition while dragging
          transition: isDragging.current ? 'none' : 'transform 250ms cubic-bezier(0.0, 0.0, 0.2, 1)',
          willChange: 'transform',
        }}
      >
        {TAB_PAGES.map(({ path, component: Page }, i) => (
          <div
            key={path}
            ref={el => pageRefs.current[i] = el}
            className="w-full h-full shrink-0 overflow-y-auto overscroll-contain"
            style={{ minWidth: '100%', WebkitOverflowScrolling: 'touch' }}
            aria-hidden={i !== safeIndex}
          >
            <div className="mobile-tab-viewport">
              <Suspense fallback={<TabFallback />}>
                <Page />
              </Suspense>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
