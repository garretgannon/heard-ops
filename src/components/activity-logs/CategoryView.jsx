import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { LOG_TYPES } from "./logConfig";
import LogCard from "./LogCard";

const CATEGORIES = Object.entries(LOG_TYPES).map(([id, cfg]) => ({ id, ...cfg }));

export default function CategoryView({ logs, onLogClick }) {
  const [selected, setSelected] = useState("manager");

  const filtered = logs.filter(l => l.type === selected);
  const cfg      = LOG_TYPES[selected];
  const Icon     = cfg?.icon;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        {CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          const count   = logs.filter(l => l.type === cat.id).length;
          return (
            <button key={cat.id} onClick={() => setSelected(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-xl border transition-all active:scale-[0.97]",
                selected === cat.id
                  ? `${cat.bg} ${cat.color} border-transparent`
                  : "bg-card border-border text-muted-foreground hover:border-border/80"
              )}>
              <CatIcon className="h-4 w-4" />
              <span className="text-[9px] font-bold leading-tight text-center line-clamp-1">{cat.label}</span>
              <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded-full",
                selected === cat.id ? "bg-black/20 text-white" : "bg-muted text-muted-foreground")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {cfg && (
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border-l-4", cfg.bg, cfg.border)}>
          {Icon && <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />}
          <div>
            <p className={cn("text-sm font-bold", cfg.color)}>{cfg.label}</p>
            <p className="text-xs text-muted-foreground">{filtered.length} log{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No {cfg?.label} logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => <LogCard key={`${log.type}-${log.id}`} log={log} onClick={onLogClick} />)}
        </div>
      )}
    </div>
  );
}