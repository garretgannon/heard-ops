import { FileText, Plus, Droplet, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";

export default function CompactQuickActions({ onActionClick }) {
  const actions = [
    { id: "manager-log", label: "Log", icon: FileText },
    { id: "add-task", label: "Task", icon: Plus },
    { id: "update-prep", label: "Prep", icon: Droplet },
    { id: "log-temp", label: "Temp", icon: Thermometer },
  ];

  return (
    <div className="flex gap-2">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => {
            haptics.light?.();
            onActionClick?.(action.id);
          }}
          className="flex-1 h-8 rounded-lg border border-border bg-muted text-secondary-text text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-muted/80"
        >
          <action.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      ))}
    </div>
  );
}