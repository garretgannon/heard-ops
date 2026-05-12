import { FileText, ListTodo, Thermometer, UtensilsCrossed, Lightbulb } from "lucide-react";
import { haptics } from "@/utils/haptics";

const QUICK_ACTIONS = [
  { id: "manager_log", label: "Manager Log", icon: FileText, color: "text-blue-400" },
  { id: "add_task", label: "Add Task", icon: ListTodo, color: "text-primary" },
  { id: "temp_log", label: "Temps", icon: Thermometer, color: "text-cyan-400" },
  { id: "prep_item", label: "Prep", icon: UtensilsCrossed, color: "text-amber-400" },
  { id: "issue", label: "Issue", icon: Lightbulb, color: "text-orange-400" },
];

export default function CompactQuickActions({ onActionClick }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {QUICK_ACTIONS.map(({ id, label, icon: Icon, color }) => (
        <button
          key={id}
          onClick={() => {
            haptics.light();
            onActionClick?.(id);
          }}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg card-glass border border-border/50 hover:border-border/80 active:scale-95 transition-all group"
        >
          <div className="relative">
            <Icon className={`h-5 w-5 stroke-[1.5] ${color}`} />
          </div>
          <span className="text-[9px] font-bold text-secondary-text text-center leading-tight group-hover:text-foreground transition-colors">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}