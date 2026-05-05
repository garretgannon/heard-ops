import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Package, AlertTriangle, Plus } from "lucide-react";
import StandardPageShell from "@/components/StandardPageShell";
import ListCard from "@/components/ListCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function InventorySimplified() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.InventoryItem.list("-updated_date", 100).catch(() => []);
      setItems(all);
      setLoading(false);
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    const ok = items.filter(i => i.status === "ok").length;
    const low = items.filter(i => i.status === "low").length;
    const critical = items.filter(i => ["critical", "out"].includes(i.status)).length;
    return [
      { label: "In Stock", value: ok, color: "text-emerald-400" },
      { label: "Low", value: low, color: "text-amber-400" },
      { label: "Critical", value: critical, color: critical > 0 ? "text-red-400" : "text-muted-foreground" },
      { label: "Total", value: items.length, color: "text-foreground" },
    ];
  }, [items]);

  const filters = [
    { id: "all", label: "All Items" },
    { id: "ok", label: "In Stock" },
    { id: "low", label: "Low" },
    { id: "critical", label: "Critical" },
  ];

  const filtered = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "critical") return items.filter(i => ["critical", "out"].includes(i.status));
    return items.filter(i => i.status === activeFilter);
  }, [items, activeFilter]);

  const getStatusColor = (status) => {
    const map = {
      ok: "bg-emerald-500/10 text-emerald-400",
      low: "bg-amber-500/10 text-amber-400",
      critical: "bg-red-500/10 text-red-400",
      out: "bg-red-500/10 text-red-400",
    };
    return map[status] || "bg-muted text-muted-foreground";
  };

  const getStatusLabel = (status) => {
    const map = { ok: "OK", low: "Low", critical: "Critical", out: "Out" };
    return map[status] || status;
  };

  return (
    <StandardPageShell
      title="Inventory"
      subtitle="Monitor stock levels and reorder"
      icon={Package}
      metrics={metrics}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      notificationCount={metrics[2].value}
    >
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No items found</p>
            </div>
          ) : (
            filtered.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ListCard
                  icon={Package}
                  title={item.name}
                  details={[
                    `${item.current_stock} ${item.unit}`,
                    item.category,
                    item.vendor && `via ${item.vendor}`,
                  ].filter(Boolean)}
                  badge={getStatusLabel(item.status)}
                  badgeColor={getStatusColor(item.status)}
                />
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Bottom Action */}
      <div className="fixed bottom-20 left-4 right-4 z-30">
        <Button className="w-full gap-2 h-12">
          <Plus className="h-5 w-5" /> Add Item
        </Button>
      </div>
    </StandardPageShell>
  );
}

export const hideBase44Index = true;