import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { formatISO } from "date-fns";
import ChecklistView from "../components/ChecklistView";
import { toast } from "sonner";

export default function OpeningChecklist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const today = formatISO(new Date()).split("T")[0];
      const checklists = await base44.entities.OpeningChecklist.filter({
        date: today
      }).catch(() => []);
      
      const mapped = checklists.map(c => ({
        id: c.id,
        name: c.task_name,
        description: c.description,
        status: c.status || "pending",
        priority: c.is_critical ? "high" : "normal",
        assignedTo: c.assigned_to_name,
        area: c.area,
        notes: c.notes,
        completedAt: c.completed_at,
      }));

      setItems(mapped);
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = async (id) => {
    const item = items.find(i => i.id === id);
    const newStatus = item.status === "completed" ? "pending" : "completed";
    
    await base44.entities.OpeningChecklist.update(id, {
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    });

    setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i));
    toast.success(newStatus === "completed" ? "Task completed" : "Task reopened");
  };

  const metrics = useMemo(() => {
    const completed = items.filter(i => i.status === "completed").length;
    const pending = items.filter(i => i.status === "pending").length;
    const critical = items.filter(i => i.priority === "high" && i.status !== "completed").length;
    return [
      { label: "Complete", value: completed, color: "text-emerald-400" },
      { label: "Pending", value: pending, color: "text-amber-400" },
      { label: "Critical", value: critical, color: critical > 0 ? "text-red-400" : "text-muted-foreground" },
      { label: "Total", value: items.length, color: "text-foreground" },
    ];
  }, [items]);

  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Done" },
  ];

  return (
    <ChecklistView
      title="Opening Checklist"
      subtitle="Complete before service opens"
      items={items}
      onItemToggle={handleToggle}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      metrics={metrics}
      loading={loading}
    />
  );
}

export const hideBase44Index = true;