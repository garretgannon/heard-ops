import { quickActionsConfig } from "@/lib/quickActionsConfig";
import { FileText, CheckCircle2, AlertTriangle, Flame, Wrench } from "lucide-react";
import { haptics } from "@/utils/haptics";

const iconMap = {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wrench,
};

export default function QuickActionButtons({ onActionClick }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {quickActionsConfig.map((action) => {
        const Icon = iconMap[action.icon];
        return (
          <button
            key={action.id}
            onClick={() => {
              haptics.light();
              onActionClick(action.targetModal);
            }}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border border-border transition-all active:scale-95 ${action.color}`}
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span className="text-xs font-bold text-center">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}