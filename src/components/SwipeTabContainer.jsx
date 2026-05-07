import { useRef, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bottomNavRoutes } from '@/lib/routeConfig';
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
  'input', 'textarea', 'select', 'button',
  '[role="dialog"]', '[role="menu"]', '[data-no-swipe]',
  '.overflow-x-auto', '[data-radix-scroll-area-viewport]',
];

function isInteractiveTarget(el) {
  if (!el) return false;
  for (const sel of NO_SWIPE_SELECTORS) {
    if (el.closest(sel)) return true;
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
  const [isAnimating, setIsAnimating] = useState(false);

  const activeIndex = TAB_PATHS.indexOf(location.pathname);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  const goToTab = useCallback((index) => {
    if (index < 0 || index >= TAB_PAGES.length) return;
    setIsAnimating(true);
    navigate(TAB_PAGES[index].path);
    setTimeout(() => setIsAnimating(false), 300);
  }, [navigate]);

  const handleTouchStart = useCallback((e) => {
    if (isInteractiveTarget(e.target)) return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      locked: null,
    };
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;

    // Lock direction on first significant move
    if (touchStart.current.locked === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      touchStart.current.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (touchStart.current.locked !== 'h') return;

    // Prevent native scroll when we own the gesture
    e.preventDefault();

    // Rubber-band at edges
    const isAtStart = safeIndex === 0 && dx > 0;
    const isAtEnd = safeIndex === TAB_PAGES.length - 1 && dx < 0;
    const resistance = (isAtStart || isAtEnd) ? 0.2 : 1;
    setDragOffset(dx * resistance);
  }, [safeIndex]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || touchStart.current.locked !== 'h') {
      touchStart.current = null;
      setDragOffset(0);
      return;
    }

    const SWIPE_THRESHOLD = 60;
    if (dragOffset < -SWIPE_THRESHOLD) {
      goToTab(safeIndex + 1);
    } else if (dragOffset > SWIPE_THRESHOLD) {
      goToTab(safeIndex - 1);
    }

    touchStart.current = null;
    setDragOffset(0);
  }, [dragOffset, safeIndex, goToTab]);

  // Passive: false needed for e.preventDefault() in touchmove
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
          transition: dragOffset === 0 ? 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
          willChange: 'transform',
        }}
      >
        {TAB_PAGES.map(({ path, component: Page }, i) => (
          <div
            key={path}
            className="w-full shrink-0"
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