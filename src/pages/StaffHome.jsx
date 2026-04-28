import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "../hooks/useCurrentUser";
import PrepStepsPanel from "../components/PrepStepsPanel";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, ListOrdered, MapPin, ClipboardList, Sun } from "lucide-react";
import { toast } from "sonner";

const SHIFT_LABELS = { morning: "Morning Shift", night: "Night Shift" };

export default function StaffHome() {
  const { user } = useCurrentUser();
  const [assignment, setAssignment] = useState(null);
  const [station, setStation] = useState(null);
  const [prepItems, setPrepItems] = useState([]);
  const [openSteps, setOpenSteps] = useState({});
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    if (!user?.email) return;

    // Find today's station assignment for this user
    const assignments = await base44.entities.StationAssignment.filter({
      user_email: user.email,
      date: todayStr,
    });

    if (assignments.length === 0) {
      setLoading(false);
      return;
    }

    const myAssignment = assignments[0];
    setAssignment(myAssignment);

    // Load station + prep lists + items in parallel
    const [stations, prepLists] = await Promise.all([
      base44.entities.Station.list(),
      base44.entities.PrepList.filter({ station_id: myAssignment.station_id, date: todayStr }),
    ]);

    const foundStation = stations.find(s => s.id === myAssignment.station_id);
    setStation(foundStation || null);

    if (prepLists.length > 0) {
      const listIds = prepLists.map(pl => pl.id);
      const allItems = await base44.entities.PrepItem.list("-sort_order", 500);
      const items = allItems.filter(pi => listIds.includes(pi.prep_list_id));
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
      setPrepItems(items);
    }

    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const toggleSteps = (id) => setOpenSteps(prev => ({ ...prev, [id]: !prev[id] }));

  const markComplete = async (item) => {
    await base44.entities.PrepItem.update(item.id, {
      status: item.status === "completed" ? "pending" : "completed",
      completed_by: item.status === "completed" ? "" : (user?.display_name || user?.full_name || user?.email),
      completed_at: item.status === "completed" ? "" : new Date().toISOString(),
    });
    toast.success(item.status === "completed" ? "Marked incomplete" : "Task completed!");
    load();
  };

  const completed = prepItems.filter(i => i.status === "completed").length;
  const total = prepItems.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {user?.display_name || user?.full_name?.split(" ")[0] || "Chef"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">{todayStr}</p>
      </motion.div>

      {/* No assignment */}
      {!assignment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-10 text-center space-y-2"
        >
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No station assigned today</p>
          <p className="text-sm text-muted-foreground">Check with your manager to get your station assignment.</p>
        </motion.div>
      )}

      {/* Station card */}
      {assignment && station && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-5 flex items-center gap-5"
        >
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Your Station</p>
            <p className="text-xl font-bold">{station.name}</p>
            {assignment.shift && (
              <p className="text-sm text-muted-foreground">{SHIFT_LABELS[assignment.shift] || assignment.shift}</p>
            )}
          </div>
          {total > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-accent">{progress}%</p>
              <p className="text-xs text-muted-foreground">{completed}/{total} done</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Progress bar */}
      {assignment && total > 0 && (
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      )}

      {/* Prep items */}
      {assignment && prepItems.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-2">
          <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No prep items today</p>
          <p className="text-sm text-muted-foreground">Your prep list is empty — you're all set!</p>
        </div>
      )}

      {prepItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />Prep List — {prepItems.length} items
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {prepItems.map((item, i) => (
              <div key={item.id}>
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 px-4 py-3.5 ${item.status === "completed" ? "bg-accent/5" : ""}`}
                >
                  {/* Complete toggle */}
                  <button onClick={() => markComplete(item)} className="flex-shrink-0">
                    {item.status === "completed"
                      ? <CheckCircle2 className="h-5 w-5 text-accent" />
                      : <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-primary transition-colors" />
                    }
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium text-sm ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {item.name}
                    </span>
                    {(item.quantity || item.unit) && (
                      <span className="ml-2 text-xs font-semibold bg-secondary text-foreground/70 px-2 py-0.5 rounded-md">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </span>
                    )}
                    {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                    {item.completed_by && (
                      <p className="text-xs text-accent mt-0.5">✓ {item.completed_by}</p>
                    )}
                  </div>

                  {/* Steps toggle */}
                  <button
                    onClick={() => toggleSteps(item.id)}
                    className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex-shrink-0"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                    {openSteps[item.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                </motion.div>

                {/* Steps panel */}
                <AnimatePresence>
                  {openSteps[item.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-secondary/20 border-t border-border"
                    >
                      <PrepStepsPanel itemId={item.id} isAdmin={false} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}