import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable mobile-native modal wrapper
 * - Bottom sheet on mobile
 * - Centered on desktop
 * - Handles safe areas, scrolling, and tap targets
 * - Prevents background scroll and zoom
 */
export default function MobileModalWrapper({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      return () => {
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Click overlay to close */}
      <div
        className="absolute inset-0 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'w-full lg:max-w-lg max-h-[90vh] card-glass border border-border rounded-t-2xl lg:rounded-2xl flex flex-col overflow-hidden relative',
          className
        )}
      >
        {/* Header - Sticky */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/30 shrink-0">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="h-11 w-11 rounded-lg hover:bg-secondary flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>

        {/* Footer - Sticky */}
        {footer && (
          <div className="flex gap-2 px-4 py-3 border-t border-border/30 shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
