import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function StatusSection({ title, items, icon: Icon, emptyMessage }) {
  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{title}</h3>
        <div className="bg-card rounded-xl border border-border p-4 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{title}</h3>
      <div className="space-y-2">
        {items.slice(0, 3).map((item, idx) => (
          <div
            key={idx}
            className={`rounded-xl border-2 p-3 flex items-start gap-3 ${
              item.priority === "high" || item.status === "open"
                ? "bg-red-500/10 border-red-500/30"
                : item.priority === "medium" || item.status === "pending"
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-card border-border"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{item.title || item.name || item.task_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.location || item.description || ""}</p>
            </div>
          </div>
        ))}
        {items.length > 3 && (
          <div className="text-xs text-center text-muted-foreground font-semibold py-2">
            +{items.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}