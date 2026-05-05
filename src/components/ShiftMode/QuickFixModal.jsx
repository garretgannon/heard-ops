import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function QuickFixModal({
  type, // 'tasks', 'logs', or 'issues'
  onClose,
  onResolved,
}) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        if (type === "tasks") {
          const prepItems = await base44.entities.PrepItem.list("-updated_date", 100).catch(() => []);
          setItems(prepItems.filter(i => !["completed", "approved"].includes(i.status)));
        } else if (type === "logs") {
          const tempLogs = await base44.entities.TempLogEntry.filter({ date: todayStr }).catch(() => []);
          setItems(tempLogs.slice(0, 5));
        } else if (type === "issues") {
          const issues = await base44.entities.Issue.filter({ status: "critical" }).catch(() => []);
          setItems(issues);
        }
      } catch (e) {
        console.error("Failed to load items:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, todayStr]);

  const handleQuickComplete = async (itemId) => {
    try {
      if (type === "tasks") {
        await base44.entities.PrepItem.update(itemId, { status: "completed", completed_at: new Date().toISOString() });
      } else if (type === "issues") {
        await base44.entities.Issue.update(itemId, { status: "resolved" });
      }
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast.success("Item resolved");
      if (items.length === 1) {
        setTimeout(() => onResolved?.(), 500);
      }
    } catch (e) {
      toast.error("Failed to resolve");
    }
  };

  const getItemLabel = (item) => {
    if (type === "tasks") return item.name;
    if (type === "issues") return item.title;
    return item.location_name;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Checks
      </button>

      <h2 className="text-lg font-bold text-foreground">
        {type === "tasks" && "Incomplete Tasks"}
        {type === "logs" && "Missing Logs"}
        {type === "issues" && "Critical Issues"}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
          <Check className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-emerald-400">All clear!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => handleQuickComplete(item.id)}
              className="w-full flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border hover:border-border/60 transition-colors text-left active:scale-95"
            >
              <div className="h-5 w-5 rounded-full border-2 border-border flex items-center justify-center shrink-0 mt-0.5 hover:border-primary transition-colors">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{getItemLabel(item)}</p>
                {item.priority && <p className="text-[9px] text-muted-foreground mt-0.5">{item.priority}</p>}
              </div>
              <p className="text-[10px] text-muted-foreground shrink-0">Tap to resolve</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}