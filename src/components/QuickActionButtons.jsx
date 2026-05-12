import { quickActionsConfig } from "@/lib/quickActionsConfig";
import { FileText, ListPlus, ChefHat, Trash2, AlertTriangle } from "lucide-react";
import { haptics } from "@/utils/haptics";

const iconMap = {
  FileText,
  ListPlus,
  ChefHat,
  Trash2,
  AlertTriangle,
};

export default function QuickActionButtons({ onActionClick }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {quickActionsConfig.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => {
              haptics.light();
              onActionClick(action.targetModal);
            }}
            className="flex-shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border card-glass text-foreground text-xs font-bold whitespace-nowrap transition-all active:scale-95 hover:bg-muted hover:border-primary/30"
          >
            {Icon && <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}