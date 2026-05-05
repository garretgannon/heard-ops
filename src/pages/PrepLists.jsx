import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { formatISO } from "date-fns";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PrepLists() {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const today = formatISO(new Date()).split("T")[0];
      
      const [prepItems, openingTasks, closingTasks, sideWorkTasks] = await Promise.all([
        base44.entities.PrepList.filter({ date: today, status: "active" }).catch(() => []).then(lists => {
          if (lists.length === 0) return [];
          return Promise.all(
            lists.map(list => base44.entities.PrepItem.filter({ prep_list_id: list.id }).catch(() => []))
          ).then(arr => arr.flat());
        }),
        base44.entities.OpeningChecklist.filter({ date: today }).catch(() => []),
        base44.entities.ClosingChecklist.filter({ date: today }).catch(() => []),
        base44.entities.SideWorkAssignment.filter({ date: today }).catch(() => []),
      ]);

      const compiled = [
        ...prepItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.notes,
          status: item.status || "pending",
          priority: item.priority || "medium",
          assignedTo: item.completed_by,
          type: "prep",
          entity: "PrepItem",
        })),
        ...openingTasks.map(task => ({
          id: task.id,
          name: task.task_name,
          description: task.description,
          status: task.status || "pending",
          priority: task.is_critical ? "high" : "medium",
          assignedTo: task.assigned_to_email,
          type: "opening",
          entity: "OpeningChecklist",
        })),
        ...closingTasks.map(task => ({
          id: task.id,
          name: task.task_name,
          description: task.notes,
          status: task.status || "pending",
          priority: task.is_critical ? "high" : "medium",
          assignedTo: task.assigned_to_email,
          type: "closing",
          entity: "ClosingChecklist",
        })),
        ...sideWorkTasks.map(task => ({
          id: task.id,
          name: task.task_name,
          description: task.description,
          status: task.status || "pending",
          priority: task.priority || "medium",
          assignedTo: task.assigned_to_email,
          type: task.role_assignment === "cleaning" ? "cleaning" : "sidework",
          entity: "SideWorkAssignment",
        })),
      ];

      setAllTasks(compiled);
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = async (id) => {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === "completed" ? "pending" : "completed";
    
    try {
      const entityMap = {
        prep: "PrepItem",
        opening: "OpeningChecklist",
        closing: "ClosingChecklist",
        cleaning: "SideWorkAssignment",
        sidework: "SideWorkAssignment",
      };
      const entity = entityMap[task.type];
      await base44.entities[entity].update(id, { status: newStatus });
      setAllTasks(allTasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
      toast.success(newStatus === "completed" ? "Task completed" : "Task reopened");
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const metrics = useMemo(() => {
    const completed = allTasks.filter(i => i.status === "completed").length;
    const pending = allTasks.filter(i => i.status === "pending").length;
    const inProgress = allTasks.filter(i => i.status === "in_progress").length;
    return [
      { label: "Complete", value: completed, color: "text-emerald-400" },
      { label: "In Progress", value: inProgress, color: "text-blue-400" },
      { label: "Pending", value: pending, color: "text-amber-400" },
      { label: "Total", value: allTasks.length, color: "text-foreground" },
    ];
  }, [allTasks]);

  const typeLabels = {
    prep: "Prep",
    opening: "Opening",
    closing: "Closing",
    cleaning: "Cleaning",
    sidework: "Side Work",
  };

  const filtered = useMemo(() => {
    return allTasks.filter(t => {
      if (activeFilter === "completed") return t.status === "completed";
      if (activeFilter === "pending") return ["pending", "in_progress"].includes(t.status);
      return true;
    });
  }, [allTasks, activeFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(task => {
      if (!map[task.type]) map[task.type] = [];
      map[task.type].push(task);
    });
    return map;
  }, [filtered]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-32 bg-background min-h-screen">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-2">
        <h1 className="text-lg font-bold text-foreground">Master Checklists</h1>
      </div>

      <div className="grid grid-cols-4 gap-1 px-4 py-2">
        {metrics.map(m => (
          <div key={m.label} className="bg-card border border-border rounded-lg p-2">
            <p className={cn("text-xl font-bold", m.color)}>{m.value}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 px-4 py-1.5 border-b border-border overflow-x-auto">
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "completed", label: "Done" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "flex-shrink-0 h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
              activeFilter === f.id
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-card border-border text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-4">
        {Object.entries(grouped).map(([type, tasks]) => {
          if (tasks.length === 0) return null;
          return (
            <div key={type}>
              <h2 className="text-sm font-bold text-foreground mb-2.5">{typeLabels[type] || type}</h2>
              <div className="space-y-1">
                {tasks.map(task => {
                  const statusIcon = task.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Clock className="h-4 w-4 text-amber-400" />;
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleToggle(task.id)}
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-all active:scale-[0.98]",
                        task.status === "completed"
                          ? "bg-emerald-500/5 border-emerald-500/20 opacity-60"
                          : "bg-card border-border hover:border-border/80"
                      )}
                    >
                      {statusIcon}
                      <div className="flex-1 text-left">
                        <p className={cn("text-xs font-bold", task.status === "completed" && "line-through text-muted-foreground")}>
                          {task.name}
                        </p>
                        {task.description && <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                      </div>
                      {task.priority === "high" && <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const hideBase44Index = true;