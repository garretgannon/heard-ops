import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const CHECKLIST_ITEMS = [
  { id: "handoff", label: "Review handoff notes" },
  { id: "critical_tasks", label: "Check critical tasks" },
  { id: "staff_coverage", label: "Confirm staff coverage" },
  { id: "temps", label: "Check temps logged" },
];

export default function StartShiftChecklist({ onStartShift, isLoading }) {
  const [completed, setCompleted] = useState(new Set());

  const progress = Math.round((completed.size / CHECKLIST_ITEMS.length) * 100);
  const isComplete = completed.size === CHECKLIST_ITEMS.length;

  const toggleItem = (id) => {
    const newCompleted = new Set(completed);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompleted(newCompleted);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">Start Your Shift</h1>
        <p className="text-xs text-muted-foreground mt-1">Take control from the start</p>
      </div>

      {/* Circular Progress Indicator */}
      <div className="flex justify-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="absolute w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeDasharray={`${2.827 * 45 * (progress / 100)} 282.7`}
              strokeLinecap="round"
              className="transition-all duration-300"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{progress}%</p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const isChecked = completed.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all active:scale-95",
                isChecked
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border hover:border-border/80"
              )}
            >
              {isChecked ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={cn("text-sm font-semibold", isChecked ? "text-foreground line-through opacity-60" : "text-foreground")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Start Shift Button */}
      <button
        onClick={onStartShift}
        disabled={!isComplete || isLoading}
        className={cn(
          "w-full h-11 rounded-lg font-bold text-sm transition-all active:scale-95",
          isComplete
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Starting...
          </div>
        ) : (
          "Start Shift"
        )}
      </button>
    </div>
  );
}