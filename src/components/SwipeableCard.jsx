import { useRef, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SwipeableCard — wraps any card with touch swipe gestures.
 * swipeRight triggers onSwipeRight (e.g., mark complete)
 * swipeLeft  triggers onSwipeLeft  (e.g., report issue / reassign)
 */
export default function SwipeableCard({ children, onSwipeRight, onSwipeLeft, disabled = false, className }) {
  const startX = useRef(null);
  const [dx, setDx] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const THRESHOLD = 72;

  const onTouchStart = (e) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    // clamp so it doesn't go too far
    setDx(Math.max(-110, Math.min(110, delta)));
  };

  const onTouchEnd = () => {
    if (dx > THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (dx < -THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    setDx(0);
    setSwiping(false);
    startX.current = null;
  };

  const progress = Math.abs(dx) / THRESHOLD;
  const isRight = dx > 0;
  const isLeft = dx < 0;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Right action reveal (swipe right = complete) */}
      {onSwipeRight && (
        <div
          className="absolute inset-y-0 left-0 flex items-center pl-5 rounded-l-xl bg-green-600 transition-opacity"
          style={{ width: Math.max(0, dx), opacity: isRight ? Math.min(1, progress) : 0 }}
        >
          <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0" />
          <span className="text-white text-xs font-bold ml-2 whitespace-nowrap">Complete</span>
        </div>
      )}

      {/* Left action reveal (swipe left = report issue) */}
      {onSwipeLeft && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-5 rounded-r-xl bg-orange-600 transition-opacity"
          style={{ width: Math.max(0, -dx), opacity: isLeft ? Math.min(1, progress) : 0 }}
        >
          <span className="text-white text-xs font-bold mr-2 whitespace-nowrap">Flag</span>
          <AlertTriangle className="h-6 w-6 text-white flex-shrink-0" />
        </div>
      )}

      {/* Card content */}
      <div
        className={cn("relative z-10 transition-transform", className)}
        style={{ transform: `translateX(${dx}px)`, transition: swiping ? "none" : "transform 0.3s ease" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}