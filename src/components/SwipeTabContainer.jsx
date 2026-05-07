import { useRef, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bottomNavRoutes } from '@/lib/routeConfig';
import { haptics } from '@/utils/haptics';
import TodaysCommandCenter from '@/pages/TodaysCommandCenter';
import StaffTasks from '@/pages/StaffTasks';
import Logs from '@/pages/Logs';
import Knowledge from '@/pages/Knowledge';
import More from '@/pages/More';

const TAB_PAGES = [
  { path: '/', component: TodaysCommandCenter },
  { path: '/tasks', component: StaffTasks },
  { path: '/logs', component: Logs },
  { path: '/knowledge', component: Knowledge },
  { path: '/more', component: More },
];

const TAB_PATHS = TAB_PAGES.map(t => t.path);

// Selectors where swipe should be suppressed
const NO_SWIPE_SELECTORS = [
  'input', 'textarea', 'select',
  '[role="dialog"]', '[role="menu"]', '[role="listbox"]',
  '[role="combobox"]', '[data-no-swipe]',
  '.overflow-x-auto', '[data-radix-scroll-area-viewport]',
  '[data-radix-select-content]',
];

// Tags that cancel swipe — buttons are allowed to be tapped through swipe,
// but we cancel tracking so they still fire normally.
const CANCEL_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);

function isInteractiveTarget(el) {
  if (!el) return false;
  if (CANCEL_TAGS.has(el.tagName)) return true;
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

    // Need at least 8px movement to decide direction (avoids accidental locks)
    if (touchStart.current.locked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // Require horizontal to be meaningfully dominant (ratio ≥ 1.5)
      if (Math.abs(dx) > Math.abs(dy) * 1.5) {
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
      className="overflow-hidden w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Horizontal strip of all 5 tab pages */}
      <div
        className="flex"
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
            className="w-full shrink-0 overflow-y-auto"
            style={{ minWidth: '100%' }}
            aria-hidden={i !== safeIndex}
          >
            <Page />
          </div>
        ))}
      </div>
    </div>
  );
}