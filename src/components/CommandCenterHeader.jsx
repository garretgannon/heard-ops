import { Bell, Calendar } from "lucide-react";
import { format } from "date-fns";
import { haptics } from "@/utils/haptics";

export default function CommandCenterHeader({ onNotifications, onViewDay }) {
  const today = new Date();
  const dateStr = format(today, "EEEE, MMMM d");

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 py-3 space-y-3">
        {/* Top Row: Logo + Bell + Button */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            

            
            
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => {
                haptics.light();
                onNotifications?.();
              }}
              className="relative p-1.5 rounded-lg hover:bg-muted transition-all active:scale-95">
              
              <Bell className="h-5 w-5 stroke-[1.5] text-secondary-text" />
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            </button>

            {/* View Day Button */}
            <button
              onClick={() => {
                haptics.light();
                onViewDay?.();
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-muted text-secondary-text hover:bg-muted/80 transition-all active:scale-95">
              
              View Day
            </button>
          </div>
        </div>

        {/* Title and Date */}
        <div>
          <h1 className="text-lg font-bold text-foreground">Today</h1>
          <div className="flex items-center gap-1 mt-1 text-xs text-secondary-text">
            <Calendar className="h-3.5 w-3.5" />
            <span>{dateStr}</span>
          </div>
        </div>
      </div>
    </div>);

}