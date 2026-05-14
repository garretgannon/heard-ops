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
    <div className="fixed inset-0 z-[1100] flex items-end justify-center overflow-x-hidden bg-black/60 backdrop-blur-sm lg:items-center lg:p-6">
      {/* Click overlay to close */}
      <div
        className="absolute inset-0 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-full flex-col overflow-hidden rounded-t-2xl border border-border card-glass lg:max-w-lg lg:rounded-2xl',
          className
        )}
      >
        {/* Header - Sticky */}
        <div className="flex min-w-0 shrink-0 items-center justify-between border-b border-border/30 px-4 py-4">
          <h2 className="min-w-0 truncate pr-3 text-lg font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform hover:bg-secondary active:scale-95"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-4">{children}</div>

        {/* Footer - Sticky */}
        {footer && (
          <div className="flex min-w-0 shrink-0 gap-2 border-t border-border/30 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] [&>*]:min-w-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
