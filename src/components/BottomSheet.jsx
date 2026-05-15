import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * iOS-style bottom sheet.
 * Drop-in replacement for Dialog on mobile.
 *
 * Props:
 *  open       — boolean
 *  onClose    — () => void
 *  title      — string (optional)
 *  children   — content
 *  className  — extra class on the panel
 */
export default function BottomSheet({ open, onClose, title, children, className }) {
  const scrollRef = useRef(null);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Reset scroll position to top after animation settles
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }, 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[1000] bg-black/75"
            style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={onClose}
          />

          {/* Sheet panel */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 400, mass: 0.85 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[1001] flex w-full max-w-full flex-col overflow-hidden",
              "rounded-t-[28px]",
              "max-h-[90vh]",
              className
            )}
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
              background: "linear-gradient(180deg, rgba(16, 23, 32, 0.98) 0%, rgba(8, 12, 18, 0.99) 100%)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 -8px 40px rgba(0, 0, 0, 0.6), 0 -1px 0 rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Drag handle + header row */}
            <div className="flex min-w-0 items-center justify-between px-5 shrink-0" style={{ paddingTop: "14px" }}>
              {/* Centered drag handle */}
              <div className="absolute left-1/2 -translate-x-1/2 top-3.5 w-9 h-[3px] rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.18)" }} />

              {title
                ? <p className="min-w-0 truncate pr-3 text-[17px] font-bold text-white tracking-tight leading-snug">{title}</p>
                : <div />
              }

              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-full active:scale-90 transition-transform shrink-0"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.07)" }}
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pt-4 pb-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
