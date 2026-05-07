import { Bell } from "lucide-react";
import { haptics } from "@/utils/haptics";

export default function KnowledgeHeader({ onNotifications }) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 py-3">
        {/* Title */}
        <h1 className="text-lg font-bold text-foreground mb-2">Knowledge</h1>

        {/* Top Row: Logo + Bell */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm hidden">
              H
            </div>
            <span className="text-xs font-bold text-secondary-text">HeardOS</span>
          </div>

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
        </div>
      </div>
    </div>);

}