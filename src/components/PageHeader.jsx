import { Bell } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, subtitle, icon: Icon, notificationCount = 0 }) {
  const { user } = useCurrentUser();

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-[10px] text-muted-foreground mt-0">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-primary" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-status-error rounded-full" />
              )}
            </button>
          </div>
          {user && (
            <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
              {user.full_name?.charAt(0) || "U"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}