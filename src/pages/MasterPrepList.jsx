import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronRight, ImageIcon, Flame, Minus } from "lucide-react";
import StationBadge from "../components/StationBadge";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";

export default function MasterPrepList() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openStations, setOpenStations] = useState({});
  const [photoModal, setPhotoModal] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const [s, pl, pi] = await Promise.all([
        base44.entities.Station.list(),
        base44.entities.PrepList.filter({ date: todayStr }),
        base44.entities.PrepItem.list("-created_date", 500),
      ]);
      setStations(s);
      setPrepLists(pl);
      setPrepItems(pi);
      // Open all stations by default
      const initial = {};
      s.forEach(st => { initial[st.id] = true; });
      setOpenStations(initial);
      setLoading(false);
    };
    load();
  }, []);

  const toggleStation = (id) => setOpenStations(prev => ({ ...prev, [id]: !prev[id] }));

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Master Prep List</h1>
        <p className="text-muted-foreground mt-1">Today's prep — {todayStr} — by station</p>
      </div>

      {stations.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground">
          No stations set up yet.
        </div>
      )}

      <div className="space-y-4">
        {stations.map((station, si) => {
          const stationLists = prepLists.filter(pl => pl.station_id === station.id);
          const listIds = stationLists.map(pl => pl.id);
          const items = prepItems
            .filter(pi => listIds.includes(pi.prep_list_id))
            .sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
          const completed = items.filter(i => i.status === "completed").length;
          const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
          const isOpen = openStations[station.id];

          return (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: si * 0.06 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              {/* Station header */}
              <button
                onClick={() => toggleStation(station.id)}
                className="w-full flex items-center gap-4 p-4 lg:p-5 hover:bg-secondary/40 transition-colors text-left"
              >
                <StationBadge name={station.name} color={station.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-accent rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{completed}/{items.length} done</span>
                  </div>
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>

              {/* Items */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    {items.length === 0 ? (
                      <p className="px-5 pb-5 text-sm text-muted-foreground">No prep items for today.</p>
                    ) : (
                      <div className="border-t border-border divide-y divide-border">
                        {items.map(item => (
                          <motion.div
                            key={item.id}
                            layout
                            className={`flex items-center gap-3 px-4 lg:px-5 py-3 transition-colors ${
                              item.status === "completed" ? "bg-accent/5" : ""
                            }`}
                          >
                            {/* Priority indicator */}
                            <div className="flex-shrink-0">
                              <PriorityBadge priority={item.priority || "medium"} />
                            </div>

                            {/* Item info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-sm ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                  {item.name}
                                </span>
                                <StatusBadge status={item.status} />
                              </div>
                              {(item.quantity || item.unit || item.notes) && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                                  {item.notes ? ` · ${item.notes}` : ""}
                                </p>
                              )}
                              {item.completed_by && (
                                <p className="text-xs text-accent mt-0.5">✓ {item.completed_by}</p>
                              )}
                            </div>

                            {/* Final product photo */}
                            {item.photo_url ? (
                              <button
                                onClick={() => setPhotoModal(item.photo_url)}
                                className="flex-shrink-0 group relative"
                              >
                                <img
                                  src={item.photo_url}
                                  alt="Final product"
                                  className="h-14 w-14 rounded-xl object-cover border border-border group-hover:border-primary transition-colors"
                                />
                                <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            ) : (
                              <div className="flex-shrink-0 h-14 w-14 rounded-xl border border-dashed border-border flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Photo modal */}
      <AnimatePresence>
        {photoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPhotoModal(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={photoModal}
              alt="Final product"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}