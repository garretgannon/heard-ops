import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Clock, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = {
  prep: { label: "Prep", color: "bg-blue-500/15 border-blue-500/30", textColor: "text-blue-600" },
  line: { label: "Line", color: "bg-purple-500/15 border-purple-500/30", textColor: "text-purple-600" },
  dish: { label: "Dish", color: "bg-cyan-500/15 border-cyan-500/30", textColor: "text-cyan-600" },
  sidework: { label: "Side Work", color: "bg-orange-500/15 border-orange-500/30", textColor: "text-orange-600" },
};

const STATUS_COLORS = {
  pending: "bg-red-500/15 border-red-500/30 text-red-600",
  in_progress: "bg-yellow-500/15 border-yellow-500/30 text-yellow-600",
  completed: "bg-green-500/15 border-green-500/30 text-green-600",
};

const STATUS_ICONS = {
  pending: AlertCircle,
  in_progress: Clock,
  completed: CheckCircle2,
};

export default function StaffTasks() {
  const { user } = useCurrentUser();
  const [prepItems, setPrepItems] = useState([]);
  const [sideWorkTasks, setSideWorkTasks] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const [pls, pi, sw, st] = await Promise.all([
        base44.entities.PrepList.filter({ date: todayStr }),
        base44.entities.PrepItem.list("-created_date", 200),
        base44.entities.SideWorkAssignment.filter({ date: todayStr }),
        base44.entities.Station.list(),
      ]);
      
      setPrepLists(pls);
      setPrepItems(pi.filter(item => pls.some(pl => pl.id === item.prep_list_id)));
      setSideWorkTasks(sw.filter(task => task.assigned_to_email === user?.email || !task.assigned_to_email));
      setStations(st);
      setLoading(false);
    };
    
    if (user?.email) load();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allTasks = [
    ...prepItems.map(item => ({
      id: item.id,
      name: item.name,
      status: item.status,
      priority: item.priority || "medium",
      category: "prep",
      station: stations.find(s => s.id === item.station_id)?.name,
      type: "prep",
      quantity: item.quantity,
      unit: item.unit,
      photo_url: item.photo_url,
    })),
    ...sideWorkTasks.map(task => ({
      id: task.id,
      name: task.task_name || "Side Work Task",
      status: task.status === "approved" ? "completed" : task.status === "completed" ? "in_progress" : "pending",
      priority: "medium",
      category: "sidework",
      station: "Front of House",
      type: "sidework",
      photo_url: task.photo_url,
    })),
  ];

  const completed = allTasks.filter(t => t.status === "completed").length;
  const total = allTasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by category, then sort by priority
  const groupedTasks = {};
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  
  allTasks.forEach(task => {
    const cat = task.category;
    if (!groupedTasks[cat]) groupedTasks[cat] = [];
    groupedTasks[cat].push(task);
  });

  Object.keys(groupedTasks).forEach(cat => {
    groupedTasks[cat].sort((a, b) => {
      const pd = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      return pd !== 0 ? pd : a.status === "pending" ? -1 : 1;
    });
  });

  const orderedGroups = ["prep", "line", "dish", "sidework"].filter(cat => groupedTasks[cat]?.length);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Today's Tasks</h1>
        <p className="text-muted-foreground mt-1">{todayStr}</p>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{completed}/{total} completed</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tasks by category */}
      {total === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground">No tasks today. Great work!</p>
        </div>
      ) : (
        orderedGroups.map(category => (
          <div key={category} className="space-y-3">
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${CATEGORIES[category]?.textColor}`}>
              {CATEGORIES[category]?.label}
            </h2>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {groupedTasks[category].map(task => {
                const StatusIcon = STATUS_ICONS[task.status];
                const hasPhoto = task.photo_url && task.status === "completed";

                return (
                  <Link
                    key={task.id}
                    to={task.type === "prep" ? `/prep-lists?id=${task.id}` : "/side-work"}
                    className="block"
                  >
                    <div
                      className={`rounded-xl border p-4 transition-all hover:shadow-md active:scale-95 cursor-pointer ${
                        STATUS_COLORS[task.status]
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {StatusIcon && (
                          <StatusIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight truncate">{task.name}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            {task.station && <span>{task.station}</span>}
                            {(task.quantity || task.unit) && (
                              <span className="font-mono">
                                {task.quantity}{task.unit ? ` ${task.unit}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        {hasPhoto && (
                          <img
                            src={task.photo_url}
                            alt="Complete"
                            className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}