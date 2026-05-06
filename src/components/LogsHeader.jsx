import { Bell } from "lucide-react";
import { haptics } from "@/utils/haptics";

export default function LogsHeader({ onNotifications }) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 pt-1.5 pb-2">
        {/* Title */}
        <h1 className="text-lg font-bold text-foreground mb-1">Logs</h1>

        {/* Top Row: Logo + Bell */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            

            
            
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => {
              haptics.light();
              onNotifications?.();
            }}
            className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center active:scale-95">
            <Bell className="h-5 w-5" />
            <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          </button>
        </div>
      </div>
    </div>);

}