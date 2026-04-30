import { CheckCircle2, AlertCircle } from "lucide-react";

export default function CompletionCard({ title, completed, total, icon: Icon, color = "text-accent" }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isUrgent = percentage < 50 && total > 0;

  return (
    <div className={`rounded-xl border-2 p-4 lg:p-3 ${isUrgent ? "bg-red-500/10 border-red-500/30" : "bg-card border-border"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${isUrgent ? "text-red-600" : color}`} />
          <span className={`text-xs font-semibold ${isUrgent ? "text-red-600" : "text-muted-foreground"}`}>{title}</span>
        </div>
        <span className={`text-lg font-bold ${isUrgent ? "text-red-600" : "text-accent"}`}>{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isUrgent ? "bg-red-500" : "bg-accent"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-2 font-semibold">{completed} of {total}</div>
    </div>
  );
}