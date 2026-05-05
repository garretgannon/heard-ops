import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CaughtUpEmptyState({ icon: IconComponent, showAnimation = true, className }) {
  const Icon = IconComponent || CheckCircle2;
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className={cn(
        "h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4",
        showAnimation && "animate-deep-link-glow"
      )}>
        <Icon className={cn(
          "h-7 w-7 stroke-[1.5] text-primary",
          showAnimation && "animate-subtle-bounce"
        )} />
      </div>
      <p className="text-sm font-semibold text-foreground">You're all caught up.</p>
    </div>
  );
}