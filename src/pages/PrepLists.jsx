import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { formatISO } from "date-fns";
import ChecklistView from "../components/ChecklistView";
import { toast } from "sonner";

export default function PrepLists() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const today = formatISO(new Date()).split("T")[0];
      
      // Get active prep lists for today
      const lists = await base44.entities.PrepList.filter({
        date: today,
        status: "active"
      }).catch(() => []);

      if (lists.length > 0) {
        // Get prep items from those lists
        const allItems = await Promise.all(
          lists.map(list => 
            base44.entities.PrepItem.filter({
              prep_list_id: list.id
            }).catch(() => [])
          )
        );

        const mapped = allItems.flat().map(item => ({
          id: item.id,
          name: item.name,
          description: item.notes,
          status: item.status || "pending",
          priority: item.priority || "medium",
          assignedTo: item.completed_by,
          completedAt: item.completed_at,
          standard_notes: item.master_photo_url ? "📷 Requires photo reference" : null,
        }));

        setItems(mapped);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = async (id) => {
    const item = items.find(i => i.id === id);
    const newStatus = item.status === "completed" ? "pending" : "completed";
    
    await base44.entities.PrepItem.update(id, {
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    });

    setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i));
    toast.success(newStatus === "completed" ? "Prep completed" : "Prep reopened");
  };

  const metrics = useMemo(() => {
    const completed = items.filter(i => i.status === "completed").length;
    const pending = items.filter(i => i.status === "pending").length;
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
      title="Prep Checklists"
      subtitle="Complete prep items before service"
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