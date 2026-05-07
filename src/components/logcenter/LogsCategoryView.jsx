import { cn } from "@/lib/utils";
import { LOG_TYPE_CONFIG, TYPE_FILTER_LIST } from "./logConfig";
import LogCard from "./LogCard";
import { FileText } from "lucide-react";

export default function LogsCategoryView({ logs, onLogClick, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categories = TYPE_FILTER_LIST
    .filter(f => f.id !== "all")
    .map(f => {
      const cfg = LOG_TYPE_CONFIG[f.id];
      return { ...f, cfg, items: logs.filter(l => l.type === f.id) };
    })
    .filter(c => c.items.length > 0);

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-bold">No logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map(({ id, label, cfg, items }) => {
        const Icon = cfg?.icon;
        return (
          <div key={id}>
            <div className={cn("flex items-center gap-2.5 mb-2.5 px-3 py-2 rounded-lg", cfg?.bg || "bg-muted/30")}>
              {Icon && <Icon className={cn("h-4 w-4", cfg?.text)} />}
              <span className={cn("text-xs font-bold", cfg?.text)}>{label}</span>
              <span className="ml-auto text-[10px] font-bold text-muted-foreground">
                {items.length} log{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1.5">
              {items.map(log => (
                <LogCard key={`${log.type}-${log.id}`} log={log} onClick={onLogClick} compact />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}