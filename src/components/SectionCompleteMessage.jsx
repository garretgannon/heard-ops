import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function SectionCompleteMessage({ station, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none",
      "animate-in fade-in slide-in-from-top-4 duration-300",
      !isVisible && "animate-out fade-out slide-out-to-top-4 duration-300"
    )}>
      <div className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
        All {station} complete 🔥
      </div>
    </div>
  );
}