import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChecklistView({
  title,
  subtitle,
  items = [],
  onItemToggle,
  onItemSelect,
  filters = [],
  activeFilter = "all",
  onFilterChange,
  metrics = [],
  primaryAction,
  primaryActionLabel = "Add Item",
  loading = false,
  showBackButton = true,
}) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter(item => item.status === activeFilter);
  }, [items, activeFilter]);

  const stats = useMemo(() => {
    const completed = items.filter(i => i.status === "completed").length;
    const total = items.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
        {showBackButton && (
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors active:scale-95">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Metrics */}
      {metrics.length > 0 && (
        <div className="px-4 py-3 border-b border-border grid grid-cols-4 gap-1.5">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-2 text-center">
              <p className={cn("text-lg font-bold", metric.color || "text-foreground")}>
                {metric.value}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{metric.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Completion Bar */}
      {items.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-foreground">Progress</p>
            <p className="text-xs font-bold text-primary">{stats.completed}/{stats.total}</p>
          </div>
          <div className="h-1.5 bg-card rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {filters.length > 0 && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-border">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="px-4 py-4 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            <Circle className="h-8 w-8 mx-auto mb-2 opacity-20" />
            No items
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className={cn(
                "w-full text-left bg-card border border-border rounded-xl p-3 transition-all hover:border-primary/30 active:scale-[0.98]",
                item.status === "completed" && "opacity-60"
              )}
            >
              <div className="flex items-start gap-2.5">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onItemToggle(item.id);
                  }}
                  className="flex-shrink-0 mt-0.5 transition-transform active:scale-110"
                >
                  {item.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : item.priority === "high" ? (
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-bold leading-tight",
                    item.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                  )}>
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{item.description}</p>
                  )}
                  {expandedId === item.id && item.standard_notes && (
                    <div className="mt-2 p-2 bg-muted/30 rounded border border-border text-[11px] text-muted-foreground">
                      <p className="font-semibold text-xs mb-1">Standard:</p>
                      {item.standard_notes}
                    </div>
                  )}
                </div>

                <ChevronRight className={cn(
                  "h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform",
                  expandedId === item.id && "rotate-90"
                )} />
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Primary Action Button */}
      {primaryAction && (
        <div className="fixed left-0 right-0 bottom-20 z-30 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <Button
            onClick={primaryAction}
            className="w-full h-11 gap-2 text-base"
          >
            + {primaryActionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}