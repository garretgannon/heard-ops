import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Toast({ message, onDismiss, id }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 200);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "fixed bottom-24 left-4 right-4 max-w-md mx-auto",
        "bg-slate-900 text-white px-4 py-3 rounded-lg",
        "border-l-2 border-l-primary border border-slate-700",
        "shadow-lg z-50",
        "animate-in fade-in duration-100",
        isExiting && "animate-out fade-out duration-200"
      )}
    >
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}