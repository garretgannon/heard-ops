import { useEffect } from "react";
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
  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1000] bg-black/70"
            style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Sheet panel */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380, mass: 0.9 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[1001] flex flex-col",
              "bg-[#0E1520] border-t border-white/[0.07] rounded-t-[24px]",
              "max-h-[90vh]",
              className
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-0 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header row */}
            {title && (
              <div className="flex items-center justify-between px-5 pt-3 pb-0 shrink-0">
                <p className="text-[17px] font-bold text-white tracking-tight">{title}</p>
                <button
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-full active:scale-90 transition-transform"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            )}

            {/* Scrollable content */}
            <div className="overflow-y-auto px-5 pt-4 pb-4 flex-1">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}