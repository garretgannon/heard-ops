import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { formatISO } from "date-fns";
import ChecklistView from "../components/ChecklistView";
import { toast } from "sonner";

export default function SideWork() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const today = formatISO(new Date()).split("T")[0];
      
      const tasks = await base44.entities.SideWorkAssignment.filter({
        date: today,
        status: { $in: ["pending", "in_progress", "completed"] }
      }).catch(() => []);

      const mapped = tasks.map(t => ({
        id: t.id,
        name: t.task_name,
        description: t.description,
        status: t.status || "pending",
        priority: t.priority || "medium",
        assignedTo: t.assigned_to_name,
        dueTime: t.due_time,
        completedAt: t.completed_at,
        standard_notes: t.description,
      }));

      setItems(mapped);
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = async (id) => {
    const item = items.find(i => i.id === id);
    const newStatus = item.status === "completed" ? "pending" : "completed";
    
    await base44.entities.SideWorkAssignment.update(id, {
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    });

    setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i));
    toast.success(newStatus === "completed" ? "Task completed" : "Task reopened");
  };

  const metrics = useMemo(() => {
    const completed = items.filter(i => i.status === "completed").length;
    const pending = items.filter(i => i.status === "pending" || i.status === "in_progress").length;
    const overdue = items.filter(i => i.status === "overdue").length;
    return [
      { label: "Complete", value: completed, color: "text-emerald-400" },
      { label: "Pending", value: pending, color: "text-amber-400" },
      { label: "Overdue", value: overdue, color: overdue > 0 ? "text-red-400" : "text-muted-foreground" },
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
      title="Side Work"
      subtitle="Complete assigned side work tasks"
      items={items}
      onItemToggle={handleToggle}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      metrics={metrics}
      loading={loading}
      primaryActionLabel="Add Task"
    />
  );
}

export const hideBase44Index = true;