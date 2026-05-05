import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

/**
 * CardInteractionWrapper: Adds tap feedback, scale, and modal expansion to cards
 * Automatically tracks scroll position and provides consistent interaction UX
 */
export function CardInteractionWrapper({ children, onOpen, onClose }) {
  const [isPressed, setIsPressed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollPosRef = useRef(0);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    haptics.light();
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleCardClick = useCallback(() => {
    scrollPosRef.current = window.scrollY || document.documentElement.scrollTop;
    setIsExpanded(true);
    onOpen?.();
    document.body.style.overflow = 'hidden';
  }, [onOpen]);

  const handleCloseModal = useCallback(() => {
    setIsExpanded(false);
    onClose?.();
    document.body.style.overflow = '';
    window.setTimeout(() => {
      window.scrollTo(0, scrollPosRef.current);
    }, 50);
  }, [onClose]);

  return (
    <>
      {/* Card with interaction feedback */}
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onClick={handleCardClick}
        className={cn(
          'transition-all duration-150 ease-out cursor-pointer',
          isPressed ? 'scale-[0.98] shadow-lg' : 'scale-100 shadow-md'
        )}
      >
        {children}
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Darkened background */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity duration-200"
            onClick={handleCloseModal}
          />

          {/* Modal Content */}
          <div className="relative z-10 bg-card rounded-2xl border border-border max-w-md w-[90vw] max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={handleCloseModal}
              className="sticky top-0 right-0 p-4 text-secondary-text hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5 stroke-[1.5]" />
            </button>
            <div className="px-4 pb-4">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}