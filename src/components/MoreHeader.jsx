import { Settings } from "lucide-react";
import { haptics } from "@/utils/haptics";

export default function MoreHeader({ onSettings }) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 py-3">
        {/* Top Row: Logo + Settings */}
        <div className="flex items-center justify-between mb-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              H
            </div>
            <span className="text-xs font-bold text-secondary-text">HeardOS</span>
          </div>

          {/* Settings Icon */}
          <button
            onClick={() => {
              haptics.light();
              onSettings?.();
            }}
            className="p-1.5 rounded-lg hover:bg-muted transition-all active:scale-95"
          >
            <Settings className="h-5 w-5 stroke-[1.5] text-secondary-text" />
          </button>
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold text-foreground">More</h1>
      </div>
    </div>
  );
}